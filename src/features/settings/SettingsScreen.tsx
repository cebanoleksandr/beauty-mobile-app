/**
 * Settings (Profile tab). Figma: Masters → node 7:2001, limited to what the
 * backend supports (`GET/PUT /api/user/me`, `PUT /api/user/me/active-role`):
 *
 *  - kept: Telegram profile header (avatar, name, @username, current mode),
 *    workspace switch (Client / Master, + Admin for admins), edit name,
 *    Telegram notifications status (`telegramLinked`, read-only), link to the
 *    user's own master profile, log out;
 *  - dropped (no backend data/settings): phone number, language, reminder &
 *    promotion toggles, payments, help center / support / legal links,
 *    build & session info, header back/help buttons.
 *
 * The backend only allows MASTER mode with a master profile that has at least
 * one active service (ERR_NO_ACTIVE_SERVICES) — without one, choosing Master
 * opens the "Become a master" onboarding instead.
 */
import { Languages } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClientInactiveIcon from '../../assets/icons/custom/client-inactive.svg';
import MasterActiveIcon from '../../assets/icons/custom/master-active.svg';
import ArrowIcon from '../../assets/icons/settings/arrow.svg';
import ChevronRight from '../../assets/icons/settings/chevron-right.svg';
import ClientIcon from '../../assets/icons/settings/client.svg';
import LogoutIcon from '../../assets/icons/settings/logout.svg';
import MasterBadgeIcon from '../../assets/icons/settings/master-badge.svg';
import MasterIcon from '../../assets/icons/settings/master.svg';
import PersonIcon from '../../assets/icons/settings/person.svg';
import TelegramBadge from '../../assets/icons/settings/telegram-badge.svg';
import TelegramIcon from '../../assets/icons/settings/telegram.svg';
import WorkspaceIcon from '../../assets/icons/settings/workspace.svg';
import { resolveApiUrl, userService, type UserContext, type UserResponse } from '../../api';
import { useSignOut } from '../../auth';
import { useMe, useUpdateMe } from '../../query';
import { formatRating } from '../../shared/format';
import { AmbientGlow, BottomSheet, RadioGroup } from '../../shared/ui';
import {
  deviceLanguage,
  i18n,
  languagePreference,
  useLanguagePreference,
  useTranslation,
  type LanguagePreference,
} from '../../i18n';
import { makeStyles, useTheme } from '../../theme';
import { SwitchModeSheet } from './SwitchModeSheet';

interface SettingsScreenProps {
  onOpenMasterProfile: (masterId: number) => void;
  /** Master onboarding (add the first services). */
  onBecomeMaster?: () => void;
}

const modeLabel = (mode: UserContext) => i18n.t(`mode.${mode}`);

const LANGUAGE_OPTIONS: LanguagePreference[] = ['system', 'uk', 'en', 'ru'];

