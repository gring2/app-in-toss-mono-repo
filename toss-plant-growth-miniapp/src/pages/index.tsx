import {
  getOperationalEnvironment,
  loadFullScreenAd,
  showFullScreenAd,
} from '@apps-in-toss/framework';
import { createRoute } from '@granite-js/react-native';
import { Button } from '@toss/tds-react-native';
import React from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { homeCopy } from '../content/copy';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { toDisplayImageUri } from '../plants/image';
import { palette, radius, shadows, spacing, typography } from '../ui/theme';

const UNLOCK_SLOT_AD_GROUP_ID = 'ait.dev.43daa14da3ae487b';
const IS_DEV_BUILD = typeof __DEV__ !== 'undefined' && __DEV__;

export const Route = createRoute('/', {
  component: Page,
});

function formatDateLabel(isoDate: string | null) {
  if (isoDate == null) {
    return '아직 기록이 없어요';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '날짜를 불러오지 못했어요';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

function Page() {
  const navigation = Route.useNavigation();
  const {
    activePlant,
    activePlantPhotos,
    canAddPlant,
    canCaptureToday,
    clearPlantDiary,
    isReady,
    plants,
    setActivePlant,
    todayReportUnlocked,
    unlockNextPlantSlot,
    unlockedPlantSlots,
    updatePlantName,
  } = usePlantGrowth();
  const [unlockStatus, setUnlockStatus] = React.useState('');
  const [isUnlockAdSupported, setIsUnlockAdSupported] = React.useState(false);
  const [isUnlockAdLoaded, setIsUnlockAdLoaded] = React.useState(false);
  const [isUnlockAdProcessing, setIsUnlockAdProcessing] = React.useState(false);
  const [isSandboxEnvironment, setIsSandboxEnvironment] = React.useState(false);
  const [plantNameDraft, setPlantNameDraft] = React.useState('');
  const [plantNameStatus, setPlantNameStatus] = React.useState('');
  const [isManageSheetOpen, setIsManageSheetOpen] = React.useState(false);
  const unlockRewardGrantedRef = React.useRef(false);
  const unlockAdUnregisterRef = React.useRef<(() => void) | null>(null);
  const lastPlantIdRef = React.useRef<string>('');

  const isOnboarding = activePlant == null;
  const latestPhoto = activePlantPhotos[0] ?? null;
  const hasSinglePhoto = activePlantPhotos.length === 1;
  const hasReportEntryPoint = !isOnboarding && activePlantPhotos.length > 0;
  const canShowDebugUnlockButton =
    !canAddPlant && (IS_DEV_BUILD || isSandboxEnvironment);
  const primaryCaptureCtaLabel = isOnboarding
    ? homeCopy.ctaFirstPlant
    : canCaptureToday
      ? homeCopy.ctaCaptureToday
      : homeCopy.ctaCaptureDone;
  const isPrimaryCaptureDisabled = !isReady;
  const todayPhotoUri = React.useMemo(() => {
    if (latestPhoto == null) {
      return null;
    }

    return toDisplayImageUri(latestPhoto.dataUri, latestPhoto.mimeType);
  }, [latestPhoto]);

  const todayCardTitle = React.useMemo(() => {
    if (!isReady) {
      return homeCopy.loadingTitle;
    }

    if (isOnboarding) {
      return homeCopy.onboardingTitle;
    }

    if (latestPhoto == null) {
      return homeCopy.emptyDiaryTitle;
    }

    if (hasSinglePhoto) {
      return homeCopy.firstDayTitle;
    }

    return homeCopy.todayCardTitle;
  }, [hasSinglePhoto, isOnboarding, isReady, latestPhoto]);

  const todayCardBody = React.useMemo(() => {
    if (!isReady) {
      return homeCopy.loadingBody;
    }

    if (isOnboarding) {
      return homeCopy.todayCardOnboardingBody;
    }

    if (latestPhoto == null) {
      return homeCopy.todayCardEmptyBody;
    }

    const capturedAtLabel = formatDateLabel(latestPhoto.capturedAt);

    if (hasSinglePhoto) {
      return homeCopy.todayCardFirstBody(capturedAtLabel);
    }

    if (canCaptureToday) {
      return homeCopy.todayCardPendingBody(capturedAtLabel);
    }

    return homeCopy.todayCardDoneBody;
  }, [canCaptureToday, hasSinglePhoto, isOnboarding, isReady, latestPhoto]);

  React.useEffect(() => {
    const currentPlantId = activePlant?.id ?? '';

    if (lastPlantIdRef.current !== currentPlantId) {
      setPlantNameStatus('');
      lastPlantIdRef.current = currentPlantId;
    }

    setPlantNameDraft(activePlant?.name ?? '');
  }, [activePlant?.id, activePlant?.name]);

  const openBaselineCapture = () => {
    navigation.navigate('/capture', {
      mode: 'baseline',
    });
  };

  const openDailyCapture = () => {
    navigation.navigate('/capture', {
      mode: 'daily',
      plantId: activePlant?.id ?? '',
    });
  };

  const handlePrimaryCapture = () => {
    if (isOnboarding) {
      openBaselineCapture();
      return;
    }

    openDailyCapture();
  };

  const preloadUnlockAd = React.useCallback(() => {
    unlockAdUnregisterRef.current?.();
    unlockAdUnregisterRef.current = null;
    setIsUnlockAdLoaded(false);

    const supportsAd =
      UNLOCK_SLOT_AD_GROUP_ID.length > 0 &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported();

    setIsUnlockAdSupported(supportsAd);

    if (!supportsAd) {
      setUnlockStatus(homeCopy.unlockUnsupported);
      return;
    }

    setUnlockStatus(homeCopy.unlockLoading);

    unlockAdUnregisterRef.current = loadFullScreenAd({
      options: {
        adGroupId: UNLOCK_SLOT_AD_GROUP_ID,
      },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsUnlockAdLoaded(true);
          setUnlockStatus(homeCopy.unlockReady);
        }
      },
      onError: (error) => {
        console.warn('[Home] Failed to load unlock ad:', error);
        setIsUnlockAdLoaded(false);
        setUnlockStatus(homeCopy.unlockLoadFailed);
      },
    });
  }, []);

  React.useEffect(() => {
    try {
      setIsSandboxEnvironment(getOperationalEnvironment() === 'sandbox');
    } catch {
      setIsSandboxEnvironment(false);
    }
  }, []);

  React.useEffect(() => {
    if (canAddPlant) {
      unlockAdUnregisterRef.current?.();
      unlockAdUnregisterRef.current = null;
      setUnlockStatus('');
      return;
    }

    preloadUnlockAd();

    return () => {
      unlockAdUnregisterRef.current?.();
      unlockAdUnregisterRef.current = null;
    };
  }, [canAddPlant, preloadUnlockAd]);

  const handleUnlockSlot = () => {
    if (isUnlockAdProcessing) {
      return;
    }

    if (!isUnlockAdSupported) {
      setUnlockStatus(homeCopy.unlockUnsupported);
      return;
    }

    if (!isUnlockAdLoaded) {
      setUnlockStatus(homeCopy.unlockNeedReady);
      return;
    }

    setIsUnlockAdProcessing(true);
    unlockRewardGrantedRef.current = false;

    showFullScreenAd({
      options: {
        adGroupId: UNLOCK_SLOT_AD_GROUP_ID,
      },
      onEvent: (event) => {
        switch (event.type) {
          case 'requested':
            setUnlockStatus(homeCopy.unlockRequested);
            break;
          case 'show':
            setUnlockStatus(homeCopy.unlockShowing);
            break;
          case 'userEarnedReward':
            unlockRewardGrantedRef.current = true;
            unlockNextPlantSlot();
            setUnlockStatus(homeCopy.unlockSuccess);
            setIsUnlockAdProcessing(false);
            break;
          case 'dismissed':
            if (!unlockRewardGrantedRef.current) {
              setUnlockStatus(homeCopy.unlockDismissed);
              setIsUnlockAdProcessing(false);
            }
            preloadUnlockAd();
            break;
          case 'failedToShow':
            setUnlockStatus(homeCopy.unlockFailedToShow);
            setIsUnlockAdProcessing(false);
            preloadUnlockAd();
            break;
          default:
            break;
        }
      },
      onError: (error) => {
        console.warn('[Home] Failed to show unlock ad:', error);
        setUnlockStatus(homeCopy.unlockRuntimeError);
        setIsUnlockAdProcessing(false);
        preloadUnlockAd();
      },
    });
  };

  const handleAddPlantFromManage = () => {
    if (canAddPlant) {
      setIsManageSheetOpen(false);
      openBaselineCapture();
      return;
    }

    handleUnlockSlot();
  };

  const handleDebugUnlockSlot = () => {
    unlockNextPlantSlot();
    setUnlockStatus(homeCopy.unlockDebugDone);
  };

  const handleSavePlantName = () => {
    if (activePlant == null) {
      return;
    }

    const result = updatePlantName(activePlant.id, plantNameDraft);

    if (result === 'ok') {
      setPlantNameStatus(homeCopy.plantNameSaved);
      return;
    }

    if (result === 'empty_name') {
      setPlantNameStatus(homeCopy.plantNameEmpty);
      return;
    }

    setPlantNameStatus(homeCopy.plantNameNotFound);
  };

  const handleClearDiary = () => {
    if (activePlant == null) {
      return;
    }

    Alert.alert(
      homeCopy.clearDiaryConfirmTitle(activePlant.name),
      homeCopy.clearDiaryConfirmBody,
      [
        {
          text: homeCopy.ctaClearDiaryCancel,
          style: 'cancel',
        },
        {
          text: homeCopy.ctaClearDiaryConfirm,
          style: 'destructive',
          onPress: () => {
            const result = clearPlantDiary(activePlant.id);

            if (result === 'ok') {
              setPlantNameStatus(homeCopy.clearDiaryDone(activePlant.name));
              return;
            }

            setPlantNameStatus(homeCopy.clearDiaryNotFound);
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.plantBlock}>
          <View style={styles.plantBlockHeader}>
            <Text style={styles.sectionTitle}>{homeCopy.appTitle}</Text>
            {!isOnboarding ? (
              <Pressable
                style={styles.manageButton}
                onPress={() => setIsManageSheetOpen(true)}
              >
                <Text style={styles.manageButtonText}>
                  {homeCopy.manageButton}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {plants.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantTabs}
            >
              {plants.map((plant) => {
                const isActive = activePlant?.id === plant.id;

                return (
                  <Pressable
                    key={plant.id}
                    onPress={() => setActivePlant(plant.id)}
                    style={[
                      styles.plantChip,
                      isActive && styles.plantChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.plantChipText,
                        isActive && styles.plantChipTextActive,
                      ]}
                    >
                      {plant.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.todayCard}>
          {todayPhotoUri != null ? (
            <Image source={{ uri: todayPhotoUri }} style={styles.todayImage} />
          ) : null}

          <Text style={styles.todayCardTitle}>{todayCardTitle}</Text>
          <Text style={styles.todayCardBody}>{todayCardBody}</Text>

          {hasReportEntryPoint ? (
            <Pressable
              style={styles.inlineReportLink}
              onPress={() => navigation.navigate('/compare')}
            >
              <Text style={styles.inlineReportLinkText}>
                {todayReportUnlocked
                  ? homeCopy.ctaRevisitReport
                  : homeCopy.todayCardReportLink}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Button
          size="medium"
          display="block"
          onPress={handlePrimaryCapture}
          disabled={isPrimaryCaptureDisabled}
          viewStyle={styles.primaryButton}
        >
          {primaryCaptureCtaLabel}
        </Button>
      </ScrollView>

      <Modal
        visible={isManageSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsManageSheetOpen(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setIsManageSheetOpen(false)}
          />

          <View style={styles.sheetPanel}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{homeCopy.manageSheetTitle}</Text>
            <Text style={styles.sheetSlotLabel}>
              {homeCopy.manageSlotLabel(plants.length, unlockedPlantSlots)}
            </Text>
            <Text style={styles.sheetSlotHint}>{homeCopy.manageSlotHint}</Text>

            {activePlant != null ? (
              <View style={styles.manageSection}>
                <Text style={styles.manageLabel}>
                  {homeCopy.plantNameLabel}
                </Text>
                <TextInput
                  value={plantNameDraft}
                  onChangeText={setPlantNameDraft}
                  placeholder={homeCopy.plantNamePlaceholder}
                  maxLength={20}
                  style={styles.manageInput}
                  onSubmitEditing={handleSavePlantName}
                />
                <Button
                  size="medium"
                  display="block"
                  onPress={handleSavePlantName}
                  viewStyle={styles.sheetButton}
                >
                  {homeCopy.ctaSaveName}
                </Button>
                <Button
                  type="danger"
                  style="weak"
                  size="medium"
                  display="block"
                  onPress={handleClearDiary}
                  viewStyle={styles.sheetButton}
                >
                  {homeCopy.ctaClearDiary}
                </Button>
              </View>
            ) : null}

            <Button
              type={canAddPlant ? 'primary' : 'dark'}
              style={canAddPlant ? 'fill' : 'weak'}
              size="medium"
              display="block"
              onPress={handleAddPlantFromManage}
              disabled={isUnlockAdProcessing}
              viewStyle={styles.sheetButton}
            >
              {canAddPlant
                ? homeCopy.ctaAddPlant
                : isUnlockAdProcessing
                  ? homeCopy.ctaUnlockProcessing
                  : homeCopy.ctaUnlockPlant}
            </Button>

            {canShowDebugUnlockButton ? (
              <Button
                type="danger"
                style="weak"
                size="medium"
                display="block"
                onPress={handleDebugUnlockSlot}
                viewStyle={styles.sheetButton}
              >
                테스트 해금 (개발/샌드박스 전용)
              </Button>
            ) : null}

            {plantNameStatus.length > 0 ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{plantNameStatus}</Text>
              </View>
            ) : null}

            {unlockStatus.length > 0 ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{unlockStatus}</Text>
              </View>
            ) : null}

            <Button
              type="dark"
              style="weak"
              size="medium"
              display="block"
              onPress={() => setIsManageSheetOpen(false)}
              viewStyle={styles.sheetButton}
            >
              {homeCopy.manageSheetClose}
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  plantBlock: {
    gap: spacing.sm,
  },
  plantBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  manageButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  manageButtonText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  plantTabs: {
    gap: spacing.xs,
  },
  plantChip: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  plantChipActive: {
    borderColor: palette.leaf,
    backgroundColor: palette.leafSoft,
  },
  plantChipText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  plantChipTextActive: {
    color: palette.leafStrong,
  },
  todayCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadows.card,
  },
  todayImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: palette.border,
  },
  todayCardTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  todayCardBody: {
    fontSize: typography.body,
    color: palette.textSecondary,
  },
  inlineReportLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
  },
  inlineReportLinkText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: palette.leafStrong,
  },
  primaryButton: {
    width: '100%',
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetPanel: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: palette.creamSoft,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: palette.border,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  sheetSlotLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: palette.leafStrong,
  },
  sheetSlotHint: {
    fontSize: typography.caption,
    color: palette.textSecondary,
  },
  manageSection: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  manageLabel: {
    fontSize: typography.caption,
    color: palette.textMuted,
  },
  manageInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 16,
    color: palette.textPrimary,
    backgroundColor: palette.white,
  },
  sheetButton: {
    width: '100%',
  },
  statusBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: typography.caption,
    color: palette.textSecondary,
  },
});
