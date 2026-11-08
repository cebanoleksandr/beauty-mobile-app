/**
 * Where the service takes place: reuse one of the master's service points, or
 * type an address (OpenStreetMap Nominatim suggestions, same as the web app),
 * or take the device location (reverse-geocoded to an address).
 */
import { Crosshair, MapPin, Search, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { TextField } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { useUserLocation } from '../../discover/useUserLocation';
import type { LocationValue, ServicePointOption } from '../offerForm';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy asks clients to identify themselves.
const HEADERS = {
  'Accept-Language': 'uk,en',
  'User-Agent': 'SlotlyMobile/1.0',
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  existingPoints?: readonly ServicePointOption[];
}

export function LocationPicker({ value, onChange, existingPoints = [] }: LocationPickerProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { locate } = useUserLocation();
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const search = (query: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(query.trim());
        const res = await fetch(`${NOMINATIM}/search?format=json&limit=5&addressdetails=0&q=${q}`, {
          headers: HEADERS,
        });
        setSuggestions((await res.json()) as NominatimResult[]);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await locate();
      if (!pos) return;
      const [lng, lat] = pos;
      let address = '';
      try {
        const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=17&lat=${lat}&lon=${lng}`, { headers: HEADERS });
        address = ((await res.json()) as { display_name?: string }).display_name ?? '';
      } catch {
        // keep the coordinates even if the address lookup fails
      }
      onChange({
        address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      });
      setSuggestions([]);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.root}>
      {existingPoints.length > 0 && (
        <View style={styles.points} accessibilityRole="radiogroup" accessibilityLabel={t('master.location.saved')}>
          {existingPoints.map(p => {
            const selected = value.existingPointId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() =>
                  onChange(
                    selected
                      ? { address: '' }
                      : {
                          address: p.address,
                          lat: p.lat ?? undefined,
                          lng: p.lng ?? undefined,
                          existingPointId: p.id,
                        },
                  )
                }
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={[styles.point, selected && styles.pointSelected]}
              >
                <MapPin size={16} color={selected ? colors.primary : colors.textSecondary} />
                <Text style={[styles.pointText, selected && styles.pointTextSelected]} numberOfLines={2}>
                  {p.address}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View>
        <TextField
          value={value.existingPointId ? '' : value.address}
          onChangeText={text => {
            onChange({ address: text });
            search(text);
          }}
          placeholder={existingPoints.length ? t('master.location.newAddress') : t('master.location.placeholder')}
          style={styles.input}
          accessibilityLabel={t('master.location.address')}
        />
        <View style={styles.inputIcon} pointerEvents="none">
          <Search size={16} color={colors.textSecondary} />
        </View>
        <View style={styles.inputRight}>
          {searching ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            !!value.address &&
            !value.existingPointId && (
              <Pressable
                onPress={() => {
                  onChange({ address: '' });
                  setSuggestions([]);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('master.location.clear')}
                hitSlop={8}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            )
          )}
        </View>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map(s => (
            <Pressable
              key={s.place_id}
              onPress={() => {
                onChange({
                  address: s.display_name,
                  lat: parseFloat(s.lat),
                  lng: parseFloat(s.lon),
                });
                setSuggestions([]);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
            >
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {s.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={useMyLocation}
        disabled={locating}
        accessibilityRole="button"
        style={({ pressed }) => [styles.locate, pressed && styles.pressed]}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Crosshair size={16} color={colors.primary} />
        )}
        <Text style={styles.locateText}>{t('master.location.useMine')}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  root: { gap: t.spacing.sm },
  pressed: { opacity: t.opacity.pressed },
  points: { gap: t.spacing.sm },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
  },
  pointSelected: {
    borderColor: 'rgba(232, 180, 160, 0.5)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
  },
  pointText: {
    ...t.typography.bodyMedium,
    flex: 1,
    color: t.colors.textAccent,
  },
  pointTextSelected: { color: t.colors.text },
  input: { paddingLeft: 40, paddingRight: 40 },
  inputIcon: { position: 'absolute', left: 14, top: 16 },
  inputRight: { position: 'absolute', right: 14, top: 14 },
  suggestions: {
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: t.borderWidth.hairline,
    borderBottomColor: t.colors.borderSubtle,
  },
  suggestionText: { ...t.typography.bodySmall, flex: 1, color: t.colors.text },
  locate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: t.spacing.xs,
  },
  locateText: { ...t.typography.labelMedium, color: t.colors.primary },
}));