export function SettingsScreen({ onOpenMasterProfile, onBecomeMaster }: SettingsScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me, isPending, isError, refetch } = useMe();
  const signOut = useSignOut();
  const { t } = useTranslation();
  const language = useLanguagePreference();
  const [editOpen, setEditOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const confirmSignOut = () =>
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logoutConfirm'), style: 'destructive', onPress: signOut },
    ]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('settings.title')}
        </Text>
      </View>

      {!me ? (
        <View style={styles.center}>
          {isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            isError && (
              <Pressable onPress={() => refetch()} accessibilityRole="button">
                <Text style={styles.link}>{t('settings.loadError')}</Text>
              </Pressable>
            )
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ProfileHeader me={me} />
          <WorkspaceCard me={me} onBecomeMaster={onBecomeMaster} />

          <Group title={t('settings.account')}>
            <Row
              Icon={PersonIcon}
              title={t('settings.editProfile')}
              subtitle={displayName(me) || t('settings.addName')}
              onPress={() => setEditOpen(true)}
            />
          </Group>

          <Group title={t('settings.app')}>
            <Row
              Icon={LanguageIcon}
              title={t('settings.language')}
              subtitle={languageName(language)}
              onPress={() => setLanguageOpen(true)}
            />
          </Group>

          <Group title={t('settings.notifications')}>
            <Row
              Icon={TelegramIcon}
              title={t('settings.telegramNotifications')}
              subtitle={me.telegramLinked ? t('settings.notificationsOn') : t('settings.notificationsOff')}
              trailing={
                <View style={[styles.statusPill, me.telegramLinked ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusText, me.telegramLinked ? styles.statusTextOn : styles.statusTextOff]}>
                    {me.telegramLinked ? t('settings.on') : t('settings.off')}
                  </Text>
                </View>
              }
            />
          </Group>

          {me.masterProfile && (
            <View style={styles.group}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupTitle}>{t('settings.masterAccess')}</Text>
                <Text style={styles.groupTag}>{modeLabel('MASTER')}</Text>
              </View>
              <Pressable
                onPress={() => onOpenMasterProfile(me.id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.masterCard, pressed && styles.pressed]}
              >
                <View style={styles.masterIcon}>
                  <MasterBadgeIcon />
                </View>
                <View style={styles.rowText}>
                  <View style={styles.masterTitleRow}>
                    <Text style={styles.rowTitle}>{t('settings.myMasterProfile')}</Text>
                    <View style={styles.configured}>
                      <Text style={styles.configuredText}>{t('settings.configured')}</Text>
                    </View>
                  </View>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {masterSubtitle(me)}
                  </Text>
                </View>
                <ArrowIcon />
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          >
            <LogoutIcon />
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </Pressable>
        </ScrollView>
      )}

      {me && <EditProfileSheet me={me} visible={editOpen} onClose={() => setEditOpen(false)} />}
      <BottomSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} title={t('settings.language')}>
        <RadioGroup
          value={language}
          options={LANGUAGE_OPTIONS.map(value => ({ value, label: languageName(value) }))}
          onChange={value => {
            languagePreference.set(value);
            setLanguageOpen(false);
          }}
          accessibilityLabel={t('settings.language')}
        />
      </BottomSheet>
    </View>
  );
}

function languageName(value: LanguagePreference): string {
  return value === 'system'
    ? i18n.t('settings.languageSystem', { language: i18n.t(`languages.${deviceLanguage()}`) })
    : i18n.t(`languages.${value}`);
}

function LanguageIcon() {
  const { colors } = useTheme();
  return <Languages size={18} color={colors.textAccent} strokeWidth={1.75} />;
}

function displayName(me: UserResponse): string {
  return [me.firstName, me.lastName].filter(Boolean).join(' ');
}

function masterSubtitle(me: UserResponse): string {
  const rating = formatRating(me.masterProfile?.rating);
  const bio = me.masterProfile?.bio?.trim();
  return [rating && `★ ${rating}`, bio || i18n.t('settings.viewPublicProfile')].filter(Boolean).join(' • ');
}

function ProfileHeader({ me }: { me: UserResponse }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const avatar = resolveApiUrl(me.photoUrl) ?? userService.photoUrl(me.id);
  return (
    <View style={styles.profileCard}>
      <AmbientGlow size={240} color="rgba(232, 180, 160, 0.1)" style={styles.profileGlow} />
      <View>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          </View>
        </View>
        <View style={styles.telegramBadge}>
          <TelegramBadge />
        </View>
      </View>
      <View style={styles.profileText}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName(me) || me.username || t('settings.telegramUser')}
          </Text>
          <View style={styles.modePill}>
            <View style={styles.modeDot} />
            <Text style={styles.modeText}>{modeLabel(me.context)}</Text>
          </View>
        </View>
        <View style={styles.handleRow}>
          {!!me.username && <Text style={styles.handle}>@{me.username}</Text>}
          {!!me.username && <Text style={styles.handleDot}>•</Text>}
          <Text style={styles.handleNote} numberOfLines={1}>
            {t('settings.signedInWithTelegram')}
          </Text>
        </View>
      </View>
    </View>
  );
}

