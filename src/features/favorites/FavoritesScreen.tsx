import { Bookmark } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from '../../i18n';
import { EmptyState, PageTitle } from '../../shared/ui';
import { TabScreen } from '../common/TabScreen';
import { useFavoriteIds } from './favoritesStore';

export function FavoritesScreen() {
  const ids = useFavoriteIds();
  const { t } = useTranslation();
  return (
    <TabScreen>
      <PageTitle title={t('favorites.title')} />
      <EmptyState
        Icon={Bookmark}
        title={t('favorites.title')}
        text={ids.size ? t('favorites.count', { count: ids.size }) : t('favorites.empty')}
      />
    </TabScreen>
  );
}
