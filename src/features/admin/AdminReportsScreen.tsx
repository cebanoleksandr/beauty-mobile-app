/**
 * Admin → Reports: open complaints filed with a review (`reportMessage`).
 * Resolve marks one as handled. Web counterpart: admin/reports.
 */
import { Check, Flag } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useAdminReports, useResolveReport } from '../../query';
import { Button, Card, EmptyState, ErrorState, LoadingState, PageTitle } from '../../shared/ui';
import { makeStyles, useTheme } from '../../theme';
import { TabScreen } from '../common/TabScreen';
import { relativeTime } from './adminFormat';

export function AdminReportsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const reports = useAdminReports('OPEN');
  const resolve = useResolveReport();

  return (
    <TabScreen
      refreshing={reports.isRefetching}
      onRefresh={() => {
        reports.refetch();
      }}
    >
      <PageTitle title="Reports" subtitle="Complaints left together with reviews" />
      {reports.isPending ? (
        <LoadingState />
      ) : reports.isError ? (
        <ErrorState onRetry={() => reports.refetch()} />
      ) : reports.data.length === 0 ? (
        <EmptyState Icon={Flag} title="No open reports" text="Complaints from clients and masters show up here." />
      ) : (
        <View style={styles.list}>
          {reports.data.map(r => (
            <Card key={r.id} style={styles.card}>
              <View style={styles.header}>
                <Flag size={14} color="#FB7185" />
                <Text style={styles.who} numberOfLines={2}>
                  <Text style={styles.strong}>{r.reporterName}</Text> reported{' '}
                  <Text style={styles.strong}>{r.reportedUserName}</Text>
                </Text>
                <Text style={styles.time}>{relativeTime(r.createdAt)}</Text>
              </View>
              <Text style={styles.message}>{r.message}</Text>
              <Button
                label="Mark as resolved"
                compact
                icon={<Check size={15} color={colors.background} />}
                onPress={() =>
                  resolve.mutate(r.id, {
                    onError: () => Alert.alert('Could not resolve', 'Please try again.'),
                  })
                }
                loading={resolve.isPending && resolve.variables === r.id}
                disabled={resolve.isPending}
              />
            </Card>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

const useStyles = makeStyles(t => ({
  list: { gap: t.spacing.md },
  card: { gap: t.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  who: { ...t.typography.bodySmall, flex: 1, color: t.colors.textSecondary },
  strong: { fontFamily: t.fontFamily.semibold, color: t.colors.text },
  time: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  message: {
    ...t.typography.bodyMedium,
    padding: t.spacing.md,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.cardInner,
    color: t.colors.text,
  },
}));
