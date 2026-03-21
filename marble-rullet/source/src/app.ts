import { createWebviewBannerAdController } from './ads/webview/banner/service';
import options from './options';
import type { Roulette, RouletteLeaderboardEntry } from './roulette';
import { parseName } from './utils/utils';

type WinnerMode = 'first' | 'last' | 'custom';
type DrawPhase = 'idle' | 'loading' | 'running' | 'error';
type EngineState = 'loading' | 'ready' | 'error';
type ToastTone = 'info' | 'error';

type RecentPreset = {
  id: string;
  label: string;
  names: string[];
  updatedAt: number;
};

type ResultSnapshot = {
  winner: { name: string; hue: number; rank: number } | null;
  rankings: RouletteLeaderboardEntry[];
  selectedRank: number;
  participantCount: number;
};

const STORAGE_KEYS = {
  presets: 'marble_draw_recent_presets',
  mode: 'marble_draw_mode',
  map: 'marble_draw_map',
  names: 'marble_draw_names',
};

const MAX_RECENT_PRESETS = 4;
const sessionStorageFallback = new Map<string, string>();

function qs<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseInputNames(text: string) {
  return text
    .trim()
    .split(/[,\n\r]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeNames(source: string[]) {
  const nameSet = new Set<string>();
  const nameCounts: Record<string, number> = {};

  source.forEach((nameSource) => {
    const parsed = parseName(nameSource);
    if (!parsed) return;
    const key = parsed.weight > 1 ? `${parsed.name}/${parsed.weight}` : parsed.name;

    if (!nameSet.has(key)) {
      nameSet.add(key);
      nameCounts[key] = 0;
    }

    nameCounts[key] += parsed.count;
  });

  return Object.entries(nameCounts).map(([key, count]) => (count > 1 ? `${key}*${count}` : key));
}

function buildPresetLabel(names: string[]) {
  const visible = names.slice(0, 2).join(', ');
  const extra = names.length > 2 ? ` +${names.length - 2}` : '';
  return `${visible}${extra}`;
}

function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
  return Promise.resolve();
}

function countLabel(count: number) {
  return `${count}명`;
}

function track(name: string, params: Record<string, unknown> = {}) {
  window.dispatchEvent(
    new CustomEvent('the-rullet:event', {
      detail: { name, params, timestamp: Date.now() },
    })
  );
  console.info(`[the-rullet:event] ${name}`, params);
}

export function bootstrapApp(roulette: Roulette) {
  const elements = {
    body: document.body,
    composeScreen: qs<HTMLElement>('[data-screen="compose"]'),
    drawScreen: qs<HTMLElement>('[data-screen="draw"]'),
    resultScreen: qs<HTMLElement>('[data-screen="result"]'),
    composeState: qs<HTMLElement>('#composeState'),
    quickAddInput: qs<HTMLInputElement>('#quickAddName'),
    quickAddButton: qs<HTMLButtonElement>('#btnQuickAddName'),
    quickEditCancelButton: qs<HTMLButtonElement>('#btnCancelQuickEdit'),
    dedupeNamesButton: qs<HTMLButtonElement>('#btnDedupeNames'),
    clearAllNamesButton: qs<HTMLButtonElement>('#btnClearAllNames'),
    namePreview: qs<HTMLElement>('#namePreview'),
    namePreviewCount: qs<HTMLElement>('#namePreviewCount'),
    inputHelper: qs<HTMLParagraphElement>('#inputHelper'),
    participantCount: qs<HTMLElement>('#participantCount'),
    ctaTitle: qs<HTMLElement>('#ctaTitle'),
    ctaHelper: qs<HTMLElement>('#ctaHelper'),
    startButton: qs<HTMLButtonElement>('#btnStart'),
    winnerModeControl: qs<HTMLElement>('#winnerModeControl'),
    customRankWrap: qs<HTMLElement>('#customRankWrap'),
    customRankInput: qs<HTMLInputElement>('#inWinningRank'),
    customRankHelper: qs<HTMLParagraphElement>('#customRankHelper'),
    customRankDownButton: qs<HTMLButtonElement>('#btnCustomRankDown'),
    customRankUpButton: qs<HTMLButtonElement>('#btnCustomRankUp'),
    mapSelect: qs<HTMLSelectElement>('#sltMap'),
    presetList: qs<HTMLElement>('#presetList'),
    clearPresetsButton: qs<HTMLButtonElement>('#btnClearPresets'),
    drawStatusCount: qs<HTMLElement>('#drawStatusCount'),
    drawStatusMode: qs<HTMLElement>('#drawStatusMode'),
    drawStateCard: qs<HTMLElement>('#drawStateCard'),
    drawEyebrow: qs<HTMLElement>('#drawEyebrow'),
    drawHeadline: qs<HTMLElement>('#drawHeadline'),
    drawSubline: qs<HTMLElement>('#drawSubline'),
    drawErrorActions: qs<HTMLElement>('#drawErrorActions'),
    exitDrawButton: qs<HTMLButtonElement>('#btnExitDraw'),
    retryDrawButton: qs<HTMLButtonElement>('#btnRetryDraw'),
    returnComposeButton: qs<HTMLButtonElement>('#btnReturnCompose'),
    resultWinner: qs<HTMLElement>('#resultWinner'),
    resultMeta: qs<HTMLElement>('#resultMeta'),
    resultList: qs<HTMLOListElement>('#resultList'),
    rankingCount: qs<HTMLElement>('#rankingCount'),
    bannerAdSection: qs<HTMLElement>('#bannerAdSection'),
    bannerAdSlot: qs<HTMLElement>('#bannerAdSlot'),
    rerunButton: qs<HTMLButtonElement>('#btnRerun'),
    editNamesButton: qs<HTMLButtonElement>('#btnEditNames'),
    copyResultButton: qs<HTMLButtonElement>('#btnCopyResult'),
    toast: qs<HTMLElement>('#toast'),
  };

  let storageFallback = false;
  let storageWarningShown = false;
  let toastTimer = 0;

  const markStorageFallback = () => {
    storageFallback = true;
  };

  const readStoredValue = (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        sessionStorageFallback.set(key, stored);
      }
      return stored ?? sessionStorageFallback.get(key) ?? null;
    } catch {
      markStorageFallback();
      return sessionStorageFallback.get(key) ?? null;
    }
  };

  const writeStoredValue = (key: string, value: string) => {
    sessionStorageFallback.set(key, value);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      markStorageFallback();
      return false;
    }
  };

  const readStoredJson = <T>(key: string, fallback: T) => {
    const raw = readStoredValue(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      markStorageFallback();
      return fallback;
    }
  };

  const writeStoredJson = <T>(key: string, value: T) => writeStoredValue(key, JSON.stringify(value));

  const showToast = (message: string, tone: ToastTone = 'info') => {
    elements.toast.textContent = message;
    elements.toast.dataset.tone = tone;
    elements.toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove('is-visible');
    }, 1800);

    if (tone === 'error') {
      track('error_toast_shown', { type: message });
    }
  };

  const state = {
    winnerMode: (readStoredValue(STORAGE_KEYS.mode) as WinnerMode | null) ?? 'first',
    selectedMap: Number.parseInt(readStoredValue(STORAGE_KEYS.map) ?? '0', 10) || 0,
    activeNames: [] as string[],
    activeResult: null as ResultSnapshot | null,
    recentPresets: readStoredJson<RecentPreset[]>(STORAGE_KEYS.presets, []),
    isRunning: false,
    engineState: (roulette.isReady ? 'ready' : 'loading') as EngineState,
    drawPhase: 'idle' as DrawPhase,
    drawErrorMessage: '',
    inputSource: (readStoredValue(STORAGE_KEYS.names) ? 'restored' : 'manual') as 'manual' | 'preset' | 'restored',
    lastDrawStartedAt: 0,
    editingName: null as string | null,
    draftNames: normalizeNames(parseInputNames(readStoredValue(STORAGE_KEYS.names) ?? '')),
  };

  const bannerAdController = createWebviewBannerAdController({
    elements: {
      body: elements.body,
      section: elements.bannerAdSection,
      slot: elements.bannerAdSlot,
    },
    track,
  });

  const switchScreen = (screen: 'compose' | 'draw' | 'result') => {
    elements.body.classList.remove('mode-compose', 'mode-draw', 'mode-result');
    elements.body.classList.add(`mode-${screen}`);

    bannerAdController.onScreenChange(screen);
  };

  const persistText = () => {
    writeStoredValue(STORAGE_KEYS.names, state.draftNames.join('\n'));
  };

  const getNames = () => state.draftNames.slice();
  let draggedName: string | null = null;

  const setInputNames = (names: string[], source: 'manual' | 'preset' | 'restored' = 'manual') => {
    state.draftNames = names.slice();
    state.inputSource = source;
    persistText();
    updateFormState();
  };

  const resetQuickEditor = () => {
    state.editingName = null;
    elements.quickAddInput.value = '';
    elements.quickAddInput.placeholder = '한 명씩 빠르게 추가';
    elements.quickAddButton.textContent = '추가';
    elements.quickEditCancelButton.classList.add('is-hidden');
  };

  const startQuickEdit = (name: string) => {
    state.editingName = name;
    elements.quickAddInput.value = name;
    elements.quickAddInput.placeholder = '이름 수정';
    elements.quickAddButton.textContent = '수정';
    elements.quickEditCancelButton.classList.remove('is-hidden');
    elements.quickAddInput.focus();
    elements.quickAddInput.select();
  };

  const renderNamePreview = (names: string[]) => {
    const normalized = normalizeNames(names);
    elements.namePreviewCount.textContent = countLabel(normalized.length);
    elements.namePreview.innerHTML = '';

    if (!normalized.length) {
      elements.namePreview.classList.add('is-empty');
      elements.namePreview.textContent = '이름을 입력하면 보기 쉬운 카드 형태로 정리돼요.';
      return;
    }

    elements.namePreview.classList.remove('is-empty');
    const fragment = document.createDocumentFragment();

    normalized.forEach((name, index) => {
      const item = document.createElement('li');
      item.className = 'name-preview-item';
      item.draggable = true;
      item.dataset.name = name;
      const indexBadge = document.createElement('span');
      indexBadge.className = 'name-preview-index';
      indexBadge.textContent = String(index + 1);

      const text = document.createElement('span');
      text.className = 'name-preview-text';
      text.textContent = name;

      const reorderHandle = document.createElement('span');
      reorderHandle.className = 'name-preview-reorder';
      reorderHandle.textContent = '순서';
      reorderHandle.title = '드래그해서 순서 변경';

      const moveButtons = document.createElement('div');
      moveButtons.className = 'name-preview-move';

      const moveUpButton = document.createElement('button');
      moveUpButton.type = 'button';
      moveUpButton.className = 'name-preview-move-btn';
      moveUpButton.dataset.name = name;
      moveUpButton.dataset.move = 'up';
      moveUpButton.textContent = '↑';

      const moveDownButton = document.createElement('button');
      moveDownButton.type = 'button';
      moveDownButton.className = 'name-preview-move-btn';
      moveDownButton.dataset.name = name;
      moveDownButton.dataset.move = 'down';
      moveDownButton.textContent = '↓';

      moveButtons.append(moveUpButton, moveDownButton);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'name-preview-remove';
      removeButton.dataset.name = name;
      removeButton.textContent = '삭제';

      item.append(indexBadge, text, reorderHandle, moveButtons, removeButton);
      fragment.appendChild(item);
    });

    elements.namePreview.appendChild(fragment);
  };

  const addQuickName = () => {
    const nextName = elements.quickAddInput.value.trim();
    if (!nextName) {
      elements.quickAddInput.focus();
      return;
    }

    if (state.editingName) {
      const currentNames = normalizeNames(getNames());
      const editingIndex = currentNames.indexOf(state.editingName);
      const nextNames =
        editingIndex >= 0
          ? normalizeNames(currentNames.map((name, index) => (index === editingIndex ? nextName : name)))
          : normalizeNames([...currentNames, nextName]);

      setInputNames(nextNames, 'manual');
      resetQuickEditor();
      showToast('참여자 이름을 수정했어요.');
      track('participant_edited', { participant_count: nextNames.length });
      return;
    }

    const mergedNames = normalizeNames([...getNames(), nextName]);
    setInputNames(mergedNames, 'manual');
    resetQuickEditor();
    elements.quickAddInput.focus();
    showToast('참여자를 추가했어요.');
    track('participant_added', { participant_count: mergedNames.length });
  };

  const reorderNames = (names: string[], fromName: string, toName: string) => {
    const orderedNames = normalizeNames(names);
    const fromIndex = orderedNames.indexOf(fromName);
    const toIndex = orderedNames.indexOf(toName);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return orderedNames;
    }

    const nextNames = orderedNames.slice();
    const [movedName] = nextNames.splice(fromIndex, 1);
    nextNames.splice(toIndex, 0, movedName);
    return nextNames;
  };

  const moveNameByOffset = (name: string, offset: -1 | 1) => {
    const orderedNames = normalizeNames(getNames());
    const currentIndex = orderedNames.indexOf(name);
    if (currentIndex < 0) return;

    const nextIndex = clamp(currentIndex + offset, 0, orderedNames.length - 1);
    if (nextIndex === currentIndex) return;

    const nextNames = orderedNames.slice();
    const [movedName] = nextNames.splice(currentIndex, 1);
    nextNames.splice(nextIndex, 0, movedName);
    setInputNames(nextNames, 'manual');
    showToast('참여자 순서를 바꿨어요.');
    track('participant_reordered', { participant_count: nextNames.length });
  };

  const clearDropTargetState = () => {
    elements.namePreview.querySelectorAll('.name-preview-item').forEach((item) => {
      item.classList.remove('is-drop-target', 'is-dragging');
    });
  };

  const getWinnerRank = (count: number) => {
    if (state.winnerMode === 'last') return count;
    if (state.winnerMode === 'custom') {
      const parsed = Number.parseInt(elements.customRankInput.value, 10);
      return clamp(Number.isNaN(parsed) ? 1 : parsed, 1, Math.max(count, 1));
    }
    return 1;
  };

  const modeLabel = (count: number) => {
    if (state.winnerMode === 'last') return '마지막 도착';
    if (state.winnerMode === 'custom') return `${getWinnerRank(Math.max(count, 1))}등 선정`;
    return '1등 선정';
  };

  const modeLabelCompact = (count: number) => {
    if (state.winnerMode === 'last') return '마지막';
    if (state.winnerMode === 'custom') return `${getWinnerRank(Math.max(count, 1))}등`;
    return '1등';
  };

  const renderComposeState = () => {
    let message = '';
    let tone: 'info' | 'warning' | 'error' = 'info';

    if (state.engineState === 'error') {
      tone = 'error';
      message = '추첨 화면을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.';
    } else if (state.engineState === 'loading') {
      tone = 'info';
      message = '추첨 엔진을 준비하고 있어요. 준비가 끝나면 바로 시작할 수 있어요.';
    } else if (storageFallback) {
      tone = 'warning';
      message = '기기 저장소를 사용할 수 없어 최근 구성은 이번 세션에만 임시로 보관돼요.';
    }

    if (message) {
      elements.composeState.textContent = message;
      elements.composeState.dataset.tone = tone;
      elements.composeState.classList.remove('is-hidden');
    } else {
      elements.composeState.textContent = '';
      elements.composeState.classList.add('is-hidden');
      delete elements.composeState.dataset.tone;
    }
  };

  const updateCustomRankState = (count: number) => {
    const maxRank = Math.max(count, 1);
    const currentInput = Number.parseInt(elements.customRankInput.value, 10);
    const normalizedRank = clamp(Number.isNaN(currentInput) ? 1 : currentInput, 1, maxRank);
    const wasClamped = currentInput !== normalizedRank;
    elements.customRankInput.value = String(normalizedRank);

    const showHelper = state.winnerMode === 'custom';
    elements.customRankHelper.classList.toggle('is-hidden', !showHelper);
    elements.customRankHelper.classList.remove('is-error');

    if (!showHelper) return;

    if (count < 1) {
      elements.customRankHelper.textContent = '참여자를 먼저 입력하면 순위를 고를 수 있어요.';
      elements.customRankHelper.classList.add('is-error');
      return;
    }

    if (wasClamped) {
      elements.customRankHelper.textContent = `순위는 1명부터 ${countLabel(count)} 사이로 자동 조정돼요.`;
      elements.customRankHelper.classList.add('is-error');
      return;
    }

    elements.customRankHelper.textContent = `${normalizedRank}등을 선택해요.`;
  };

  const updateFormState = () => {
    const names = getNames();
    const valid = names.length >= 1;
    const rank = getWinnerRank(names.length || 1);

    renderNamePreview(names);
    elements.participantCount.textContent = countLabel(names.length);
    elements.startButton.disabled = !valid || state.engineState !== 'ready';

    updateCustomRankState(names.length);

    if (valid) {
      elements.inputHelper.textContent = `${countLabel(names.length)} 참여자 · ${rank}등 기준으로 추첨할 수 있어요.`;
      elements.inputHelper.classList.remove('is-error');
      elements.ctaTitle.textContent = `${countLabel(names.length)} · ${modeLabel(names.length)}`;
      elements.ctaHelper.textContent =
        state.engineState === 'ready'
          ? '입력이 완료됐어요. 지금 바로 공정하게 추첨할 수 있어요.'
          : '추첨 엔진이 준비되면 바로 시작할 수 있어요.';
    } else {
      elements.inputHelper.textContent = '이름을 1명 이상 입력해 주세요.';
      elements.inputHelper.classList.add('is-error');
      elements.ctaTitle.textContent = '참여자를 입력해 주세요';
      elements.ctaHelper.textContent = '입력이 끝나면 바로 추첨을 시작할 수 있어요.';
    }

    renderComposeState();
  };

  const renderPresets = () => {
    elements.presetList.innerHTML = '';
    elements.clearPresetsButton.disabled = state.recentPresets.length === 0;

    if (!state.recentPresets.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-preset';
      empty.textContent = '최근에 사용한 참여자 그룹이 여기에 표시돼요.';
      elements.presetList.appendChild(empty);
      return;
    }

    state.recentPresets.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'preset-chip';
      button.innerHTML = `<strong>${preset.label}</strong><span>${countLabel(preset.names.length)} 구성</span>`;
      button.addEventListener('click', () => {
        setInputNames(preset.names, 'preset');
        showToast('최근 구성을 불러왔어요.');
        track('preset_applied', { preset_size: preset.names.length });
      });
      elements.presetList.appendChild(button);
    });
  };

  const savePreset = (names: string[]) => {
    const normalized = normalizeNames(names);
    const id = normalized.join('|');
    const preset: RecentPreset = {
      id,
      label: buildPresetLabel(normalized),
      names: normalized,
      updatedAt: Date.now(),
    };

    state.recentPresets = [preset, ...state.recentPresets.filter((item) => item.id !== id)]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_RECENT_PRESETS);

    writeStoredJson(STORAGE_KEYS.presets, state.recentPresets);
    renderPresets();
  };

  const setWinnerMode = (mode: WinnerMode, shouldTrack = true) => {
    state.winnerMode = mode;
    writeStoredValue(STORAGE_KEYS.mode, mode);

    elements.winnerModeControl.querySelectorAll<HTMLButtonElement>('.segment').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.mode === mode);
    });

    elements.customRankWrap.classList.toggle('is-hidden', mode !== 'custom');
    updateFormState();

    if (shouldTrack) {
      track('winner_mode_changed', { mode });
    }
  };

  const updateDrawState = () => {
    elements.drawStatusCount.textContent = countLabel(state.activeNames.length);
    elements.drawStatusMode.textContent = modeLabelCompact(state.activeNames.length);
    elements.drawStateCard.classList.toggle('is-error', state.drawPhase === 'error');
    elements.drawErrorActions.classList.toggle('is-hidden', state.drawPhase !== 'error');
    elements.exitDrawButton.disabled = state.drawPhase === 'loading';

    if (state.drawPhase === 'error') {
      elements.drawEyebrow.textContent = 'Error';
      elements.drawHeadline.textContent = '추첨을 시작하지 못했어요';
      elements.drawSubline.textContent = state.drawErrorMessage || '다시 시도하거나 참여자 목록으로 돌아가 주세요.';
      return;
    }

    elements.drawEyebrow.textContent = 'Draw';

    if (state.drawPhase === 'loading') {
      elements.drawHeadline.textContent = '추첨 준비 중이에요';
      elements.drawSubline.textContent = '공정한 추첨 화면을 정리하고 있어요.';
      return;
    }

    elements.drawHeadline.textContent = '추첨 중이에요';
    elements.drawSubline.textContent = '결과는 자동으로 열려요.';
  };

  const renderResult = (snapshot: ResultSnapshot) => {
    state.activeResult = snapshot;
    elements.resultWinner.textContent = snapshot.winner?.name ?? '결과를 확인할 수 없어요';
    elements.resultMeta.textContent = snapshot.winner
      ? `총 ${countLabel(snapshot.participantCount)} 중 ${snapshot.selectedRank}등을 확인했어요.`
      : '순위 정보를 다시 불러오지 못했어요.';
    elements.rankingCount.textContent = countLabel(snapshot.rankings.length);
    elements.resultList.innerHTML = '';

    if (!snapshot.rankings.length) {
      const empty = document.createElement('li');
      empty.className = 'ranking-item is-empty';
      empty.textContent = '순위 정보를 불러오지 못했어요. 참여자 편집으로 돌아가 다시 추첨해 주세요.';
      elements.resultList.appendChild(empty);
      return;
    }

    snapshot.rankings.forEach((entry) => {
      const item = document.createElement('li');
      item.className = `ranking-item${entry.isWinner ? ' is-winner' : ''}`;
      item.innerHTML = `
        <span class="ranking-number">${entry.rank}</span>
        <span class="ranking-name">${entry.name}</span>
        <span class="ranking-badge">${entry.isWinner ? '선정' : ''}</span>
      `;
      elements.resultList.appendChild(item);
    });
  };

  const handleDrawError = (message: string) => {
    state.isRunning = false;
    state.drawPhase = 'error';
    state.drawErrorMessage = message;
    switchScreen('draw');
    updateDrawState();
    showToast(message, 'error');
  };

  const beginDraw = (source: 'compose' | 'rerun') => {
    const normalizedNames = source === 'compose' ? normalizeNames(getNames()) : state.activeNames.slice();

    if (!normalizedNames.length) {
      updateFormState();
      showToast('참여자를 먼저 입력해 주세요.', 'error');
      return;
    }

    if (state.engineState !== 'ready') {
      if (state.engineState === 'error') {
        handleDrawError('추첨 엔진을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
      } else {
        showToast('아직 추첨 준비 중이에요. 잠시만 기다려 주세요.');
        updateFormState();
      }
      return;
    }

    try {
      if (source === 'compose') {
        setInputNames(normalizedNames, state.inputSource);
        savePreset(normalizedNames);
      }

      state.activeNames = normalizedNames;
      state.activeResult = null;
      state.isRunning = true;
      state.drawPhase = 'loading';
      state.drawErrorMessage = '';
      state.lastDrawStartedAt = performance.now();

      roulette.setMarbles(normalizedNames);
      roulette.setMap(state.selectedMap);

      const participantCount = roulette.getCount();
      const selectedRank = getWinnerRank(participantCount);
      options.winningRank = selectedRank - 1;
      options.useSkills = false;
      roulette.setWinningRank(options.winningRank);
      roulette.setAutoRecording(false);

      switchScreen('draw');
      updateDrawState();

      if (source === 'rerun') {
        track('result_rerun_tapped', {
          participant_count: participantCount,
          mode: state.winnerMode,
        });
      }

      track('draw_started', {
        participant_count: participantCount,
        mode: state.winnerMode,
        rank: selectedRank,
        map_id: state.selectedMap,
        used_preset: source === 'compose' && state.inputSource === 'preset',
      });

      window.setTimeout(() => {
        state.drawPhase = 'running';
        updateDrawState();
        roulette.start();
      }, 180);
    } catch {
      handleDrawError('추첨을 시작하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const resetToCompose = () => {
    state.isRunning = false;
    state.drawPhase = 'idle';
    state.drawErrorMessage = '';

    if (state.activeNames.length) {
      setInputNames(state.activeNames, 'manual');
    }

    if (state.engineState === 'ready') {
      try {
        roulette.reset();
      } catch {
        // noop
      }
    }

    switchScreen('compose');
    updateFormState();
  };

  const stepCustomRank = (delta: number) => {
    const count = Math.max(getNames().length, 1);
    const nextRank = clamp(getWinnerRank(count) + delta, 1, Math.max(count, 1));
    elements.customRankInput.value = String(nextRank);
    updateFormState();
    track('custom_rank_changed', {
      rank: nextRank,
      participant_count: getNames().length,
    });
  };

  roulette.getMaps().forEach((map) => {
    const option = document.createElement('option');
    option.value = String(map.index);
    option.textContent = map.title;
    elements.mapSelect.appendChild(option);
  });
  elements.mapSelect.value = String(state.selectedMap);

  if (storageFallback && !storageWarningShown) {
    showToast('기기 저장소 오류로 최근 구성은 이번 세션에만 보관돼요.', 'error');
    storageWarningShown = true;
  }

  renderPresets();
  bannerAdController.initialize();
  window.addEventListener('beforeunload', bannerAdController.destroy);
  setWinnerMode(state.winnerMode, false);
  updateFormState();
  switchScreen('compose');

  track('compose_viewed', {
    has_saved_names: state.draftNames.length > 0,
    preset_count: state.recentPresets.length,
  });

  if (state.draftNames.length) {
    track('participants_loaded', {
      count: state.draftNames.length,
      source: 'restored',
    });
  }

  roulette.addEventListener('ready', () => {
    state.engineState = 'ready';
    updateFormState();
  });

  roulette.addEventListener('initerror', (event) => {
    const customEvent = event as CustomEvent<{ error?: string }>;
    state.engineState = 'error';
    updateFormState();

    if (elements.body.classList.contains('mode-draw')) {
      handleDrawError(customEvent.detail?.error ?? '추첨 화면을 불러오지 못했어요.');
    }
  });

  roulette.addEventListener('goal', () => {
    state.isRunning = false;
    state.drawPhase = 'idle';

    const snapshot: ResultSnapshot = {
      winner: roulette.getWinner(),
      rankings: roulette.getRanking(),
      selectedRank: options.winningRank + 1,
      participantCount: state.activeNames.length,
    };

    track('draw_completed', {
      participant_count: state.activeNames.length,
      mode: state.winnerMode,
      rank: snapshot.selectedRank,
      duration_ms: Math.round(performance.now() - state.lastDrawStartedAt),
    });

    window.setTimeout(() => {
      renderResult(snapshot);
      switchScreen('result');
    }, 720);
  });

  elements.quickAddButton.addEventListener('click', addQuickName);

  elements.quickEditCancelButton.addEventListener('click', () => {
    resetQuickEditor();
    elements.quickAddInput.focus();
  });

  elements.dedupeNamesButton.addEventListener('click', () => {
    const currentNames = getNames();
    const dedupedNames = normalizeNames(currentNames);

    if (dedupedNames.join('\n') === getNames().join('\n')) {
      showToast('이미 중복 없이 정리돼 있어요.');
      return;
    }

    setInputNames(dedupedNames, 'manual');
    showToast('중복 이름을 정리했어요.');
    track('participants_deduped', { participant_count: dedupedNames.length });
  });

  elements.clearAllNamesButton.addEventListener('click', () => {
    setInputNames([], 'manual');
    resetQuickEditor();
    showToast('참여자 목록을 비웠어요.');
    track('participants_cleared');
  });

  elements.quickAddInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addQuickName();
  });

  elements.namePreview.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.dataset.name) {
      if (target.dataset.move === 'up') {
        moveNameByOffset(target.dataset.name, -1);
        return;
      }

      if (target.dataset.move === 'down') {
        moveNameByOffset(target.dataset.name, 1);
        return;
      }

      const nextNames = normalizeNames(getNames()).filter((name) => name !== target.dataset.name);
      setInputNames(nextNames, 'manual');

      if (state.editingName === target.dataset.name) {
        resetQuickEditor();
      }

      showToast('참여자를 삭제했어요.');
      track('participant_removed', { participant_count: nextNames.length });
      return;
    }

    const item = target instanceof HTMLElement ? target.closest<HTMLElement>('.name-preview-item') : null;
    const text = item?.querySelector<HTMLElement>('.name-preview-text')?.textContent?.trim();
    if (!text) return;

    startQuickEdit(text);
  });

  elements.namePreview.addEventListener('dragstart', (event) => {
    const target = event.target;
    const item = target instanceof HTMLElement ? target.closest<HTMLElement>('.name-preview-item') : null;
    if (!item?.dataset.name || !(event instanceof DragEvent)) return;

    draggedName = item.dataset.name;
    item.classList.add('is-dragging');
    event.dataTransfer?.setData('text/plain', draggedName);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  });

  elements.namePreview.addEventListener('dragover', (event) => {
    if (!(event instanceof DragEvent) || !draggedName) return;
    const target = event.target;
    const item = target instanceof HTMLElement ? target.closest<HTMLElement>('.name-preview-item') : null;
    if (!item?.dataset.name || item.dataset.name === draggedName) return;

    event.preventDefault();
    clearDropTargetState();
    item.classList.add('is-drop-target');
  });

  elements.namePreview.addEventListener('drop', (event) => {
    if (!(event instanceof DragEvent) || !draggedName) return;
    const target = event.target;
    const item = target instanceof HTMLElement ? target.closest<HTMLElement>('.name-preview-item') : null;
    const targetName = item?.dataset.name;
    if (!targetName || targetName === draggedName) {
      clearDropTargetState();
      draggedName = null;
      return;
    }

    event.preventDefault();
    const nextNames = reorderNames(getNames(), draggedName, targetName);
    setInputNames(nextNames, 'manual');
    clearDropTargetState();
    draggedName = null;
    showToast('참여자 순서를 바꿨어요.');
    track('participant_reordered', { participant_count: nextNames.length });
  });

  elements.namePreview.addEventListener('dragend', () => {
    draggedName = null;
    clearDropTargetState();
  });

  elements.clearPresetsButton.addEventListener('click', () => {
    state.recentPresets = [];
    writeStoredJson(STORAGE_KEYS.presets, state.recentPresets);
    renderPresets();
    showToast('최근 구성을 비웠어요.');
    track('presets_cleared');
  });

  elements.winnerModeControl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.mode) return;
    setWinnerMode(target.dataset.mode as WinnerMode);
  });

  elements.customRankDownButton.addEventListener('click', () => stepCustomRank(-1));
  elements.customRankUpButton.addEventListener('click', () => stepCustomRank(1));

  elements.customRankInput.addEventListener('change', () => {
    const names = getNames();
    const rank = getWinnerRank(names.length || 1);
    elements.customRankInput.value = String(rank);
    updateFormState();
    track('custom_rank_changed', { rank, participant_count: names.length });
  });

  elements.mapSelect.addEventListener('change', () => {
    state.selectedMap = Number.parseInt(elements.mapSelect.value, 10) || 0;
    writeStoredValue(STORAGE_KEYS.map, String(state.selectedMap));
    track('map_changed', { map_id: state.selectedMap });
  });

  elements.startButton.addEventListener('click', () => beginDraw('compose'));

  elements.exitDrawButton.addEventListener('click', () => {
    if (state.drawPhase === 'loading') {
      return;
    }

    const elapsedMs = Math.round(performance.now() - state.lastDrawStartedAt);
    if (!state.isRunning || window.confirm('추첨을 멈추고 참여자 편집으로 돌아갈까요?')) {
      track('draw_cancelled', { reason: 'user_exit', elapsed_ms: elapsedMs });
      resetToCompose();
    }
  });

  elements.retryDrawButton.addEventListener('click', () => {
    if (state.engineState !== 'ready') {
      window.location.reload();
      return;
    }

    if (state.activeNames.length) {
      beginDraw('rerun');
      return;
    }

    beginDraw('compose');
  });

  elements.returnComposeButton.addEventListener('click', resetToCompose);

  elements.editNamesButton.addEventListener('click', () => {
    track('result_edit_tapped', {
      participant_count: state.activeNames.length,
    });
    resetToCompose();
  });

  elements.rerunButton.addEventListener('click', () => {
    if (!state.activeNames.length) {
      showToast('다시 추첨할 참여자 구성이 없어요.', 'error');
      return;
    }

    beginDraw('rerun');
  });

  elements.copyResultButton.addEventListener('click', async () => {
    if (!state.activeResult) return;

    const lines = state.activeResult.rankings.map(
      (entry) => `${entry.rank}. ${entry.name}${entry.isWinner ? ' ← 선정' : ''}`
    );
    const payload = [
      '핀볼 추첨 결과',
      `선정: ${state.activeResult.winner?.name ?? '-'}`,
      `기준: ${state.activeResult.selectedRank}등 / ${countLabel(state.activeResult.participantCount)}`,
      '',
      ...lines,
    ].join('\n');

    try {
      await copyText(payload);
      showToast('결과를 복사했어요.');
      track('result_copied', {
        participant_count: state.activeResult.participantCount,
      });
    } catch {
      showToast('결과를 복사하지 못했어요.', 'error');
    }
  });
}
