/**
 * Master → Services: the master's offers grouped by category, with add /
 * edit / delete (`/api/v1/master/offers`). Web counterpart: master/services.
 */
import { Plus, Scissors } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { ApiError, type OfferResponse } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import {
  useCatalog,
  useCreateOffer,
  useDeleteOffer,
  useMasterOffers,
  useServicePoints,
  useUpdateOffer,
} from '../../../query';
import { Button, EmptyState, ErrorState, LoadingState, PageTitle, SectionTitle } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { TabScreen } from '../../common/TabScreen';
import { OfferEditorSheet } from '../components/OfferEditorSheet';
import { OfferRow } from '../components/OfferRow';
import { toCreateRequest, toUpdateRequest, type OfferFormValue } from '../offerForm';

export function MasterServicesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const tr = useTranslate();
  const { t } = useTranslation();
  const offers = useMasterOffers();
  const points = useServicePoints();
  const catalog = useCatalog();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<OfferResponse | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: OfferResponse[] }>();
    for (const o of offers.data ?? []) {
      if (!map.has(o.categoryId)) map.set(o.categoryId, { name: tr(o.categoryName), items: [] });
      map.get(o.categoryId)!.items.push(o);
    }
    return [...map.entries()];
  }, [offers.data, tr]);

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (offer: OfferResponse) => {
    setEditing(offer);
    setEditorOpen(true);
  };
  const close = () => {
    setEditorOpen(false);
    setEditing(null);
  };

  const save = (value: OfferFormValue) => {
    const onError = () => Alert.alert(t('master.services.saveError'), t('master.services.saveErrorText'));
    if (editing) updateOffer.mutate({ offerId: editing.id, ...toUpdateRequest(value) }, { onSuccess: close, onError });
    else createOffer.mutate(toCreateRequest(value), { onSuccess: close, onError });
  };

  const confirmDelete = (offer: OfferResponse) =>
    Alert.alert(t('master.services.deleteTitle'), t('master.services.deleteText', { name: tr(offer.serviceName) }), [
      { text: t('common.keep'), style: 'cancel' },
      {
        text: t('master.services.delete'),
        style: 'destructive',
        onPress: () =>
          deleteOffer.mutate(offer.id, {
            onError: e =>
              Alert.alert(
                t('master.services.deleteError'),
                e instanceof ApiError && e.isConflict ? t('master.services.hasBookings') : t('common.pleaseTryAgain'),
              ),
          }),
      },
    ]);

  return (
    <TabScreen
      refreshing={offers.isRefetching}
      onRefresh={() => {
        offers.refetch();
      }}
      overlay={
        (offers.data?.length ?? 0) > 0 && (
          <Pressable
            onPress={openAdd}
            accessibilityRole="button"
            accessibilityLabel={t('master.offer.addTitle')}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          >
            <Plus size={26} color={colors.background} />
          </Pressable>
        )
      }
    >
      <PageTitle title={t('master.services.title')} subtitle={t('master.services.subtitle')} />

      {offers.isPending ? (
        <LoadingState />
      ) : offers.isError ? (
        <ErrorState text={t('master.services.loadError')} onRetry={() => offers.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          Icon={Scissors}
          title={t('master.services.emptyTitle')}
          text={t('master.services.emptyText')}
          action={<Button label={t('master.offer.addTitle')} onPress={openAdd} style={styles.stretch} />}
        />
      ) : (
        groups.map(([id, group]) => (
          <View key={id} style={styles.group}>
            <SectionTitle>{group.name}</SectionTitle>
            {group.items.map(o => (
              <OfferRow
                key={o.id}
                name={tr(o.serviceName)}
                price={o.price}
                durationMinutes={o.durationMinutes}
                description={o.description}
                address={o.servicePoint?.address}
                onEdit={() => openEdit(o)}
                onDelete={() => confirmDelete(o)}
                busy={deleteOffer.isPending && deleteOffer.variables === o.id}
              />
            ))}
          </View>
        ))
      )}

      <OfferEditorSheet
        visible={editorOpen}
        catalog={catalog.data ?? []}
        existingPoints={points.data ?? []}
        editing={editing}
        saving={createOffer.isPending || updateOffer.isPending}
        onSave={save}
        onClose={close}
      />
    </TabScreen>
  );
}

const useStyles = makeStyles(t => ({
  group: { gap: t.spacing.md },
  stretch: { alignSelf: 'stretch' },
  pressed: { opacity: t.opacity.pressed },
  fab: {
    position: 'absolute',
    right: t.spacing.xl,
    bottom: t.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
    boxShadow: '0px 8px 24px 0px rgba(232, 180, 160, 0.3)',
  },
}));
