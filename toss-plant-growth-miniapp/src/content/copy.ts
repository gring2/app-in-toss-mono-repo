export const homeCopy = {
  appTitle: '오늘의 식물일기',
  heroTitle: '오늘도 초록 기록, 시작해볼까요?',
  heroSubtitle: '작은 변화를 모아 식물의 하루를 더 즐겁게 남겨요.',
  captureReady: '오늘 한 컷 남기면 리포트까지 바로 이어져요.',
  captureDone: '오늘 촬영을 마쳤어요. 사진을 다시 남겨 덮어쓸 수도 있어요.',
  startFirstPlant: '첫 식물을 등록하면 성장 스토리가 시작돼요.',
  reportReady: '오늘 리포트가 열렸어요. 지금 확인해보세요.',
  reportLocked: '광고 1회로 오늘 리포트를 열 수 있어요.',
  streakLabel: (streakCount: number, hasWeeklyBadge: boolean) =>
    `${streakCount}일 연속 기록 중 · 7일 배지 ${
      hasWeeklyBadge ? '완료' : '진행 중'
    }`,
  slotDescription: '슬롯이 가득 차면 새 식물 슬롯을 열 수 있어요.',
  loadingTitle: '기록을 불러오는 중이에요',
  loadingBody: '조금만 기다리면 오늘 기록을 이어갈 수 있어요.',
  onboardingTitle: '첫 식물과 인사해볼까요?',
  onboardingBody: '첫 사진은 기준점이 되고, 다음부터 변화 리포트가 열려요.',
  firstDayTitle: '첫 기록 완료!',
  firstDayBody: '좋아요. 내일 촬영하면 첫 변화 리포트를 볼 수 있어요.',
  firstDayHint: (capturedAtLabel: string) => `첫 기록: ${capturedAtLabel}`,
  emptyDiaryTitle: '기록이 비어 있어요',
  emptyDiaryBody: '이 식물의 새 일기를 오늘 한 장으로 다시 시작해요.',
  nextCaptureTitle: '다음 촬영은 내일 열려요',
  nextCaptureBody: '비슷한 시간에 찍으면 변화가 더 잘 보여요.',
  nextCaptureHint: '내일 돌아오면 첫 변화 리포트를 바로 확인해요.',
  plantNameLabel: '식물 이름',
  plantNamePlaceholder: '식물 이름을 입력해주세요',
  plantNameSaved: '좋아요! 이름을 바꿨어요.',
  plantNameEmpty: '이름을 한 글자 이상 입력해주세요.',
  plantNameNotFound: '식물을 찾지 못했어요. 다시 선택해주세요.',
  plantPickerHint: '촬영할 식물은 위 탭에서 바꿀 수 있어요.',
  deleteSlotConfirmTitle: (plantName: string) =>
    `${plantName} 슬롯을 비울까요?`,
  deleteSlotConfirmBody: '식물 이름과 사진 기록이 삭제되고 슬롯은 비워져요.',
  deleteSlotDone: (plantName: string) => `${plantName} 슬롯을 비웠어요.`,
  deleteSlotNotFound: '식물을 찾지 못했어요. 다시 선택해주세요.',
  manageButton: '관리',
  manageSheetTitle: '식물 관리',
  manageSheetClose: '닫기',
  manageSlotLabel: (current: number, total: number) =>
    `식물 슬롯 ${current}/${total}`,
  manageSlotHint:
    '슬롯을 비우면 슬롯 수도 함께 줄어들어요. 필요할 때 새 슬롯을 다시 열 수 있어요.',
  todayCardTitle: '오늘의 기록',
  todayCardOnboardingBody: '첫 식물을 등록하고 오늘 한 장을 남겨보세요.',
  todayCardEmptyBody: '아직 기록이 없어요. 지금 한 장 남겨볼까요?',
  todayCardFirstBody: (capturedAtLabel: string) =>
    `첫 기록은 ${capturedAtLabel}이에요. 같은 자리에서 이어서 찍어보세요.`,
  todayCardPendingBody: (capturedAtLabel: string) =>
    `마지막 기록은 ${capturedAtLabel}. 오늘 한 장 더 남기면 좋아요.`,
  todayCardDoneBody: '오늘 기록을 남겼어요. 내일 다시 만나요.',
  todayCardReportLink: '오늘 리포트 열기',
  ctaFirstPlant: '첫 식물 만나기',
  ctaCaptureToday: '오늘 촬영하기',
  ctaCaptureDone: '오늘 사진 다시 남기기',
  ctaSecondShot: '두 번째 사진 남기기',
  ctaStartDiary: '이 식물 촬영하기',
  ctaCompare: '오늘 리포트 보기',
  ctaRevisitReport: '오늘 리포트 다시 보기',
  ctaDeleteSlot: '슬롯 비우기',
  ctaDeleteSlotConfirm: '삭제',
  ctaDeleteSlotCancel: '취소',
  ctaSaveName: '저장',
  ctaAddPlant: '새 식물 추가하기',
  ctaUnlockPlant: '새 식물 슬롯 열기',
  unlockSuccess: '새 식물 슬롯이 열렸어요!',
};

