/**
 * Become a master: collect the first services, then
 * `POST /api/v1/master/onboarding` — creates the master profile (if missing),
 * the offers and switches the account to MASTER mode in one call.
 * Web counterpart: features/become-master.
 */
import { ChevronLeft, PartyPopper, Plus, Sparkles } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Translations } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { useCatalog, useSubmitOnboarding } from '../../../query';
import {
  AmbientGlow,
  Button,
  CircleIconButton,
  DotBadge,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { OfferEditorSheet } from '../components/OfferEditorSheet';
import { OfferRow } from '../components/OfferRow';
import type { OfferFormValue, ServicePointOption } from '../offerForm';

interface PendingOffer extends OfferFormValue {
  localId: string;
  serviceName: Translations;
}

interface BecomeMasterScreenProps {
  onBack: () => void;
  /** Onboarding finished — the account is in MASTER mode now. */
  onDone: () => void;
}

export function BecomeMasterScreen({ onBack, onDone }: BecomeMasterScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tr = useTranslate();
  const { t } = useTranslation();
  const catalog = useCatalog();
  const submit = useSubmitOnboarding();
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const nextId = useRef(0);

  // Addresses already entered can be reused for the next service.
  const points = useMemo<ServicePointOption[]>(() => {
    const seen = new Set<string>();
    return offers
      .filter(o => o.location.address.trim() && !seen.has(o.location.address) && seen.add(o.location.address))
      .map(o => ({
        id: `local-${o.localId}`,
        address: o.location.address,
        lat: o.location.lat ?? null,
        lng: o.location.lng ?? null,
      }));
  }, [offers]);

  const add = (value: OfferFormValue) => {
    const def = catalog.data?.flatMap(c => c.definitions).find(d => d.id === value.serviceDefinitionId);
    // A reused local point is just a copy of that address.
    const point = points.find(p => p.id === value.location.existingPointId);
    const location = point
      ? {
          address: point.address,
          lat: point.lat ?? undefined,
          lng: point.lng ?? undefined,
        }
      : value.location;
    nextId.current += 1;
    setOffers(prev => [
      ...prev,
      {
        ...value,
        location,
        localId: String(nextId.current),
        serviceName: def?.name ?? { en: t('master.onboarding.fallbackService') },
      },
    ]);
    setEditorOpen(false);
  };

  const finish = () =>
    submit.mutate({
      services: offers.map(o => ({
        service_id: o.serviceDefinitionId,
        price: o.price,
        duration_minutes: o.durationMinutes,
        description: o.description.trim() || undefined,
        address: o.location.address.trim() || undefined,
        lat: o.location.lat,
        lng: o.location.lng,
      })),
    });

  if (submit.isSuccess) {
    return (
      <View style={[styles.screen, styles.success, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <AmbientGlow size={420} color="rgba(232, 180, 160, 0.08)" style={styles.glow} />
        <View style={styles.successIcon}>
          <PartyPopper size={36} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.successTitle}>{t('master.onboarding.successTitle')}</Text>
        <Text style={styles.successText}>{t('master.onboarding.successText')}</Text>
        <Button label={t('master.onboarding.goToWorkspace')} onPress={onDone} style={styles.successButton} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AmbientGlow size={520} color="rgba(80, 40, 174, 0.08)" style={styles.glow} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <CircleIconButton
          icon={<ChevronLeft size={20} color={colors.text} />}
          onPress={onBack}
          accessibilityLabel={t('common.back')}
        />
        <DotBadge label={t('master.onboarding.badge')} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} accessibilityRole="header">
            {t('master.onboarding.titleBefore')}
            <Text style={styles.titleAccent}>{t('master.onboarding.titleAccent')}</Text>
            {t('master.onboarding.titleAfter')}
          </Text>
          <Text style={styles.subtitle}>{t('master.onboarding.subtitle')}</Text>
        </View>

        {catalog.isPending ? (
          <LoadingState />
        ) : catalog.isError ? (
          <ErrorState text={t('master.onboarding.catalogError')} onRetry={() => catalog.refetch()} />
        ) : offers.length === 0 ? (
          <EmptyState
            Icon={Sparkles}
            title={t('master.onboarding.emptyTitle')}
            text={t('master.onboarding.emptyText')}
          />
        ) : (
          <View style={styles.list}>
            {offers.map(o => (
              <OfferRow
                key={o.localId}
                name={tr(o.serviceName)}
                price={o.price}
                durationMinutes={o.durationMinutes}
                description={o.description}
                address={o.location.address}
                onDelete={() => setOffers(prev => prev.filter(x => x.localId !== o.localId))}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {submit.isError && <Text style={styles.error}>{t('master.onboarding.error')}</Text>}
        <Button
          label={t('master.offer.addTitle')}
          variant="secondary"
          icon={<Plus size={18} color={colors.text} />}
          onPress={() => setEditorOpen(true)}
          disabled={!catalog.data}
        />
        <Button
          label={
            offers.length ? t('master.onboarding.submitCount', { count: offers.length }) : t('master.onboarding.submit')
          }
          onPress={finish}
          disabled={offers.length === 0}
          loading={submit.isPending}
        />
      </View>

      <OfferEditorSheet
        visible={editorOpen}
        catalog={catalog.data ?? []}
        existingPoints={points}
        onSave={add}
        onClose={() => setEditorOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
    overflow: 'hidden',
  },
  glow: { top: -160, right: -200 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
  },
  headerSpacer: { width: t.sizes.iconButtonLg },
  content: {
    paddingTop: t.spacing.xxl,
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.xxl,
    gap: t.spacing.xxl,
  },
  titleBlock: { gap: t.spacing.sm },
  title: {
    fontFamily: t.fontFamily.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.75,
    color: '#FFFFFF',
  },
  titleAccent: { fontFamily: t.fontFamily.italic, color: t.colors.primary },
  subtitle: { ...t.typography.bodyMedium, color: t.colors.textAccent },
  list: { gap: t.spacing.md },
  footer: {
    gap: t.spacing.sm,
    paddingTop: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: t.colors.chrome,
  },
  error: { ...t.typography.bodySmall, textAlign: 'center', color: '#F2B8B5' },
  success: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.xxl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.25)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
    boxShadow: '0px 0px 32px 0px rgba(232, 180, 160, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: t.spacing.sm,
    fontFamily: t.fontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  successText: {
    ...t.typography.bodyMedium,
    textAlign: 'center',
    color: t.colors.textAccent,
  },
  successButton: { alignSelf: 'stretch', marginTop: t.spacing.lg },
}));
