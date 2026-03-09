import { createRoute } from '@granite-js/react-native';
import {
  BottomSheet,
  Button,
  List,
  ListRow,
  Tab,
  Text,
  TextField,
  colors,
  useDialog,
} from '@toss/tds-react-native';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { homeCopy } from '../content/copy';
import { usePlantGrowth } from '../hooks/usePlantGrowth';
import { toDisplayImageUri } from '../plants/image';

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
  const dialog = useDialog();
  const {
    activePlant,
    activePlantPhotos,
    canAddPlant,
    canCaptureToday,
    deletePlantSlot,
    isReady,
    plants,
    reportState,
    setActivePlant,
    todayReportUnlocked,
    unlockNextPlantSlot,
    unlockedPlantSlots,
    updatePlantName,
  } = usePlantGrowth();
  const [unlockStatus, setUnlockStatus] = React.useState('');
  const [plantNameDraft, setPlantNameDraft] = React.useState('');
  const [plantNameStatus, setPlantNameStatus] = React.useState('');
  const [isManageSheetOpen, setIsManageSheetOpen] = React.useState(false);
  const lastPlantIdRef = React.useRef<string>('');

  const isOnboarding = activePlant == null;
  const latestPhoto = activePlantPhotos[0] ?? null;
  const hasSinglePhoto = activePlantPhotos.length === 1;
  const hasReportEntryPoint = !isOnboarding && activePlantPhotos.length > 0;
  const hasWeeklyBadge = reportState.badges.includes('weekly-7');
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
    navigation.navigate('/capture', { mode: 'baseline' });
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

  React.useEffect(() => {
    if (canAddPlant) {
      setUnlockStatus('');
    }
  }, [canAddPlant]);

  const handleUnlockSlot = React.useCallback(() => {
    unlockNextPlantSlot();
    setUnlockStatus(homeCopy.unlockSuccess);
  }, [unlockNextPlantSlot]);

  const handleAddPlantFromManage = () => {
    if (canAddPlant) {
      setIsManageSheetOpen(false);
      openBaselineCapture();
      return;
    }

    handleUnlockSlot();
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

  const handleDeleteSlot = async () => {
    if (activePlant == null) {
      return;
    }

    const isConfirmed = await dialog.openConfirm({
      title: homeCopy.deleteSlotConfirmTitle(activePlant.name),
      description: homeCopy.deleteSlotConfirmBody,
      leftButton: homeCopy.ctaDeleteSlotCancel,
      rightButton: homeCopy.ctaDeleteSlotConfirm,
      closeOnDimmerClick: true,
    });

    if (!isConfirmed) {
      return;
    }

    const result = deletePlantSlot(activePlant.id);

    if (result === 'ok') {
      setPlantNameStatus(homeCopy.deleteSlotDone(activePlant.name));
      return;
    }

    setPlantNameStatus(homeCopy.deleteSlotNotFound);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.topHeader}>
          <Text typography="t4" fontWeight="bold">
            {homeCopy.appTitle}
          </Text>
          {!isOnboarding ? (
            <Button
              type="dark"
              style="weak"
              size="tiny"
              onPress={() => setIsManageSheetOpen(true)}
            >
              {homeCopy.manageButton}
            </Button>
          ) : null}
        </View>

        {plants.length > 0 ? (
          <Tab
            fluid
            size="small"
            value={activePlant?.id ?? plants[0]?.id ?? ''}
            onChange={setActivePlant}
          >
            {plants.map((plant) => (
              <Tab.Item key={plant.id} value={plant.id}>
                {plant.name}
              </Tab.Item>
            ))}
          </Tab>
        ) : null}

        {todayPhotoUri != null ? (
          <Image source={{ uri: todayPhotoUri }} style={styles.todayImage} />
        ) : null}

        <List style={styles.panel} rowSeparator="none">
          <ListRow
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={todayCardTitle}
                bottom={todayCardBody}
              />
            }
          />
        </List>

        {hasReportEntryPoint ? (
          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={() => navigation.navigate('/compare')}
            viewStyle={styles.fullButton}
          >
            {todayReportUnlocked
              ? homeCopy.ctaRevisitReport
              : homeCopy.todayCardReportLink}
          </Button>
        ) : null}

        {!isOnboarding ? (
          <List style={styles.panel} rowSeparator="indented">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top="마지막 촬영"
                  bottom={formatDateLabel(latestPhoto?.capturedAt ?? null)}
                />
              }
            />
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top="연속 기록"
                  bottom={homeCopy.streakLabel(
                    reportState.streakCount,
                    hasWeeklyBadge,
                  )}
                />
              }
            />
          </List>
        ) : null}

        <Button
          size="medium"
          display="block"
          onPress={handlePrimaryCapture}
          disabled={isPrimaryCaptureDisabled}
          viewStyle={styles.fullButton}
        >
          {primaryCaptureCtaLabel}
        </Button>
      </ScrollView>

      <BottomSheet.Root
        open={isManageSheetOpen}
        onClose={() => setIsManageSheetOpen(false)}
        header={
          <BottomSheet.Header>{homeCopy.manageSheetTitle}</BottomSheet.Header>
        }
        headerDescription={
          <BottomSheet.HeaderDescription>
            {homeCopy.manageSlotHint}
          </BottomSheet.HeaderDescription>
        }
      >
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <List style={styles.panel} rowSeparator="none">
            <ListRow
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={homeCopy.manageSlotLabel(
                    plants.length,
                    unlockedPlantSlots,
                  )}
                  bottom={homeCopy.slotDescription}
                />
              }
            />
          </List>

          {activePlant != null ? (
            <TextField
              variant="box"
              label={homeCopy.plantNameLabel}
              labelOption="sustain"
              placeholder={homeCopy.plantNamePlaceholder}
              value={plantNameDraft}
              onChangeText={setPlantNameDraft}
              maxLength={20}
              onSubmitEditing={handleSavePlantName}
            />
          ) : null}

          {plantNameStatus.length > 0 ? (
            <List style={styles.panel} rowSeparator="none">
              <ListRow
                contents={
                  <ListRow.Texts type="1RowTypeA" top={plantNameStatus} />
                }
              />
            </List>
          ) : null}

          {unlockStatus.length > 0 ? (
            <List style={styles.panel} rowSeparator="none">
              <ListRow
                contents={<ListRow.Texts type="1RowTypeA" top={unlockStatus} />}
              />
            </List>
          ) : null}

          {activePlant != null ? (
            <>
              <Button
                size="medium"
                display="block"
                onPress={handleSavePlantName}
                viewStyle={styles.fullButton}
              >
                {homeCopy.ctaSaveName}
              </Button>
              <Button
                type="danger"
                style="weak"
                size="medium"
                display="block"
                onPress={handleDeleteSlot}
                viewStyle={styles.fullButton}
              >
                {homeCopy.ctaDeleteSlot}
              </Button>
            </>
          ) : null}

          <Button
            type={canAddPlant ? 'primary' : 'dark'}
            style={canAddPlant ? 'fill' : 'weak'}
            size="medium"
            display="block"
            onPress={handleAddPlantFromManage}
            viewStyle={styles.fullButton}
          >
            {canAddPlant ? homeCopy.ctaAddPlant : homeCopy.ctaUnlockPlant}
          </Button>

          <Button
            type="dark"
            style="weak"
            size="medium"
            display="block"
            onPress={() => setIsManageSheetOpen(false)}
            viewStyle={styles.fullButton}
          >
            {homeCopy.manageSheetClose}
          </Button>
        </ScrollView>
      </BottomSheet.Root>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.grey200,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  todayImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.grey100,
  },
  fullButton: {
    width: '100%',
  },
  sheetScroll: {
    maxHeight: 560,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
});
