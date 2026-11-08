/**
 * Master → Clients: everyone who completed a visit, built from the master's
 * bookings — visits, revenue, last service; search, New / Loyal filters,
 * sorting, and a visit history per client. Web counterpart: master/clients.
 */
import { ArrowUpDown, ChevronDown, Search, Send, Users } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { resolveApiUrl } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { useBookings, useClientProfile } from '../../../query';
import { formatPrice } from '../../../shared/format';
import { openTelegramProfile } from '../../../shared/openTelegram';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageTitle,
  Segmented,
  Tag,
  TextField,
} from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { TabScreen } from '../../common/TabScreen';
import { ClientSheet } from '../components/ClientSheet';
import { shortDate, timeOf } from '../masterDates';
import {
  filterClients,
  LOYAL_MIN_VISITS,
  summarizeClients,
  type ClientFilter,
  type ClientSort,
  type ClientSummary,
} from './clientSummary';

const SORTS: ClientSort[] = ['recent', 'alphabet', 'revenue'];

export function MasterClientsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tr = useTranslate();
  const bookings = useBookings('as-master');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [sort, setSort] = useState<ClientSort>('recent');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  const clients = useMemo(() => summarizeClients(bookings.data ?? []), [bookings.data]);
  const visible = useMemo(() => filterClients(clients, query, filter, sort), [clients, query, filter, sort]);
  const newCount = clients.filter(c => c.visits === 1).length;
  const loyalCount = clients.filter(c => c.visits >= LOYAL_MIN_VISITS).length;
  const nextSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  const sortLabel = t(`master.clients.sort.${sort}`);

  return (
    <TabScreen
      refreshing={bookings.isRefetching}
      onRefresh={() => {
        bookings.refetch();
      }}
    >
      <PageTitle
        title={t('master.clients.title')}
        subtitle={t('master.clients.count', { count: clients.length })}
        right={
          <Pressable
            onPress={nextSort}
            accessibilityRole="button"
            accessibilityLabel={t('master.clients.sortLabel', { sort: sortLabel })}
            style={({ pressed }) => [styles.sort, pressed && styles.pressed]}
          >
            <ArrowUpDown size={14} color={colors.primary} />
            <Text style={styles.sortText}>{sortLabel}</Text>
          </Pressable>
        }
      />

      <View>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={t('master.clients.search')}
          style={styles.search}
          accessibilityLabel={t('master.clients.search')}
        />
        <View style={styles.searchIcon} pointerEvents="none">
          <Search size={16} color={colors.textSecondary} />
        </View>
      </View>

      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'all', label: t('master.clients.filter.all') },
          { key: 'new', label: t('master.clients.filter.new', { count: newCount }) },
          { key: 'loyal', label: t('master.clients.filter.loyal', { count: loyalCount }) },
        ]}
      />

      {bookings.isPending ? (
        <LoadingState />
      ) : bookings.isError ? (
        <ErrorState text={t('master.clients.loadError')} onRetry={() => bookings.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          Icon={Users}
          title={clients.length ? t('master.clients.noMatch') : t('master.clients.emptyTitle')}
          text={clients.length ? undefined : t('master.clients.emptyText')}
        />
      ) : (
        <View style={styles.list}>
          {visible.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              lastService={tr(c.lastService)}
              expanded={expanded === c.id}
              onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
              onOpenProfile={() => setProfileId(c.id)}
            />
          ))}
        </View>
      )}

      <ClientSheet clientId={profileId} onClose={() => setProfileId(null)} />
    </TabScreen>
  );
}

function ClientCard({
  client: c,
  lastService,
  expanded,
  onToggle,
  onOpenProfile,
}: {
  client: ClientSummary;
  lastService: string;
  expanded: boolean;
  onToggle: () => void;
  onOpenProfile: () => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.cardRow, pressed && styles.pressed]}
      >
        <Avatar uri={resolveApiUrl(c.avatarUrl)} name={c.name} rating={c.rating} onPress={onOpenProfile} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
            {c.visits >= LOYAL_MIN_VISITS && <Tag label={t('master.clients.loyal')} tone="success" />}
            {c.visits === 1 && <Tag label={t('master.clients.new')} />}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {t('master.clients.last', { date: shortDate(c.lastVisit), service: lastService })}
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.revenue}>{formatPrice(c.revenue)}</Text>
          <Text style={styles.meta}>{t('master.clients.visits', { count: c.visits })}</Text>
        </View>
        <ChevronDown size={16} color={colors.textSecondary} style={expanded ? styles.rotated : undefined} />
      </Pressable>
      {expanded && <VisitHistory client={c} />}
    </Card>
  );
}

function VisitHistory({ client }: { client: ClientSummary }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tr = useTranslate();
  // The username is on the client profile, not on bookings.
  const profile = useClientProfile(client.id);
  return (
    <View style={styles.history}>
      {client.history.map((b, i) => (
        <View key={b.id} style={styles.visit}>
          <View style={styles.timeline}>
            <View style={styles.timelineDot} />
            {i < client.history.length - 1 && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.meta}>
              {shortDate(b.scheduledTime)} • {timeOf(b.scheduledTime)}
            </Text>
            <Text style={styles.visitService} numberOfLines={1}>
              {tr(b.serviceName)}
            </Text>
          </View>
          <Text style={styles.visitPrice}>{formatPrice(b.price)}</Text>
        </View>
      ))}
      {!!profile.data?.username && (
        <Button
          label={t('master.client.message')}
          variant="secondary"
          compact
          icon={<Send size={15} color={colors.text} />}
          onPress={() => openTelegramProfile(profile.data?.username)}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  sortText: { ...t.typography.labelMedium, color: t.colors.primary },
  search: { paddingLeft: 40 },
  searchIcon: { position: 'absolute', left: 14, top: 16 },
  list: { gap: t.spacing.md },
  card: { padding: t.spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    flexShrink: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  meta: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  stats: { alignItems: 'flex-end' },
  revenue: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  rotated: { transform: [{ rotate: '180deg' }] },
  history: {
    marginTop: t.spacing.md,
    paddingTop: t.spacing.md,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: t.colors.borderSubtle,
    gap: t.spacing.xs,
  },
  visit: { flexDirection: 'row', gap: t.spacing.md, minHeight: 44 },
  timeline: { alignItems: 'center', width: 10, paddingTop: 5 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginTop: 3,
    backgroundColor: t.colors.borderSubtle,
  },
  visitService: { ...t.typography.bodyMedium, color: t.colors.text },
  visitPrice: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textAccent,
  },
}));
