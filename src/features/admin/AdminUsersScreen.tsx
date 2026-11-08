/**
 * Admin → Users: current admins (revoke), user search, ban (optional reason)
 * / unban and grant admin. Web counterpart: admin/settings.
 */
import { Ban, CircleCheck, Search, ShieldCheck, ShieldOff, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import type { UserAdminResponse } from '../../api';
import {
  useAdminAdmins,
  useAdminUsers,
  useBanUser,
  useGrantAdmin,
  useMe,
  useRevokeAdmin,
  useUnbanUser,
} from '../../query';
import { useDebouncedValue } from '../../shared/useDebouncedValue';
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageTitle,
  SectionTitle,
  Tag,
  TextField,
} from '../../shared/ui';
import { makeStyles, useTheme } from '../../theme';
import { TabScreen } from '../common/TabScreen';

export function displayName(u: UserAdminResponse): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || (u.username ? `@${u.username}` : `#${u.id}`);
}

export function AdminUsersScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { data: me } = useMe();
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), 300);
  const users = useAdminUsers(query);
  const admins = useAdminAdmins();
  const unban = useUnbanUser();
  const grant = useGrantAdmin();
  const revoke = useRevokeAdmin();
  const [banning, setBanning] = useState<UserAdminResponse | null>(null);
  const busy = unban.isPending || grant.isPending || revoke.isPending;
  const onError = () => Alert.alert('Action failed', 'Please try again.');

  const confirm = (title: string, message: string, action: string, run: () => void, destructive = false) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: destructive ? 'destructive' : 'default',
        onPress: run,
      },
    ]);

  return (
    <TabScreen
      refreshing={users.isRefetching || admins.isRefetching}
      onRefresh={() => {
        users.refetch();
        admins.refetch();
      }}
    >
      <PageTitle title="Users" subtitle="Admins, bans and access" />

      {!!admins.data?.length && (
        <View style={styles.section}>
          <SectionTitle>{`Admins (${admins.data.length})`}</SectionTitle>
          <View style={styles.group}>
            {admins.data.map((u, i) => (
              <View key={u.id} style={[styles.adminRow, i < admins.data!.length - 1 && styles.divider]}>
                <Avatar name={displayName(u)} size={36} />
                <Text style={[styles.name, styles.flex]} numberOfLines={1}>
                  {displayName(u)}
                  {u.id === me?.id ? ' (you)' : ''}
                </Text>
                {u.id !== me?.id && (
                  <Button
                    label="Revoke"
                    compact
                    variant="danger"
                    icon={<ShieldOff size={14} color="#FB7185" />}
                    disabled={busy}
                    onPress={() =>
                      confirm(
                        'Revoke admin access?',
                        displayName(u),
                        'Revoke',
                        () => revoke.mutate(u.id, { onError }),
                        true,
                      )
                    }
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionTitle>Users</SectionTitle>
        <View>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or @username"
            autoCapitalize="none"
            style={styles.search}
            accessibilityLabel="Search users"
          />
          <View style={styles.searchIcon} pointerEvents="none">
            <Search size={16} color={colors.textSecondary} />
          </View>
        </View>

        {users.isPending ? (
          <LoadingState />
        ) : users.isError ? (
          <ErrorState onRetry={() => users.refetch()} />
        ) : users.data.length === 0 ? (
          <EmptyState Icon={Users} title="No users found" />
        ) : (
          users.data.map(u => (
            <Card key={u.id} style={styles.card}>
              <View style={styles.userRow}>
                <Avatar name={displayName(u)} size={40} />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>
                    {displayName(u)}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[u.username && `@${u.username}`, `ID ${u.id}`].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                {u.isAdmin && <ShieldCheck size={18} color={colors.primary} />}
                {u.isBanned && <Tag label="Banned" tone="danger" />}
              </View>
              {u.isBanned && !!u.bannedReason && <Text style={styles.reason}>Reason: {u.bannedReason}</Text>}
              {u.id !== me?.id && (
                <View style={styles.actions}>
                  {u.isBanned ? (
                    <Button
                      label="Unban"
                      compact
                      variant="secondary"
                      icon={<CircleCheck size={15} color={colors.text} />}
                      disabled={busy}
                      style={styles.flex}
                      onPress={() =>
                        confirm('Unban this user?', displayName(u), 'Unban', () => unban.mutate(u.id, { onError }))
                      }
                    />
                  ) : (
                    <Button
                      label="Ban"
                      compact
                      variant="danger"
                      icon={<Ban size={15} color="#FB7185" />}
                      // Admins must lose admin rights before they can be banned.
                      disabled={busy || u.isAdmin}
                      style={styles.flex}
                      onPress={() => setBanning(u)}
                    />
                  )}
                  {!u.isAdmin && !u.isBanned && (
                    <Button
                      label="Make admin"
                      compact
                      variant="secondary"
                      icon={<ShieldCheck size={15} color={colors.text} />}
                      disabled={busy}
                      style={styles.flex}
                      onPress={() =>
                        confirm(
                          'Grant admin access?',
                          `${displayName(u)} will be able to moderate the platform.`,
                          'Grant',
                          () => grant.mutate(u.id, { onError }),
                        )
                      }
                    />
                  )}
                </View>
              )}
            </Card>
          ))
        )}
      </View>

      <BanSheet user={banning} onClose={() => setBanning(null)} />
    </TabScreen>
  );
}

function BanSheet({ user, onClose }: { user: UserAdminResponse | null; onClose: () => void }) {
  const styles = useStyles();
  const ban = useBanUser();
  const [reason, setReason] = useState('');
  return (
    <BottomSheet
      visible={user !== null}
      onClose={onClose}
      onShow={() => setReason('')}
      title="Ban user"
      subtitle={user ? `${displayName(user)} will lose access to the app` : undefined}
      footer={
        <Button
          label="Ban user"
          variant="danger"
          loading={ban.isPending}
          onPress={() =>
            user &&
            ban.mutate(
              { userId: user.id, reason: reason.trim() || undefined },
              {
                onSuccess: onClose,
                onError: () => Alert.alert('Could not ban', 'Please try again.'),
              },
            )
          }
        />
      }
    >
      <TextField
        value={reason}
        onChangeText={setReason}
        placeholder="Reason (optional, visible to admins)"
        maxLength={500}
        multiline
      />
      <Pressable onPress={onClose} accessibilityRole="button" style={styles.cancel}>
        <Text style={styles.meta}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  section: { gap: t.spacing.md },
  group: {
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
    overflow: 'hidden',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: t.borderWidth.hairline,
    borderBottomColor: t.colors.borderSubtle,
  },
  search: { paddingLeft: 40 },
  searchIcon: { position: 'absolute', left: 14, top: 16 },
  card: { gap: t.spacing.md, padding: t.spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  name: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  meta: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  reason: { ...t.typography.bodySmall, color: '#F2B8B5' },
  actions: { flexDirection: 'row', gap: t.spacing.sm },
  cancel: { alignSelf: 'center', paddingVertical: t.spacing.md },
}));
