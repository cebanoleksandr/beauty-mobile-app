/** One offer in a list: name, duration · address, price; edit / delete actions. */
import { MapPin, Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatPrice } from '../../../shared/format';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { formatDurationOption } from '../offerForm';

interface OfferRowProps {
  name: string;
  price: number;
  durationMinutes: number;
  address?: string | null;
  description?: string | null;
  onEdit?: () => void;
  onDelete: () => void;
  busy?: boolean;
}

export function OfferRow({
  name,
  price,
  durationMinutes,
  address,
  description,
  onEdit,
  onDelete,
  busy,
}: OfferRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.row, busy && styles.busy]}>
      <Pressable
        onPress={onEdit}
        disabled={!onEdit || busy}
        accessibilityRole={onEdit ? 'button' : undefined}
        accessibilityLabel={onEdit ? t('master.offer.edit', { name }) : undefined}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.price}>{formatPrice(price)}</Text>
        </View>
        <Text style={styles.meta}>{formatDurationOption(durationMinutes)}</Text>
        {!!description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
        {!!address && (
          <View style={styles.addressRow}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          </View>
        )}
      </Pressable>
      <View style={styles.actions}>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('master.offer.edit', { name })}
            style={styles.iconButton}
          >
            <Pencil size={16} color={colors.textAccent} />
          </Pressable>
        )}
        <Pressable
          onPress={onDelete}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('master.offer.delete', { name })}
          style={styles.iconButton}
        >
          <Trash2 size={16} color="#FB7185" />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md,
    paddingLeft: t.spacing.lg,
    paddingRight: t.spacing.sm,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  busy: { opacity: t.opacity.disabled },
  pressed: { opacity: t.opacity.pressed },
  main: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  name: {
    flex: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  price: {
    fontFamily: t.fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.primary,
  },
  meta: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  description: { ...t.typography.bodySmall, color: t.colors.textAccent },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  address: {
    ...t.typography.bodySmall,
    flex: 1,
    color: t.colors.textSecondary,
  },
  actions: { gap: t.spacing.xs },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.cardInner,
  },
}));
