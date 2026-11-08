/**
 * Add / edit a service offer. Web counterpart: master/services/OfferFormSheet.
 * Category and service come from the platform catalog; a missing one can be
 * requested from admins (`POST /api/master/catalog-requests`). When editing,
 * the service itself is fixed (the backend only updates price, duration,
 * description and location).
 */
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { CategoryDto, OfferResponse } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { useCreateCatalogRequest } from '../../../query';
import { BottomSheet, Button, ChoiceChips, FieldLabel, TextField } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';
import { DURATION_OPTIONS, formatDurationOption, type OfferFormValue, type ServicePointOption } from '../offerForm';
import { LocationPicker } from './LocationPicker';
import { SelectField } from './SelectField';

interface OfferEditorSheetProps {
  visible: boolean;
  catalog: readonly CategoryDto[];
  existingPoints: readonly ServicePointOption[];
  editing?: OfferResponse | null;
  saving?: boolean;
  onSave: (value: OfferFormValue) => void;
  onClose: () => void;
}

function initialValue(editing?: OfferResponse | null): OfferFormValue {
  return {
    serviceDefinitionId: editing?.serviceDefinitionId ?? '',
    price: editing?.price ?? 0,
    durationMinutes: editing?.durationMinutes ?? 0,
    description: editing?.description ?? '',
    location: editing?.servicePoint
      ? {
          address: editing.servicePoint.address,
          lat: editing.servicePoint.lat ?? undefined,
          lng: editing.servicePoint.lng ?? undefined,
          existingPointId: editing.servicePoint.id,
        }
      : { address: '' },
  };
}

export function OfferEditorSheet({
  visible,
  catalog,
  existingPoints,
  editing,
  saving,
  onSave,
  onClose,
}: OfferEditorSheetProps) {
  const styles = useStyles();
  const tr = useTranslate();
  const createRequest = useCreateCatalogRequest();
  const { t } = useTranslation();
  const durations = DURATION_OPTIONS.map(m => ({ value: m, label: formatDurationOption(m) }));
  const [value, setValue] = useState<OfferFormValue>(() => initialValue(editing));
  const [categoryId, setCategoryId] = useState('');
  const [requesting, setRequesting] = useState<'CATEGORY' | 'SERVICE' | null>(null);
  const [requestName, setRequestName] = useState('');

  const reset = () => {
    setValue(initialValue(editing));
    setCategoryId(
      editing ? catalog.find(c => c.definitions.some(d => d.id === editing.serviceDefinitionId))?.id ?? '' : '',
    );
    setRequesting(null);
    setRequestName('');
  };

  const patch = (p: Partial<OfferFormValue>) => setValue(v => ({ ...v, ...p }));
  const category = catalog.find(c => c.id === categoryId);
  const valid = (editing || value.serviceDefinitionId) && value.price > 0 && value.durationMinutes > 0;

  const sendRequest = () => {
    if (!requesting || !requestName.trim()) return;
    createRequest.mutate(
      {
        kind: requesting,
        proposedName: requestName.trim(),
        categoryId: requesting === 'SERVICE' ? categoryId : undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t('master.offer.requestSentTitle'), t('master.offer.requestSentText'));
          setRequesting(null);
          setRequestName('');
        },
        onError: () => Alert.alert(t('master.offer.requestError'), t('common.pleaseTryAgain')),
      },
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onShow={reset}
      title={editing ? t('master.offer.editTitle') : t('master.offer.addTitle')}
      subtitle={editing ? tr(editing.serviceName) : t('master.offer.addSubtitle')}
      footer={
        <Button
          label={editing ? t('master.offer.saveChanges') : t('master.offer.saveService')}
          onPress={() => valid && onSave(value)}
          disabled={!valid}
          loading={saving}
        />
      }
    >
      {!editing && (
        <>
          <FieldLabel>{t('master.offer.category')}</FieldLabel>
          <SelectField
            value={categoryId}
            options={catalog.map(c => ({ value: c.id, label: tr(c.name) }))}
            placeholder={t('master.offer.selectCategory')}
            accessibilityLabel={t('master.offer.category')}
            onChange={id => {
              setCategoryId(id);
              patch({ serviceDefinitionId: '' });
            }}
            extraLabel={t('master.offer.requestCategory')}
            onExtra={() => setRequesting('CATEGORY')}
          />

          <FieldLabel>{t('master.offer.service')}</FieldLabel>
          <SelectField
            value={value.serviceDefinitionId}
            options={(category?.definitions ?? []).map(d => ({
              value: d.id,
              label: tr(d.name),
            }))}
            placeholder={category ? t('master.offer.selectService') : t('master.offer.categoryFirst')}
            accessibilityLabel={t('master.offer.service')}
            disabled={!category}
            onChange={id => patch({ serviceDefinitionId: id })}
            extraLabel={category ? t('master.offer.requestService') : undefined}
            onExtra={() => setRequesting('SERVICE')}
          />

          {requesting && (
            <View style={styles.request}>
              <Text style={styles.requestTitle}>
                {requesting === 'CATEGORY'
                  ? t('master.offer.suggestCategory')
                  : t('master.offer.suggestService', { category: tr(category?.name) })}
              </Text>
              <TextField
                value={requestName}
                onChangeText={setRequestName}
                placeholder={t('master.offer.requestPlaceholder')}
                maxLength={120}
                autoFocus
              />
              <View style={styles.requestActions}>
                <Button
                  label={t('common.cancel')}
                  variant="secondary"
                  compact
                  style={styles.flex}
                  onPress={() => {
                    setRequesting(null);
                    setRequestName('');
                  }}
                />
                <Button
                  label={t('master.offer.sendRequest')}
                  compact
                  style={styles.flex}
                  disabled={!requestName.trim()}
                  loading={createRequest.isPending}
                  onPress={sendRequest}
                />
              </View>
            </View>
          )}
        </>
      )}

      <FieldLabel>{t('master.offer.price')}</FieldLabel>
      <TextField
        value={value.price > 0 ? String(value.price) : ''}
        onChangeText={raw => {
          const digits = raw.replace(/\D/g, '');
          patch({ price: digits ? Number(digits) : 0 });
        }}
        keyboardType="number-pad"
        placeholder={t('master.offer.pricePlaceholder')}
        maxLength={7}
        accessibilityLabel={t('master.offer.priceLabel')}
      />

      <FieldLabel>{t('master.offer.duration')}</FieldLabel>
      <ChoiceChips
        options={durations}
        value={value.durationMinutes || null}
        onChange={m => patch({ durationMinutes: m })}
        accessibilityLabel={t('master.offer.duration')}
      />

      <FieldLabel>{t('master.offer.description')}</FieldLabel>
      <TextField
        value={value.description}
        onChangeText={description => patch({ description })}
        placeholder={t('master.offer.descriptionPlaceholder')}
        maxLength={1000}
        multiline
      />

      <FieldLabel>{t('master.offer.location')}</FieldLabel>
      <LocationPicker
        value={value.location}
        onChange={location => patch({ location })}
        existingPoints={existingPoints}
      />
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  request: {
    marginTop: t.spacing.md,
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(206, 189, 255, 0.25)',
    backgroundColor: 'rgba(80, 40, 174, 0.12)',
  },
  requestTitle: { ...t.typography.labelLarge, color: '#CEBDFF' },
  requestActions: { flexDirection: 'row', gap: t.spacing.sm },
}));