function WorkspaceCard({ me, onBecomeMaster }: { me: UserResponse; onBecomeMaster?: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [sheetTarget, setSheetTarget] = useState<UserContext | null>(null);
  const modes: UserContext[] = me.isAdmin ? ['CLIENT', 'MASTER', 'ADMIN'] : ['CLIENT', 'MASTER'];
  const icons: Partial<Record<UserContext, { on: FC<SvgProps>; off: FC<SvgProps> }>> = {
    CLIENT: { on: ClientIcon, off: ClientInactiveIcon },
    MASTER: { on: MasterActiveIcon, off: MasterIcon },
  };

  // Tapping another mode opens the "Switch Mode" sheet to confirm (Figma 7:2311).
  const choose = (mode: UserContext) => {
    if (mode === me.context) return;
    if (mode === 'MASTER' && !me.masterProfile) {
      if (onBecomeMaster) onBecomeMaster();
      else Alert.alert(t('settings.noMasterTitle'), t('settings.noMasterText'));
      return;
    }
    setSheetTarget(mode);
  };

  return (
    <View style={styles.workspace}>
      <View style={styles.workspaceHeader}>
        <View style={styles.workspaceTitleRow}>
          <WorkspaceIcon />
          <Text style={styles.workspaceTitle}>{t('settings.currentWorkspace')}</Text>
        </View>
        {me.masterProfile && (
          <View style={styles.linkedBadge}>
            <Text style={styles.linkedText}>{t('settings.bothRoles')}</Text>
          </View>
        )}
      </View>

      <View style={styles.segments} accessibilityRole="radiogroup">
        {modes.map(mode => {
          const active = mode === me.context;
          const Icon = icons[mode] ? (active ? icons[mode]!.on : icons[mode]!.off) : null;
          return (
            <Pressable
              key={mode}
              onPress={() => choose(mode)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={t('mode.modeLabel', { mode: modeLabel(mode) })}
              style={[styles.segment, active && styles.segmentActive]}
            >
              {Icon && <Icon />}
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{modeLabel(mode)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.workspaceHint}>{t('settings.workspaceHint')}</Text>

      <SwitchModeSheet
        me={me}
        visible={sheetTarget !== null}
        initialTarget={sheetTarget ?? me.context}
        onClose={() => setSheetTarget(null)}
        onNeedsServices={onBecomeMaster}
      />
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, styles.groupTitlePadded]}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function Row({
  Icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  Icon: FC<SvgProps>;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <Icon />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {trailing ?? (onPress ? <ChevronRight /> : null)}
    </Pressable>
  );
}

function EditProfileSheet({ me, visible, onClose }: { me: UserResponse; visible: boolean; onClose: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const updateMe = useUpdateMe();
  const [firstName, setFirstName] = useState(me.firstName ?? '');
  const [lastName, setLastName] = useState(me.lastName ?? '');

  const save = () =>
    updateMe.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: onClose,
        onError: () => Alert.alert(t('settings.saveError'), t('common.pleaseTryAgain')),
      },
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        setFirstName(me.firstName ?? '');
        setLastName(me.lastName ?? '');
      }}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('settings.editProfile')}</Text>
          <Text style={styles.fieldLabel}>{t('settings.firstName')}</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            maxLength={128}
            placeholder={t('settings.firstName')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>{t('settings.lastName')}</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            maxLength={128}
            placeholder={t('settings.lastName')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={styles.input}
          />
          <Pressable
            onPress={save}
            disabled={updateMe.isPending}
            accessibilityRole="button"
            style={({ pressed }) => [styles.saveButton, (pressed || updateMe.isPending) && styles.pressed]}
          >
            {updateMe.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveLabel}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { ...t.typography.labelLarge, color: t.colors.primary },
  pressed: { opacity: t.opacity.pressed },

  header: {
    borderBottomWidth: t.borderWidth.thin,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: t.colors.chrome,
  },
  headerTitle: {
    height: 56,
    textAlignVertical: 'center',
    lineHeight: 56,
    textAlign: 'center',
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  content: {
    paddingTop: t.spacing.xxl,
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.xxxl,
    gap: t.spacing.xxl,
  },

  // Profile header
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
    padding: 21,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
    boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  profileGlow: { top: -96, left: -96 },
  avatarRing: {
    width: 64,
    height: 64,
    padding: 2,
    borderRadius: t.radii.full,
    backgroundImage:
      'linear-gradient(45deg, rgba(232, 180, 160, 0.8) 0%, rgba(255, 210, 193, 0.3) 50%, rgba(255, 210, 193, 0) 100%)',
    boxShadow: '0px 0px 16px 0px rgba(232, 180, 160, 0.2)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: t.radii.full,
    overflow: 'hidden',
    backgroundColor: t.colors.cardInner,
  },
  avatarImage: { width: '100%', height: '100%' },
  telegramBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: '#18181D',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
  },
  profileText: {
    flex: 1,
    gap: t.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.3)',
    backgroundColor: 'rgba(232, 180, 160, 0.15)',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
  },
  modeText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.25,
    color: t.colors.primary,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handle: {
    fontFamily: t.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: t.colors.telegram,
  },
  handleDot: {
    ...t.typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  handleNote: {
    flexShrink: 1,
    fontFamily: t.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: 'rgba(213, 195, 188, 0.8)',
  },

  // Workspace
  workspace: {
    gap: t.spacing.md,
    padding: 21,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.25)',
    backgroundColor: t.colors.cardInner,
    boxShadow: '0px 8px 16px 0px rgba(232, 180, 160, 0.12)',
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workspaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  workspaceTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.text,
  },
  linkedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(53, 52, 56, 0.6)',
  },
  linkedText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textAccent,
  },
  segments: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: 'rgba(14, 14, 17, 0.8)',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingVertical: 10,
    borderRadius: t.radii.md,
  },
  segmentActive: {
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
  segmentLabel: {
    fontFamily: t.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.textAccent,
  },
  segmentLabelActive: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.background,
  },
  workspaceHint: {
    ...t.typography.bodySmall,
    textAlign: 'center',
    color: 'rgba(213, 195, 188, 0.8)',
  },

  // Groups
  group: { gap: t.spacing.sm },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.sm,
  },
  groupTitle: {
    ...t.typography.overline,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  groupTitlePadded: { paddingHorizontal: t.spacing.sm },
  groupTag: {
    ...t.typography.overline,
    textTransform: 'uppercase',
    color: '#CEBDFF',
  },
  groupCard: {
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: t.spacing.lg,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.text,
  },
  rowSubtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
  },
  statusOn: { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(2, 44, 34, 0.6)' },
  statusOff: { borderColor: t.colors.borderSubtle, backgroundColor: t.colors.buttonNeutral },
  statusText: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 10,
    lineHeight: 14,
  },
  statusTextOn: { color: t.colors.success },
  statusTextOff: { color: t.colors.textSecondary },

  // Master card
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 17,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(206, 189, 255, 0.3)',
    backgroundImage: 'linear-gradient(170deg, #2A2A2D 0%, #1F1F22 50%, #1B1B1E 100%)',
    boxShadow: '0px 4px 12px 0px rgba(206, 189, 255, 0.08)',
  },
  masterIcon: {
    width: 40,
    height: 40,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(206, 189, 255, 0.3)',
    backgroundColor: 'rgba(206, 189, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  configured: {
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(206, 189, 255, 0.4)',
    backgroundColor: 'rgba(206, 189, 255, 0.2)',
  },
  configuredText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#CEBDFF',
  },

  // Log out
  logout: {
    marginTop: t.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingVertical: 15,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: t.colors.card,
  },
  logoutText: {
    fontFamily: t.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: 'rgba(251, 113, 133, 0.8)',
  },

  // Edit sheet
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    paddingTop: 9,
    paddingHorizontal: t.spacing.xl,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.card,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  sheetTitle: {
    marginTop: t.spacing.md,
    marginBottom: t.spacing.sm,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  fieldLabel: {
    ...t.typography.overline,
    marginTop: t.spacing.md,
    marginBottom: t.spacing.xs,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  input: {
    height: 48,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    fontFamily: t.fontFamily.regular,
    fontSize: 15,
    color: t.colors.text,
  },
  saveButton: {
    marginTop: t.spacing.xl,
    height: 48,
    borderRadius: t.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
  },
  saveLabel: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.background,
  },
}));
