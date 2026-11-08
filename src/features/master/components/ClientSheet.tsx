/**
 * A client's basic identity (`GET /api/clients/{id}`) opened from a booking
 * or the clients list: avatar, name and a Telegram link — clients have no
 * public profile. Web counterpart: master/bookings/ClientDetailSheet.
 */
import { Send } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { resolveApiUrl } from '../../../api';
import { useClientProfile } from '../../../query';
import { openTelegramProfile } from '../../../shared/openTelegram';
import { Avatar, BottomSheet, Button, LoadingState } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';

export function ClientSheet({ clientId, onClose }: { clientId: number | null; onClose: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const profile = useClientProfile(clientId ?? undefined);
  const data = profile.data;

  return (
    <BottomSheet visible={clientId !== null} onClose={onClose}>
      {!data ? (
        <LoadingState />
      ) : (
        <View style={styles.body}>
          <Avatar uri={resolveApiUrl(data.avatarUrl)} name={data.displayName} size={80} />
          <Text style={styles.name}>{data.displayName}</Text>
          {data.username ? (
            <>
              <Text style={styles.username}>@{data.username}</Text>
              <Button
                label={t('master.client.message')}
                variant="secondary"
                icon={<Send size={16} color={colors.text} />}
                onPress={() => openTelegramProfile(data.username)}
                style={styles.button}
              />
            </>
          ) : (
            <Text style={styles.username}>{t('master.client.noUsername')}</Text>
          )}
        </View>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  body: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.md,
  },
  name: {
    marginTop: t.spacing.sm,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  username: { ...t.typography.bodyMedium, color: t.colors.textSecondary },
  button: { alignSelf: 'stretch', marginTop: t.spacing.md },
}));
