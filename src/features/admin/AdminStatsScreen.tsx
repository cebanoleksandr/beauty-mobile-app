/**
 * Admin → Stats (`GET /api/admin/stats?days=`) plus the latest admin actions
 * (`GET /api/admin/audit-log`). Web counterpart: admin/stats.
 */
import { BarChart3, Star } from 'lucide-react-native';
import React, { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AdminStatsResponse, AuditLogEntryResponse } from '../../api';
import { useTranslate } from '../../i18n/language';
import { useAdminStats, useAuditLog } from '../../query';
import { ChoiceChips, ErrorState, LoadingState, PageTitle, SectionTitle } from '../../shared/ui';
import { i18n, useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';
import { TabScreen } from '../common/TabScreen';
import { dateTime, formatMinutes, percent, utcDay } from './adminFormat';

const PERIODS = [7, 30, 90];

export function AdminStatsScreen() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const stats = useAdminStats(days);
  const audit = useAuditLog(20);

  return (
    <TabScreen
      refreshing={stats.isRefetching || audit.isRefetching}
      onRefresh={() => {
        stats.refetch();
        audit.refetch();
      }}
    >
      <PageTitle title={t('admin.stats.title')} subtitle={t('admin.stats.subtitle')} />
      <ChoiceChips
        options={PERIODS.map(d => ({ value: d, label: t('admin.stats.days', { count: d }) }))}
        value={days}
        onChange={setDays}
        accessibilityLabel={t('admin.stats.period')}
      />
      {stats.data ? (
        <StatsBody stats={stats.data} />
      ) : stats.isError ? (
        <ErrorState onRetry={() => stats.refetch()} />
      ) : (
        <LoadingState />
      )}
      <AuditLog entries={audit.data} loading={audit.isPending} />
    </TabScreen>
  );
}

function StatsBody({ stats }: { stats: AdminStatsResponse }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const tr = useTranslate();
  const { users, bookings, moderation } = stats;
  const approval = percent(bookings.approved, bookings.approved + bookings.rejectedByMaster);
  const noShow = percent(bookings.missed, bookings.completed + bookings.missed);

  return (
    <>
      <Section title={t('admin.stats.users')}>
        <Tiles
          items={[
            [t('admin.stats.total'), users.total],
            [t('admin.stats.new'), users.newInPeriod],
            [t('admin.stats.masters'), users.masters],
            [t('admin.stats.dau'), users.activeDay],
            [t('admin.stats.wau'), users.activeWeek],
            [t('admin.stats.mau'), users.activeMonth],
          ]}
        />
      </Section>

      <Section title={t('admin.stats.bookings')}>
        <Tiles
          items={[
            [t('admin.stats.created'), bookings.created],
            [t('admin.stats.approved'), bookings.approved],
            [t('admin.stats.completed'), bookings.completed],
            [t('admin.stats.canceled'), bookings.canceled],
            [t('admin.stats.missed'), bookings.missed],
            [t('admin.stats.autoRejected'), bookings.autoRejected],
          ]}
        />
        <List>
          <Row label={t('admin.stats.approvalRate')} value={approval === null ? '—' : `${approval}%`} />
          <Row label={t('admin.stats.noShowRate')} value={noShow === null ? '—' : `${noShow}%`} />
          <Row
            label={t('admin.stats.medianResponse')}
            value={bookings.medianResponseMinutes === null ? '—' : formatMinutes(bookings.medianResponseMinutes)}
            last
          />
        </List>
        <DailyBars daily={stats.dailyBookings} />
      </Section>

      <Section title={t('admin.stats.topCategories')}>
        {stats.topCategories.length === 0 ? (
          <NoData />
        ) : (
          <List>
            {stats.topCategories.map((c, i) => (
              <Row key={c.id} label={tr(c.name)} value={c.bookings} last={i === stats.topCategories.length - 1} />
            ))}
          </List>
        )}
      </Section>

      <Section title={t('admin.stats.topMasters')}>
        {stats.topMasters.length === 0 ? (
          <NoData />
        ) : (
          <List>
            {stats.topMasters.map((m, i) => (
              <Row
                key={m.id}
                label={m.name ?? `#${m.id}`}
                last={i === stats.topMasters.length - 1}
                value={
                  <View style={styles.masterValue}>
                    {m.rating > 0 && (
                      <>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.rowValue}>{m.rating.toFixed(1)}</Text>
                      </>
                    )}
                    <Text style={styles.rowMuted}>{t('admin.stats.done', { count: m.completed })}</Text>
                  </View>
                }
              />
            ))}
          </List>
        )}
      </Section>

      <Section title={t('admin.stats.moderation')}>
        <Tiles
          items={[
            [t('admin.stats.openReports'), moderation.openReports],
            [t('admin.stats.pendingRequests'), moderation.pendingCatalogRequests],
            [t('admin.stats.bans'), moderation.bansInPeriod],
          ]}
        />
      </Section>
    </>
  );
}

