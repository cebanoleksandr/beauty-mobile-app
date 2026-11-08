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

const DURATIONS = DURATION_OPTIONS.map(m => ({
  value: m,
  label: formatDurationOption(m),
}));

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
          Alert.alert('Request sent', 'Admins will review it. You will be notified in Telegram.');
          setRequesting(null);
          setRequestName('');
        },
        onError: () => Alert.alert('Could not send the request', 'Please try again.'),
      },
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onShow={reset}
      title={editing ? 'Edit service' : 'Add a service'}
      subtitle={editing ? tr(editing.serviceName) : 'Pick a service from the catalog and set your price'}
      footer={
        <Button
          label={editing ? 'Save changes' : 'Save service'}
          onPress={() => valid && onSave(value)}
          disabled={!valid}
          loading={saving}
        />
      }
    >
      {!editing && (
        <>
          <FieldLabel>Category</FieldLabel>
          <SelectField
            value={categoryId}
            options={catalog.map(c => ({ value: c.id, label: tr(c.name) }))}
            placeholder="Select a category"
            accessibilityLabel="Category"
            onChange={id => {
              setCategoryId(id);
              patch({ serviceDefinitionId: '' });
            }}
            extraLabel="Request a new category"
            onExtra={() => setRequesting('CATEGORY')}
          />

          <FieldLabel>Service</FieldLabel>
          <SelectField
            value={value.serviceDefinitionId}
            options={(category?.definitions ?? []).map(d => ({
              value: d.id,
              label: tr(d.name),
            }))}
            placeholder={category ? 'Select a service' : 'Choose a category first'}
            accessibilityLabel="Service"
            disabled={!category}
            onChange={id => patch({ serviceDefinitionId: id })}
            extraLabel={category ? 'Request a new service' : undefined}
            onExtra={() => setRequesting('SERVICE')}
          />

          {requesting && (
            <View style={styles.request}>
              <Text style={styles.requestTitle}>
                {requesting === 'CATEGORY' ? 'Suggest a category' : `Suggest a service in ${tr(category?.name)}`}
              </Text>
              <TextField
                value={requestName}
                onChangeText={setRequestName}
                placeholder="Name, e.g. “Lash lift”"
                maxLength={120}
                autoFocus
              />
              <View style={styles.requestActions}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  compact
                  style={styles.flex}
                  onPress={() => {
                    setRequesting(null);
                    setRequestName('');
                  }}
                />
                <Button
                  label="Send request"
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

      <FieldLabel>Price, ₴</FieldLabel>
      <TextField
        value={value.price > 0 ? String(value.price) : ''}
        onChangeText={raw => {
          const digits = raw.replace(/\D/g, '');
          patch({ price: digits ? Number(digits) : 0 });
        }}
        keyboardType="number-pad"
        placeholder="e.g. 800"
        maxLength={7}
        accessibilityLabel="Price"
      />

      <FieldLabel>Duration</FieldLabel>
      <ChoiceChips
        options={DURATIONS}
        value={value.durationMinutes || null}
        onChange={m => patch({ durationMinutes: m })}
        accessibilityLabel="Duration"
      />

      <FieldLabel>Description (optional)</FieldLabel>
      <TextField
        value={value.description}
        onChangeText={description => patch({ description })}
        placeholder="What's included, materials, aftercare…"
        maxLength={1000}
        multiline
      />

      <FieldLabel>Location</FieldLabel>
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