export const captureCopy = {
  baselineTitle: '우리 식물 첫 인사 남기기',
  baselineSubtitle: '첫 사진이 성장 기록의 시작점이 돼요.',
  dailyTitle: '오늘의 초록 한 컷',
  dailySubtitle: (plantName: string) =>
    `${plantName}의 오늘 모습을 가볍게 남겨볼까요?`,
  targetBannerNewTitle: '새 식물 일기를 만들어요',
  targetBannerNewBody: '이번 촬영이 새 식물의 첫 기록이 됩니다.',
  targetBannerDailyTitle: (plantName: string) =>
    `이번 촬영은 ${plantName} 일기에 저장돼요.`,
  targetBannerDailyBody: '다른 식물을 찍고 싶다면 홈에서 식물을 바꿔주세요.',
  targetBannerMissingTitle: '촬영 대상을 찾지 못했어요',
  targetBannerMissingBody: '홈으로 돌아가 식물을 다시 선택해주세요.',
  slotFull: '식물 슬롯이 가득 찼어요. 홈에서 슬롯을 먼저 열어주세요.',
  plantNotFound: '기록할 식물을 못 찾았어요. 홈에서 다시 선택해주세요.',
  permissionDenied: '카메라 권한이 없어서 촬영할 수 없어요.',
  captureFailed: '촬영에 실패했어요. 잠시 후 다시 시도해주세요.',
  permissionStillDenied: '권한이 아직 꺼져 있어요. 설정에서 켜주세요.',
  permissionDialogFailed: '권한 설정 화면을 열지 못했어요.',
  adRequested: '기록 저장 완료! 광고를 여는 중이에요.',
  adShowing: '광고 시청 후 리포트 화면으로 이동해요.',
  adNotReady: '광고를 준비 중이에요. 잠시 후 다시 시도해주세요.',
  adFailedToShow:
    '광고를 표시하지 못했어요. 다시 시도하거나 리포트 바로 보기를 선택해주세요.',
  detectingPlant: '식물 사진인지 확인 중이에요...',
  nonPlantTitle: '식물 사진인지 확인이 필요해요',
  nonPlantBodySuspect: '실내 화분 식물 사진인지 확인해주세요.',
  nonPlantBodyReject: '식물로 확신하기 어려워요. 다시 촬영할까요?',
  ctaRetake: '다시 촬영하기',
  ctaSaveAnyway: '그래도 저장하기',
  nonPlantCancelled: '이번 촬영은 저장하지 않았어요. 다시 찍어볼까요?',
  nonPlantOverrideSaved:
    '확인 후 저장했어요. 다음에는 식물을 더 크게 담아보세요.',
  ctaCapture: '지금 촬영하기',
  ctaCapturing: '촬영 중...',
  ctaAdProcessing: '광고 확인 중...',
  postCaptureTitle: '오늘 기록을 저장했어요',
  postCaptureBody: '광고를 보면 리포트로 바로 이어서 볼 수 있어요.',
  postCaptureBodyNoAd:
    '지금은 광고를 보여줄 수 없어 리포트 화면으로 바로 이동할 수 있어요.',
  ctaWatchAdThenCompare: '광고 보고 리포트 보기',
  ctaSkipAdAndCompare: '리포트 바로 보기',
  ctaReloadAd: '광고 다시 준비하기',
  ctaPermission: '카메라 권한 켜기',
  ctaBack: '홈으로 돌아가기',
};

