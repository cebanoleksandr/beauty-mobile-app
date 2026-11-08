/**
 * "Switch Mode" bottom sheet. Figma node 7:2311. Confirms a mode change
 * before calling `PUT /api/user/me/active-role`.
 *
 * Backend rules: MASTER needs a master profile with at least one active
 * service (400 ERR_NO_ACTIVE_SERVICES); ADMIN only for admins. The design's
 * hint mentioned chats — the app has none, so it only mentions bookings.
 */
import { ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState, type FC } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowRight from '../../assets/icons/switch-mode/arrow-right.svg';
import CheckIcon from '../../assets/icons/switch-mode/check.svg';
import ClientIcon from '../../assets/icons/switch-mode/client.svg';
import CloseIcon from '../../assets/icons/switch-mode/close.svg';
import HintIcon from '../../assets/icons/switch-mode/hint.svg';
import MasterIcon from '../../assets/icons/switch-mode/master.svg';
import { ApiError, type UserContext, type UserResponse } from '../../api';
import { useSwitchMode } from '../../query';
import { i18n, useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';

const modeLabel = (mode: UserContext) => i18n.t(`mode.${mode}`);
const modeDescription = (mode: UserContext) => i18n.t(`switchMode.desc.${mode}`);

interface SwitchModeSheetProps {
  me: UserResponse;
  visible: boolean;
  /** Mode preselected when the sheet opens (e.g. the segment the user tapped). */
  initialTarget: UserContext;
  onClose: () => void;
  /** MASTER was refused for lack of active services — open the onboarding. */
  onNeedsServices?: () => void;
}

export function SwitchModeSheet({ me, visible, initialTarget, onClose, onNeedsServices }: SwitchModeSheetProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const switchMode = useSwitchMode();
  const [target, setTarget] = useState<UserContext>(initialTarget);

  useEffect(() => {
    if (visible) setTarget(initialTarget);
  }, [visible, initialTarget]);

  const modes: UserContext[] = me.isAdmin ? ['CLIENT', 'MASTER', 'ADMIN'] : ['CLIENT', 'MASTER'];
  const available = (mode: UserContext) => mode !== 'MASTER' || !!me.masterProfile;
  const unchanged = target === me.context;

  const confirm = () => {
    if (unchanged) return onClose();
    switchMode.mutate(target, {
      onSuccess: onClose,
      onError: error => {
        const noServices = error instanceof ApiError && error.status === 400;
        Alert.alert(
          t('switchMode.errorTitle'),
          noServices ? t('switchMode.noServices') : t('common.pleaseTryAgain'),
          noServices && onNeedsServices
            ? [
                { text: t('switchMode.notNow'), style: 'cancel' },
                {
                  text: t('switchMode.addServices'),
                  onPress: () => {
                    onClose();
                    onNeedsServices();
                  },
                },
              ]
            : undefined,
        );
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              {t('switchMode.title')}
            </Text>
            <Text style={styles.subtitle}>{t('switchMode.subtitle')}</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={styles.close}
          >
            <CloseIcon />
          </Pressable>
        </View>

        <View style={styles.options} accessibilityRole="radiogroup">
          {modes.map(mode => (
            <ModeOption
              key={mode}
              mode={mode}
              current={mode === me.context}
              selected={mode === target}
              disabled={!available(mode)}
              onSelect={() => setTarget(mode)}
            />
          ))}
        </View>

        <View style={styles.hint}>
          <HintIcon />
          <Text style={styles.hintText}>{t('switchMode.hint')}</Text>
        </View>

        <Pressable
          onPress={confirm}
          disabled={switchMode.isPending}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, (pressed || switchMode.isPending) && styles.pressed]}
        >
          {switchMode.isPending ? (
            <ActivityIndicator color={styles.primaryLabel.color} />
          ) : (
            <>
              <Text style={styles.primaryLabel}>
                {unchanged
                  ? t('switchMode.stay', { mode: modeLabel(target) })
                  : t('switchMode.switchTo', { mode: modeLabel(target) })}
              </Text>
              {!unchanged && <ArrowRight />}
            </>
          )}
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t('switchMode.keep')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function ModeOption({
  mode,
  current,
  selected,
  disabled,
  onSelect,
}: {
  mode: UserContext;
  current: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const icons: Partial<Record<UserContext, FC<SvgProps>>> = { CLIENT: ClientIcon, MASTER: MasterIcon };
  const Icon = icons[mode];

  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={t('mode.modeLabel', { mode: modeLabel(mode) })}
      style={[styles.option, selected ? styles.optionSelected : styles.optionIdle, disabled && styles.optionDisabled]}
    >
      <View style={[styles.optionIcon, selected ? styles.optionIconSelected : styles.optionIconIdle]}>
        {Icon ? <Icon /> : <ShieldCheck size={20} color={colors.textSecondary} strokeWidth={1.75} />}
      </View>
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <Text style={styles.optionTitle}>{modeLabel(mode)}</Text>
          {current && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t('switchMode.active')}</Text>
            </View>
          )}
        </View>
        <Text style={styles.optionDescription}>{disabled ? t('switchMode.needsProfile') : modeDescription(mode)}</Text>
      </View>
      <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>{selected && <CheckIcon />}</View>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    paddingTop: 7,
    paddingHorizontal: t.spacing.xxl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.card,
    boxShadow: '0px -12px 20px 0px rgba(0, 0, 0, 0.85)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: '#353438',
  },
  header: {
    marginTop: t.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, gap: 2 },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.55,
    color: t.colors.text,
  },
  subtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(42, 42, 45, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    marginTop: t.spacing.xxl,
    gap: t.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
  },
  optionSelected: {
    borderColor: 'rgba(232, 180, 160, 0.4)',
    backgroundColor: t.colors.cardInner,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.08)',
  },
  optionIdle: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(31, 31, 34, 0.6)',
  },
  optionDisabled: { opacity: 0.5 },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    borderColor: 'rgba(232, 180, 160, 0.2)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
  },
  optionIconIdle: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(53, 52, 56, 0.4)',
  },
  optionText: {
    flex: 1,
    paddingLeft: 14,
    gap: 2,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  optionTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  activeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 1,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.3)',
    backgroundColor: 'rgba(232, 180, 160, 0.15)',
  },
  activeBadgeText: {
    fontFamily: t.fontFamily.regular,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: t.colors.primary,
  },
  optionDescription: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: t.colors.primary },
  radioOff: {
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hint: {
    marginTop: t.spacing.xxl,
    paddingHorizontal: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  hintText: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  primary: {
    marginTop: t.spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: 14,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.2)',
  },
  pressed: { opacity: t.opacity.pressed },
  primaryLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.background,
  },
  secondary: {
    marginTop: t.spacing.md,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textSecondary,
  },
}));
