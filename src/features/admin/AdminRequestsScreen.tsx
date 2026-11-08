/**
 * Admin → Requests: masters' pending catalog requests. "Consider" lets the
 * admin edit the proposed name (and the category of a service) before it is
 * written into the catalog and auto-translated (DeepL) on the backend.
 * Web counterpart: admin/requests + ConsiderSheet.
 */
import { ClipboardCheck, PencilLine, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { CatalogRequestResponse } from '../../api';
import { useTranslate } from '../../i18n/language';
import { useAdminCatalogRequests, useApproveCatalogRequest, useCatalog, useRejectCatalogRequest } from '../../query';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FieldLabel,
  LoadingState,
  PageTitle,
  Tag,
  TextField,
} from '../../shared/ui';
import { useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';
import { TabScreen } from '../common/TabScreen';
import { SelectField } from '../master/components/SelectField';
import { relativeTime } from './adminFormat';

export function AdminRequestsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tr = useTranslate();
  const requests = useAdminCatalogRequests('PENDING');
  const reject = useRejectCatalogRequest();
  const [considering, setConsidering] = useState<CatalogRequestResponse | null>(null);

  const confirmReject = (r: CatalogRequestResponse) =>
    Alert.alert(
      t('admin.requests.rejectTitle'),
      t('admin.requests.rejectText', { name: r.proposedName, requester: r.requesterName }),
      [
        { text: t('common.keep'), style: 'cancel' },
        {
          text: t('admin.requests.reject'),
          style: 'destructive',
          onPress: () =>
            reject.mutate(r.id, {
              onError: () => Alert.alert(t('admin.requests.rejectError'), t('common.pleaseTryAgain')),
            }),
        },
      ],
    );

  return (
    <TabScreen
      refreshing={requests.isRefetching}
      onRefresh={() => {
        requests.refetch();
      }}
    >
      <PageTitle title={t('admin.requests.title')} subtitle={t('admin.requests.subtitle')} />
      {requests.isPending ? (
        <LoadingState />
      ) : requests.isError ? (
        <ErrorState onRetry={() => requests.refetch()} />
      ) : requests.data.length === 0 ? (
        <EmptyState Icon={ClipboardCheck} title={t('admin.requests.emptyTitle')} text={t('admin.requests.emptyText')} />
      ) : (
        <View style={styles.list}>
          {requests.data.map(r => (
            <Card key={r.id} style={styles.card}>
              <View style={styles.tags}>
                <Tag
                  label={r.kind === 'CATEGORY' ? t('admin.requests.category') : t('admin.requests.service')}
                  tone="secondary"
                />
                {r.categoryName && (
                  <Text style={styles.category}>
                    {t('admin.requests.inCategory', { category: tr(r.categoryName) })}
                  </Text>
                )}
              </View>
              <Text style={styles.name}>{r.proposedName}</Text>
              <Text style={styles.meta}>
                {t('admin.requests.from', { name: r.requesterName, time: relativeTime(r.createdAt) })}
              </Text>
              <View style={styles.actions}>
                <Button
                  label={t('admin.requests.consider')}
                  compact
                  icon={<PencilLine size={15} color={colors.background} />}
                  onPress={() => setConsidering(r)}
                  disabled={reject.isPending}
                  style={styles.flex}
                />
                <Button
                  label={t('admin.requests.reject')}
                  compact
                  variant="danger"
                  icon={<X size={15} color="#FB7185" />}
                  onPress={() => confirmReject(r)}
                  disabled={reject.isPending}
                  style={styles.flex}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
      <ConsiderSheet request={considering} onClose={() => setConsidering(null)} />
    </TabScreen>
  );
}

function ConsiderSheet({ request, onClose }: { request: CatalogRequestResponse | null; onClose: () => void }) {
  const tr = useTranslate();
  const { t } = useTranslation();
  const catalog = useCatalog();
  const approve = useApproveCatalogRequest();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const isService = request?.kind === 'SERVICE';
  const valid = name.trim().length > 0 && (!isService || !!categoryId);

  const save = () => {
    if (!request || !valid) return;
    approve.mutate(
      {
        id: request.id,
        name: name.trim(),
        categoryId: isService ? categoryId : undefined,
      },
      {
        onSuccess: onClose,
        onError: () => Alert.alert(t('admin.requests.approveError'), t('common.pleaseTryAgain')),
      },
    );
  };

  return (
    <BottomSheet
      visible={request !== null}
      onClose={onClose}
      onShow={() => {
        setName(request?.proposedName ?? '');
        setCategoryId(request?.categoryId ?? '');
      }}
      title={t('admin.requests.considerTitle')}
      subtitle={t('admin.requests.considerSubtitle')}
      footer={
        <Button label={t('admin.requests.approve')} onPress={save} disabled={!valid} loading={approve.isPending} />
      }
    >
      {isService && (
        <>
          <FieldLabel>{t('admin.requests.category')}</FieldLabel>
          <SelectField
            value={categoryId}
            options={(catalog.data ?? []).map(c => ({
              value: c.id,
              label: tr(c.name),
            }))}
            placeholder={t('master.offer.selectCategory')}
            onChange={setCategoryId}
            accessibilityLabel={t('admin.requests.category')}
          />
        </>
      )}
      <FieldLabel>{t('admin.requests.name')}</FieldLabel>
      <TextField value={name} onChangeText={setName} maxLength={120} accessibilityLabel={t('admin.requests.name')} />
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  list: { gap: t.spacing.md },
  card: { gap: t.spacing.sm },
  tags: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  category: { ...t.typography.bodySmall, color: t.colors.textAccent },
  name: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  meta: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  actions: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xs },
}));
