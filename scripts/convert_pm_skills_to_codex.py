#!/usr/bin/env python3
"""Convert phuryn/pm-skills into project-local Codex skills.

This script fetches the upstream GitHub repo over HTTP, copies universal skills
into `.codex/skills/`, adds Codex `agents/openai.yaml` metadata, and converts
Claude-only slash commands into Codex workflow-wrapper skills.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_REPO = "phuryn/pm-skills"
DEFAULT_BRANCH = "main"
DEFAULT_OUTPUT_DIR = Path(".codex/skills")
MANIFEST_FILE = ".pm-skills-codex-manifest.json"
USER_AGENT = "codex-pm-skills-converter/1.0"
PLUGIN_PREFIXES = (
    "pm-data-analytics",
    "pm-execution",
    "pm-go-to-market",
    "pm-market-research",
    "pm-marketing-growth",
    "pm-product-discovery",
    "pm-product-strategy",
    "pm-toolkit",
)
ACRONYMS = {
    "ab": "A/B",
    "api": "API",
    "csv": "CSV",
    "gtm": "GTM",
    "icp": "ICP",
    "jtbd": "JTBD",
    "nda": "NDA",
    "okrs": "OKRs",
    "pm": "PM",
    "prd": "PRD",
    "sql": "SQL",
    "ux": "UX",
    "wwa": "WWA",
    "wwas": "WWAs",
}
VERB_REWRITES = {
    "Analyze": "Analyze",
    "Break": "Break down",
    "Brainstorm": "Brainstorm",
    "Check": "Check",
    "Comprehensive": "Run",
    "Convert": "Convert",
    "Create": "Create",
    "Define": "Define",
    "Design": "Design",
    "Draft": "Draft",
    "Explore": "Explore",
    "Generate": "Generate",
    "Map": "Map",
    "Perform": "Analyze",
    "Plan": "Plan",
    "Prepare": "Prepare",
    "Review": "Review",
    "Run": "Run",
    "Summarize": "Summarize",
    "Tailor": "Tailor",
    "Transform": "Transform",
    "Write": "Write",
}


@dataclass(frozen=True)
class RemoteFile:
    path: str
    plugin: str
    kind: str
    name: str


def _request(url: str):
    return Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": USER_AGENT,
        },
    )


def fetch_text(url: str) -> str:
    try:
        with urlopen(_request(url), timeout=30) as response:
            return response.read().decode("utf-8")
    except HTTPError as error:
        raise RuntimeError(f"HTTP {error.code} while fetching {url}") from error
    except URLError as error:
        raise RuntimeError(f"Network error while fetching {url}: {error}") from error


def fetch_json(url: str) -> object:
    return json.loads(fetch_text(url))


def repo_tree_url(repo: str, branch: str) -> str:
    return f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1"


def raw_file_url(repo: str, branch: str, path: str) -> str:
    return f"https://raw.githubusercontent.com/{repo}/{branch}/{path}"


def parse_frontmatter(markdown: str) -> tuple[dict[str, str], str]:
    match = re.match(r"^---\n(.*?)\n---\n?(.*)$", markdown, re.S)
    if not match:
        return {}, markdown

    frontmatter_text, body = match.groups()
    frontmatter: dict[str, str] = {}
    for raw_line in frontmatter_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip('"').strip("'")
    return frontmatter, body.lstrip("\n")


def dump_frontmatter(frontmatter: dict[str, str], body: str) -> str:
    lines = ["---"]
    for key, value in frontmatter.items():
        escaped = value.replace('"', '\\"')
        lines.append(f'{key}: "{escaped}"')
    lines.append("---")
    lines.append("")
    lines.append(body.rstrip() + "\n")
    return "\n".join(lines)


def iter_remote_files(tree: Iterable[dict[str, object]]) -> tuple[list[RemoteFile], list[RemoteFile]]:
    skills: list[RemoteFile] = []
    commands: list[RemoteFile] = []
    for item in tree:
        if item.get("type") != "blob":
            continue
        path = str(item.get("path", ""))
        skill_match = re.match(r"^(pm-[^/]+)/skills/([^/]+)/SKILL\.md$", path)
        if skill_match:
            plugin, name = skill_match.groups()
            skills.append(RemoteFile(path=path, plugin=plugin, kind="skill", name=name))
            continue
        command_match = re.match(r"^(pm-[^/]+)/commands/([^/]+)\.md$", path)
        if command_match:
            plugin, name = command_match.groups()
            commands.append(RemoteFile(path=path, plugin=plugin, kind="command", name=name))
    return sorted(skills, key=lambda item: item.name), sorted(commands, key=lambda item: item.name)


def humanize_slug(slug: str) -> str:
    words = []
    for part in slug.split("-"):
        words.append(ACRONYMS.get(part.lower(), part.capitalize()))
    return " ".join(words)


def description_lead(description: str) -> str:
    if not description:
        return "Use this skill for product-management workflows"
    lead = re.split(r"\bUse when\b", description, flags=re.I)[0].strip()
    lead = re.split(r"\.\s+", lead, maxsplit=1)[0].strip()
    lead = lead.rstrip(" .")
    if " — " in lead:
        lead = lead.split(" — ", 1)[0].strip()
    if ":" in lead and len(lead) > 80:
        lead = lead.split(":", 1)[0].strip()
    return lead or description.strip().rstrip(" .")


def concise_action(description: str, fallback_name: str) -> str:
    lead = description_lead(description)
    if not lead:
        return f"use the {humanize_slug(fallback_name)} workflow"
    first_word, *rest = lead.split()
    action = VERB_REWRITES.get(first_word, first_word)
    rewritten = " ".join([action, *rest]).strip()
    if rewritten and rewritten[0].islower():
        rewritten = rewritten[0].upper() + rewritten[1:]
    return rewritten.rstrip(".")


def short_description(description: str, fallback_name: str) -> str:
    action = concise_action(description, fallback_name)
    if len(action) <= 72:
        return action
    truncated = action[:69].rstrip()
    if " " in truncated:
        truncated = truncated.rsplit(" ", 1)[0]
    return truncated + "…"


def default_prompt(skill_name: str, description: str) -> str:
    action = concise_action(description, skill_name)
    action = action[0].lower() + action[1:] if action else f"use the {skill_name} workflow"
    return f"Use ${skill_name} to {action}."


def emit_openai_yaml(skill_name: str, description: str) -> str:
    data = {
        "interface": {
            "display_name": humanize_slug(skill_name),
            "short_description": short_description(description, skill_name),
            "default_prompt": default_prompt(skill_name, description),
        }
    }
    def esc(value: str) -> str:
        return value.replace("\\", "\\\\").replace("\"", "\\\"")

    # Keep YAML simple and deterministic without a dependency.
    return (
        "interface:\n"
        f'  display_name: "{esc(data["interface"]["display_name"])}"\n'
        f'  short_description: "{esc(data["interface"]["short_description"])}"\n'
        f'  default_prompt: "{esc(data["interface"]["default_prompt"])}"\n'
    )


def command_skill_name(command_name: str) -> str:
    return f"pm-workflow-{command_name}"


def remove_generated_dirs(output_dir: Path, manifest_path: Path) -> None:
    if not manifest_path.exists():
        return
    try:
        manifest = json.loads(manifest_path.read_text())
    except json.JSONDecodeError:
        return
    for rel_path in manifest.get("generated_dirs", []):
        target = output_dir / rel_path
        if target.exists() and target.is_dir():
            shutil.rmtree(target)


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content, encoding="utf-8")


def convert_skill_markdown(remote: RemoteFile, repo: str, branch: str, content: str) -> tuple[str, str]:
    frontmatter, body = parse_frontmatter(content)
    name = frontmatter.get("name", remote.name)
    description = frontmatter.get("description", f"Product management skill: {humanize_slug(remote.name)}")
    normalized = dump_frontmatter({"name": name, "description": description}, body)
    return name, normalized


def render_command_wrapper(remote: RemoteFile, content: str) -> tuple[str, str, str]:
    frontmatter, body = parse_frontmatter(content)
    original_title = re.search(r"^#\s+(.+)$", body, re.M)
    original_heading = original_title.group(1).strip() if original_title else remote.name
    description = frontmatter.get("description", f"Run the {remote.name} workflow")
    argument_hint = frontmatter.get("argument-hint", "")
    skill_name = command_skill_name(remote.name)
    base_description = description_lead(description)
    skill_description = (
        f"{base_description} in Codex. "
        f"Codex wrapper for Claude's /{remote.name} command."
    )

    cleaned_body = body.rstrip()
    cleaned_body = re.sub(rf"^#\s+/({re.escape(remote.name)})\s+--\s+", "# ", cleaned_body, count=1, flags=re.M)
    cleaned_body = re.sub(r"^#\s+", "## ", cleaned_body, count=1, flags=re.M)

    intro = [
        f"# PM Workflow: {humanize_slug(remote.name)}",
        "",
        f"This skill is the Codex conversion of Claude's `/{remote.name}` command from the PM Skills Marketplace.",
        f"It preserves the original workflow and underlying PM frameworks, but packages them as a Codex skill instead of a slash command.",
        "",
        "## Codex Usage",
    ]
    if argument_hint:
        intro.extend(
            [
                f"- Recommended invocation: `${skill_name} {argument_hint}`",
                f"- Original Claude argument hint: `{argument_hint}`",
            ]
        )
    else:
        intro.append(f"- Recommended invocation: `${skill_name}`")
    intro.extend(
        [
            f"- Source plugin: `{remote.plugin}`",
            f"- Original Claude command: `/{remote.name}`",
            "",
            "## Execution Guidance",
            "- Ask only for the minimum missing context needed to continue.",
            "- If the user already provided enough context, skip the interview-style questions and produce the workflow output directly.",
            "- Reuse the imported PM skills referenced below whenever they fit the task.",
            "- Save substantial deliverables as markdown files when helpful.",
            "",
            "## Upstream Workflow",
            "",
        ]
    )
    combined_body = "\n".join(intro) + cleaned_body + "\n"
    wrapped = dump_frontmatter({"name": skill_name, "description": skill_description}, combined_body)
    return skill_name, skill_description, wrapped


def render_marketplace_hub(commands: list[RemoteFile]) -> tuple[str, str, str]:
    name = "pm-marketplace"
    description = (
        "Route PM Skills Marketplace requests in Codex. Use when you want help choosing the right discovery, strategy, research, execution, growth, analytics, or toolkit workflow, or when you want a Codex equivalent of a Claude PM slash command."
    )

    grouped: dict[str, list[RemoteFile]] = {}
    for command in commands:
        grouped.setdefault(command.plugin, []).append(command)

    sections = [
        "# PM Skills Marketplace for Codex",
        "",
        "This hub skill helps choose between the imported PM skills and the converted workflow-wrapper skills.",
        "Use a wrapper when you want the end-to-end workflow that originally lived behind a Claude slash command.",
        "Use the underlying imported skill when you want a focused framework or document template.",
        "",
        "## Wrapper naming convention",
        "- Every converted Claude command is available as `$pm-workflow-<command-name>`.",
        "- Example: Claude `/discover` → Codex `$pm-workflow-discover`.",
        "",
        "## Best-effort routing rules",
        "- If the user asks for a complete workflow, prefer the matching `$pm-workflow-*` skill.",
        "- If the user asks for a specific framework (for example PRD, SWOT, opportunity-solution-tree, cohort analysis), prefer the matching imported skill directly.",
        "- If the request is ambiguous, propose 2-3 likely workflow options and continue with the best match.",
        "",
        "## Available Codex workflow wrappers",
        "",
    ]

    for plugin in sorted(grouped):
        sections.append(f"### {plugin}")
        for command in sorted(grouped[plugin], key=lambda item: item.name):
            sections.append(f"- `/{command.name}` → `$pm-workflow-{command.name}`")
        sections.append("")

    sections.extend(
        [
            "## High-signal starting points",
            "- New idea or feature discovery: `$pm-workflow-discover`",
            "- Product strategy: `$pm-workflow-strategy`",
            "- PRD writing: `$pm-workflow-write-prd` or `$create-prd`",
            "- Launch planning: `$pm-workflow-plan-launch`",
            "- North Star metrics: `$pm-workflow-north-star`",
            "- User research synthesis: `$pm-workflow-research-users` or `$pm-workflow-interview`",
            "- Pricing strategy: `$pm-workflow-pricing`",
            "- Growth strategy: `$pm-workflow-growth-strategy`",
            "",
            "## Notes",
            "- Upstream universal skills were imported with their original names and descriptions.",
            "- The original Claude commands were converted into Codex skills with a `pm-workflow-` prefix to avoid collisions.",
            "- If a workflow references another skill, assume that skill is installed in the same `.codex/skills/` directory.",
        ]
    )

    return name, description, dump_frontmatter({"name": name, "description": description}, "\n".join(sections) + "\n")


def convert(repo: str, branch: str, output_dir: Path, include_skills: bool, include_workflows: bool, clean_generated: bool, dry_run: bool) -> dict[str, object]:
    output_dir = output_dir.expanduser()
    manifest_path = output_dir / MANIFEST_FILE
    tree_data = fetch_json(repo_tree_url(repo, branch))
    if not isinstance(tree_data, dict) or "tree" not in tree_data:
        raise RuntimeError("Unexpected GitHub API response: missing tree")

    skills, commands = iter_remote_files(tree_data["tree"])

    generated_dirs: list[str] = []
    written_files: list[str] = []

    if clean_generated and not dry_run:
        remove_generated_dirs(output_dir, manifest_path)

    if include_skills:
        for remote in skills:
            content = fetch_text(raw_file_url(repo, branch, remote.path))
            skill_name, normalized = convert_skill_markdown(remote, repo, branch, content)
            frontmatter, _ = parse_frontmatter(normalized)
            description = frontmatter.get("description", f"Product management skill: {skill_name}")
            target_dir = output_dir / skill_name
            generated_dirs.append(skill_name)
            if not dry_run:
                write_text(target_dir / "SKILL.md", normalized)
                write_text(target_dir / "agents/openai.yaml", emit_openai_yaml(skill_name, description))
            written_files.extend([
                str((target_dir / "SKILL.md").as_posix()),
                str((target_dir / "agents/openai.yaml").as_posix()),
            ])

    if include_workflows:
        for remote in commands:
            content = fetch_text(raw_file_url(repo, branch, remote.path))
            skill_name, description, wrapped = render_command_wrapper(remote, content)
            target_dir = output_dir / skill_name
            generated_dirs.append(skill_name)
            if not dry_run:
                write_text(target_dir / "SKILL.md", wrapped)
                write_text(target_dir / "agents/openai.yaml", emit_openai_yaml(skill_name, description))
            written_files.extend([
                str((target_dir / "SKILL.md").as_posix()),
                str((target_dir / "agents/openai.yaml").as_posix()),
            ])

        hub_name, hub_description, hub_markdown = render_marketplace_hub(commands)
        hub_dir = output_dir / hub_name
        generated_dirs.append(hub_name)
        if not dry_run:
            write_text(hub_dir / "SKILL.md", hub_markdown)
            write_text(hub_dir / "agents/openai.yaml", emit_openai_yaml(hub_name, hub_description))
        written_files.extend([
            str((hub_dir / "SKILL.md").as_posix()),
            str((hub_dir / "agents/openai.yaml").as_posix()),
        ])

    unique_dirs = sorted(set(generated_dirs))
    manifest = {
        "source_repo": repo,
        "branch": branch,
        "generated_dirs": unique_dirs,
        "skill_count": len(skills) if include_skills else 0,
        "workflow_count": len(commands) if include_workflows else 0,
    }
    if not dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
        write_text(manifest_path, json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    written_files.append(str(manifest_path.as_posix()))

    return {
        "skills": len(skills) if include_skills else 0,
        "workflows": len(commands) if include_workflows else 0,
        "generated_dirs": unique_dirs,
        "written_files": written_files,
        "output_dir": str(output_dir),
        "manifest_path": str(manifest_path),
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=DEFAULT_REPO, help=f"GitHub repo in owner/name format (default: {DEFAULT_REPO})")
    parser.add_argument("--branch", default=DEFAULT_BRANCH, help=f"Git branch or tag to fetch (default: {DEFAULT_BRANCH})")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help=f"Where to write Codex skills (default: {DEFAULT_OUTPUT_DIR})")
    parser.add_argument("--skills-only", action="store_true", help="Only import upstream universal skills")
    parser.add_argument("--workflows-only", action="store_true", help="Only generate workflow-wrapper skills from Claude commands")
    parser.add_argument("--no-clean", action="store_true", help="Do not remove previously generated pm-skills directories before regenerating")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and plan the conversion without writing files")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    include_skills = not args.workflows_only
    include_workflows = not args.skills_only

    if args.skills_only and args.workflows_only:
        print("error: --skills-only and --workflows-only cannot be used together", file=sys.stderr)
        return 2

    try:
        result = convert(
            repo=args.repo,
            branch=args.branch,
            output_dir=Path(args.output_dir),
            include_skills=include_skills,
            include_workflows=include_workflows,
            clean_generated=not args.no_clean,
            dry_run=args.dry_run,
        )
    except Exception as error:  # noqa: BLE001
        print(f"conversion failed: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