export const compareCopy = {
  unavailableTitle: '오늘 리포트를 만들 수 없어요',
  unavailableBody: '먼저 사진을 남기면 오늘 리포트가 열려요.',
  preparingTitle: '리포트 준비 중이에요',
  pageTitle: (plantName: string) => `${plantName} 오늘 리포트`,
  lockedTitle: '아직 오늘 리포트가 열리지 않았어요',
  lockedBody: '오늘 촬영을 완료하면 리포트가 바로 열려요.',
  ctaGoCapture: '오늘 촬영하러 가기',
  ctaGrowthAlbum: '성장 앨범 보기',
  ctaBackHome: '홈으로 돌아가기',
  sceneMismatchTitle: '사진 배경이 많이 달라 보여요',
  sceneMismatchBody: '같은 식물이라면 확인 후 리포트를 만들게요.',
  sceneConfirmed: '같은 식물 확인 완료! 리포트를 만들었어요.',
  ctaConfirmSamePlant: '같은 식물 맞아요',
  ctaRecapture: '다시 촬영할게요',
  mascotTitle: '오늘의 초록 한마디',
  growthBoardTitle: '성장판 진행도',
  tomorrowMissionTitle: '내일 미션',
  tomorrowMissionBody: '내일 같은 자리에서 한 컷만 남겨볼까요?',
  tomorrowMissionDoneBody: '오늘 미션 완료! 내일 다시 만나 성장판을 이어가요.',
  reportLoadingTitle: '리포트 준비 중이에요',
  reportLoadingBody: '잠시 후 다시 확인해주세요.',
  quickSceneLabel: (score: number) => `빠른 판별 점수: ${score}점`,
  mascotLine: (score: number, isBaselineOnly: boolean) => {
    if (isBaselineOnly) {
      return '첫 기록이 정말 좋아요. 이제 내일이 기대돼요!';
    }

    if (score >= 80) {
      return '와, 오늘은 변화가 확실히 보여요!';
    }

    if (score >= 45) {
      return '좋아요! 작은 변화가 또렷하게 보이네요.';
    }

    return '오늘도 꾸준히 기록한 게 가장 멋져요.';
  },
  mascotEmoji: (score: number, isBaselineOnly: boolean) => {
    if (isBaselineOnly) {
      return '🌱';
    }

    if (score >= 80) {
      return '🌿';
    }

    if (score >= 45) {
      return '🍀';
    }

    return '🪴';
  },
  scoreInsight: (score: number) => {
    if (score >= 80) {
      return '눈에 띄는 변화가 보여요!';
    }

    if (score >= 45) {
      return '작은 변화가 또렷하게 보이네요.';
    }

    return '오늘은 비슷해요. 꾸준함이 가장 큰 힘이에요.';
  },
};

export const timelineCopy = {
  unavailableTitle: '성장 앨범을 시작할 수 없어요',
  unavailableBody: '먼저 홈에서 사진을 남긴 뒤 다시 들어와주세요.',
  preparingTitle: '성장 앨범을 준비 중이에요',
  pageTitle: (plantName: string) => `${plantName}의 성장 앨범`,
  pageSubtitle: (index: number, total: number, dateLabel: string) =>
    `${index}/${total}번째 기록 · ${dateLabel}`,
  endTitle: '기록을 끝까지 봤어요',
  endBody: '내일 한 장 더 남기면 성장 스토리가 더 길어져요.',
  ctaBackHome: '홈으로 돌아가기',
  ctaPrev: '이전',
  ctaNext: '다음',
};
