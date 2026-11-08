/**
 * Map search ("Discover"). Figma: Masters → node 7:323, with product changes:
 * no quick-filter chips under the input (they live behind the filter button),
 * and cards follow the product screenshot (vertical cards).
 */
import {
  Camera,
  Map,
  Marker,
  UserLocation,
  type CameraRef,
  type LngLat,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MasterCardDto } from '../../api';
import { useMasterSearch } from '../../query';
import { useDebouncedValue } from '../../shared/useDebouncedValue';
import { useTranslation } from '../../i18n';
import { makeStyles } from '../../theme';
import { favoritesStore, useFavoriteIds } from '../favorites/favoritesStore';
import { DiscoverHeader, HEADER_HEIGHT } from './components/DiscoverHeader';
import { FiltersSheet } from './components/FiltersSheet';
import { MapControls } from './components/MapControls';
import { MapPin } from './components/MapPin';
import { MastersSheet, type MastersSheetRef } from './components/MastersSheet';
import { SearchAreaButton } from './components/SearchAreaButton';
import { SearchBar } from './components/SearchBar';
import { distanceMeters } from './geo';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLES, MAX_ZOOM, MIN_ZOOM, type MapStyleName } from './mapConfig';
import {
  DEFAULT_FILTERS,
  applyClientFilters,
  buildSearchRequest,
  countActiveFilters,
  type SearchFilters,
} from './searchFilters';
import { useUserLocation } from './useUserLocation';

/** Height of the collapsed results sheet — map ornaments sit above it. */
const SHEET_OVERLAP = 330;

interface MapSearchScreenProps {
  /** Opens a master's profile (wired to navigation by the tab route). */
  onOpenMaster?: (master: MasterCardDto) => void;
}

export function MapSearchScreen({ onOpenMaster }: MapSearchScreenProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const sheetRef = useRef<MastersSheetRef>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const mapCenterRef = useRef<LngLat>(DEFAULT_CENTER);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchCenter, setSearchCenter] = useState<LngLat>(DEFAULT_CENTER);
  const [areaDirty, setAreaDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleName>('dark');
  const [listMode, setListMode] = useState(false);

  const favoriteIds = useFavoriteIds();
  const { granted: locationGranted, locate } = useUserLocation();

  const request = useMemo(
    () => buildSearchRequest(filters, debouncedQuery, searchCenter),
    [debouncedQuery, filters, searchCenter],
  );
  const search = useMasterSearch(request);

  // Favorites, price range and price sorting aren't applied by the backend.
  const masters = useMemo(
    () => applyClientFilters(search.data ?? [], filters, favoriteIds),
    [search.data, filters, favoriteIds],
  );

  const flyTo = useCallback((center: LngLat, zoom?: number) => {
    cameraRef.current?.easeTo({ center, zoom: zoom ?? zoomRef.current, duration: 500 });
  }, []);

  const goToUser = useCallback(async () => {
    const position = await locate();
    if (!position) return false;
    setSearchCenter(position);
    setAreaDirty(false);
    flyTo(position, Math.max(zoomRef.current, DEFAULT_ZOOM));
    return true;
  }, [locate, flyTo]);

  // Center on the user once on open (falls back to Kyiv if denied).
  useEffect(() => {
    goToUser();
  }, [goToUser]);

  const onRegionDidChange = useCallback(
    (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { center, zoom, userInteraction } = e.nativeEvent;
      zoomRef.current = zoom;
      mapCenterRef.current = center;
      // Offer "Search this area" once the user pans noticeably away.
      if (userInteraction && distanceMeters(center, searchCenter) > filters.radiusMeters * 0.25) {
        setAreaDirty(true);
      }
    },
    [searchCenter, filters.radiusMeters],
  );

  const searchThisArea = () => {
    setSearchCenter(mapCenterRef.current);
    setAreaDirty(false);
    setSelectedId(null);
  };

  const onLocatePress = async () => {
    const ok = await goToUser();
    if (!ok) {
      Alert.alert(t('discover.locationTitle'), t('discover.locationText'));
    }
  };

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta));
    zoomRef.current = next;
    cameraRef.current?.zoomTo(next, { duration: 250 });
  };

  const selectFromMap = useCallback((master: MasterCardDto) => {
    setSelectedId(master.id);
    sheetRef.current?.scrollToMaster(master.id);
  }, []);

  const toggleFavorite = useCallback((master: MasterCardDto) => favoritesStore.toggle(master.id), []);

  // Card tap and "Book" both open the profile (services are picked there).
  const openMaster = useCallback(
    (master: MasterCardDto) => {
      setSelectedId(master.id);
      onOpenMaster?.(master);
    },
    [onOpenMaster],
  );

  const controlsTop = insets.top + HEADER_HEIGHT + 12 + 50 + 16;

  return (
    <View style={styles.screen}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLES[mapStyle]}
        logo={false}
        compass={false}
        attribution
        attributionPosition={{ bottom: SHEET_OVERLAP + 8, left: 8 }}
        onRegionDidChange={onRegionDidChange}
        onPress={() => {
          Keyboard.dismiss();
          setSelectedId(null);
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />
        {locationGranted && <UserLocation />}
        {masters.map(master => (
          <Marker
            key={master.pinId}
            id={master.pinId}
            lngLat={[master.lng, master.lat]}
            anchor="bottom"
            onPress={() => selectFromMap(master)}
          >
            <MapPin master={master} selected={master.id === selectedId} />
          </Marker>
        ))}
      </Map>

      <View style={styles.top} pointerEvents="box-none">
        <DiscoverHeader />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilters={countActiveFilters(filters)}
          style={styles.searchBar}
        />
        {areaDirty && !listMode && (
          <View style={styles.searchArea} pointerEvents="box-none">
            <SearchAreaButton onPress={searchThisArea} loading={search.isFetching} />
          </View>
        )}
      </View>

      {!listMode && (
        <MapControls
          style={[styles.controls, { top: controlsTop }]}
          onLocate={onLocatePress}
          onZoomIn={() => zoomBy(1)}
          onZoomOut={() => zoomBy(-1)}
          onToggleLayers={() => setMapStyle(s => (s === 'dark' ? 'light' : 'dark'))}
        />
      )}

      <View
        style={[styles.sheetWrap, listMode && { top: insets.top + HEADER_HEIGHT + 12 + 50 + 12 }]}
        pointerEvents="box-none"
      >
        <MastersSheet
          ref={sheetRef}
          masters={masters}
          loading={search.isPending || (search.isFetching && !search.data)}
          error={search.isError}
          selectedId={selectedId}
          favoriteIds={favoriteIds}
          listMode={listMode}
          onToggleListMode={() => setListMode(m => !m)}
          onSelect={openMaster}
          onToggleFavorite={toggleFavorite}
          onBook={openMaster}
          onRetry={() => search.refetch()}
        />
      </View>

      <FiltersSheet
        visible={filtersOpen}
        value={filters}
        query={debouncedQuery}
        center={searchCenter}
        onClose={() => setFiltersOpen(false)}
        onApply={next => {
          setFilters(next);
          setFiltersOpen(false);
          setSelectedId(null);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: '#0C0D10',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  searchBar: {
    paddingTop: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
  },
  searchArea: {
    marginTop: t.spacing.md,
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    right: t.spacing.lg,
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
