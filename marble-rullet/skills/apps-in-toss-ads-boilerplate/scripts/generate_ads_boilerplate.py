#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys

TEMPLATE_ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'templates'

OUTPUT_NAME_MAP = {
    'ads.config.ts.tpl': 'src/config/ads.ts',
    'ads.runtime.ts.tpl': 'src/ads/{runtime}/runtime.ts',
    'ads.telemetry.ts.tpl': 'src/ads/{runtime}/telemetry.ts',
    'service.ts.tpl': 'src/ads/{runtime}/{ad_type}/service.ts',
    'types.ts.tpl': 'src/ads/{runtime}/{ad_type}/types.ts',
    'pacing.ts.tpl': 'src/ads/{runtime}/{ad_type}/pacing.ts',
    'test.ts.tpl': 'src/ads/{runtime}/{ad_type}/service.test.ts',
    'component.tsx.tpl': 'src/ads/{runtime}/{ad_type}/component.tsx',
    'integration.md.tpl': 'docs/ads/{runtime}-{ad_type}-integration.md',
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Generate Apps-in-Toss ads boilerplate from runtime-first templates.')
    parser.add_argument('--runtime', choices=['webview', 'rn'], required=True)
    parser.add_argument('--type', dest='ad_type', choices=['banner', 'rewarded', 'interstitial'], required=True)
    parser.add_argument('--target', required=True, help='Target app root path')
    parser.add_argument('--feature-name', required=True)
    parser.add_argument('--flow-key', required=True)
    parser.add_argument('--placement-key', required=True)
    parser.add_argument('--ad-group-key', required=True)
    parser.add_argument('--production-ad-group-id', default='TODO_PRODUCTION_AD_GROUP_ID')
    parser.add_argument('--test-ad-group-id', default='TODO_TEST_AD_GROUP_ID')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    return parser


def render_template(raw: str, mapping: dict[str, str]) -> str:
    rendered = raw
    for key, value in mapping.items():
        rendered = rendered.replace(f'__{key}__', value)
    return rendered


def template_output_path(template_name: str, runtime: str, ad_type: str) -> Path:
    if template_name not in OUTPUT_NAME_MAP:
        raise KeyError(f'Unknown template output mapping: {template_name}')
    return Path(OUTPUT_NAME_MAP[template_name].format(runtime=runtime, ad_type=ad_type))


def collect_templates(runtime: str, ad_type: str) -> list[Path]:
    roots = [TEMPLATE_ROOT / runtime / 'config', TEMPLATE_ROOT / runtime / ad_type]
    templates: list[Path] = []
    for root in roots:
        if not root.exists():
            continue
        templates.extend(sorted(path for path in root.rglob('*.tpl') if path.is_file()))
    return templates


def main() -> int:
    args = build_parser().parse_args()
    target_root = Path(args.target).resolve()
    templates = collect_templates(args.runtime, args.ad_type)

    if not templates:
        print('No templates found for the selected runtime/type.', file=sys.stderr)
        return 1

    mapping = {
        'RUNTIME': args.runtime,
        'AD_TYPE': args.ad_type,
        'FEATURE_NAME': args.feature_name,
        'FLOW_KEY': args.flow_key,
        'PLACEMENT_KEY': args.placement_key,
        'AD_GROUP_KEY': args.ad_group_key,
        'PRODUCTION_AD_GROUP_ID': args.production_ad_group_id,
        'TEST_AD_GROUP_ID': args.test_ad_group_id,
        'FEATURE_NAME_CONST': args.feature_name.upper().replace(' ', '_').replace('-', '_'),
        'AD_GROUP_KEY_CONST': args.ad_group_key.upper().replace('-', '_'),
    }

    planned: list[tuple[Path, str]] = []
    for template_path in templates:
        output_rel = template_output_path(template_path.name, args.runtime, args.ad_type)
        output_path = target_root / output_rel
        if output_path.exists() and not args.force:
            print(f'Skipping existing file without --force: {output_path}')
            continue
        rendered = render_template(template_path.read_text(), mapping)
        planned.append((output_path, rendered))

    if args.dry_run:
        for output_path, _ in planned:
            print(output_path)
        return 0

    for output_path, rendered in planned:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered)
        print(f'Wrote {output_path}')

    if not planned:
        print('Nothing written. Existing files were skipped.', file=sys.stderr)
        return 1

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