/** Bookings created per day; tap a bar to read its value. */
function DailyBars({ daily }: { daily: AdminStatsResponse['dailyBookings'] }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map(d => d.count));
  const shown = selected !== null ? daily[selected] : undefined;
  return (
    <View style={styles.chart}>
      <View style={styles.chartHeader}>
        <Text style={styles.rowMuted}>{t('admin.stats.perDay')}</Text>
        <Text style={styles.rowValue}>
          {shown ? t('admin.stats.dayCount', { date: utcDay(shown.date), count: shown.count }) : ''}
        </Text>
      </View>
      <View style={styles.bars}>
        {daily.map((d, i) => {
          const height: `${number}%` | number = d.count === 0 ? 2 : `${Math.max(4, (d.count / max) * 100)}%`;
          return (
            <Pressable
              key={d.date}
              onPress={() => setSelected(selected === i ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={t('admin.stats.dayBookings', { date: utcDay(d.date), count: d.count })}
              style={styles.barSlot}
            >
              <View style={[styles.bar, { height }, selected !== null && selected !== i && styles.barDim]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function auditSummary(e: AuditLogEntryResponse): string {
  const d = e.details ?? {};
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');
  const label = i18n.t(`admin.audit.${e.action}`);
  const base = e.targetType === 'USER' ? `${label} #${e.targetId}` : label;
  switch (e.action) {
    case 'USER_BANNED':
      return str('reason') ? `${base} • ${str('reason')}` : base;
    case 'CATALOG_REQUEST_APPROVED':
      return str('requestedName') && str('requestedName') !== str('finalName')
        ? `${base} • ${str('requestedName')} → ${str('finalName')}`
        : `${base} • ${str('finalName')}`;
    case 'CATALOG_REQUEST_REJECTED':
      return `${base} • ${str('requestedName')}`;
    default:
      return base;
  }
}

function AuditLog({ entries, loading }: { entries?: AuditLogEntryResponse[]; loading: boolean }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <Section title={t('admin.stats.audit')}>
      {loading ? (
        <LoadingState />
      ) : !entries?.length ? (
        <NoData />
      ) : (
        <List>
          {entries.map((e, i) => (
            <View key={e.id} style={[styles.auditRow, i < entries.length - 1 && styles.divider]}>
              <Text style={styles.rowLabel}>{auditSummary(e)}</Text>
              <Text style={styles.rowMuted}>
                {e.actorName ?? `#${e.actorId}`} • {dateTime(e.createdAt)}
              </Text>
            </View>
          ))}
        </List>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

function Tiles({ items }: { items: [string, number][] }) {
  const styles = useStyles();
  return (
    <View style={styles.tiles}>
      {items.map(([label, value]) => (
        <View key={label} style={styles.tile}>
          <Text style={styles.tileValue}>{value.toLocaleString()}</Text>
          <Text style={styles.tileLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function List({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.list}>{children}</View>;
}

function Row({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Text style={[styles.rowLabel, styles.flex]} numberOfLines={1}>
        {label}
      </Text>
      {typeof value === 'object' ? value : <Text style={styles.rowValue}>{value}</Text>}
    </View>
  );
}

function NoData() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.list, styles.noData]}>
      <BarChart3 size={18} color={colors.textSecondary} strokeWidth={1.5} />
      <Text style={styles.rowMuted}>{t('admin.stats.noData')}</Text>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  section: { gap: t.spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 10,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  tileValue: {
    fontFamily: t.fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  tileLabel: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  list: {
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
    overflow: 'hidden',
  },
  row: {
    minHeight: 48,
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
  rowLabel: { ...t.typography.bodyMedium, color: t.colors.text },
  rowValue: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  rowMuted: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  masterValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  auditRow: { paddingHorizontal: t.spacing.lg, paddingVertical: 10, gap: 2 },
  noData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.lg,
  },
  chart: {
    padding: t.spacing.lg,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
    gap: t.spacing.md,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  bars: { height: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: t.colors.primary,
  },
  barDim: { opacity: 0.35 },
}));
