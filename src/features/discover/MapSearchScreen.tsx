/**
 * Map search ("Discover"). Figma: Masters → node 7:323, with product changes:
 * no quick-filter chips under the input (they live behind the filter button),
 * and cards follow the product screenshot (vertical cards).
 *
 * Search area works like the web app (features/discover/MasterMap): the
 * search center is the user's location, or a point tapped on the map (marked
 * with a pin); the filter radius is drawn as a circle around it (solid outline: MapLibre
 * didn't render `line-dasharray` on the Android emulator).
 * Panning / zooming only moves the camera and never refetches. A center from
 * geolocation frames the whole circle; a tapped center leaves the camera.
 */
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  UserLocation,
  type CameraRef,
  type LngLat,
  type PressEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MasterCardDto } from '../../api';
import { useMasterSearch } from '../../query';
import { useDebouncedValue } from '../../shared/useDebouncedValue';
import { useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';
import { favoritesStore, useFavoriteIds } from '../favorites/favoritesStore';
import { DiscoverHeader, HEADER_HEIGHT } from './components/DiscoverHeader';
import { FiltersSheet } from './components/FiltersSheet';
import { MapControls } from './components/MapControls';
import { MapPin } from './components/MapPin';
import { MastersSheet, type MastersSheetRef } from './components/MastersSheet';
import { SearchCenterPin } from './components/SearchCenterPin';
import { SearchBar } from './components/SearchBar';
import { circleBounds, circlePolygon } from './geo';
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

/** Where the search center came from: device location, a map tap, or the Kyiv fallback. */
type CenterSource = 'default' | 'geo' | 'manual';

interface MapSearchScreenProps {
  /** Opens a master's profile (wired to navigation by the tab route). */
  onOpenMaster?: (master: MasterCardDto) => void;
}

export function MapSearchScreen({ onOpenMaster }: MapSearchScreenProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const sheetRef = useRef<MastersSheetRef>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchCenter, setSearchCenter] = useState<LngLat>(DEFAULT_CENTER);
  const [centerSource, setCenterSource] = useState<CenterSource>('default');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleName>('dark');
  const [listMode, setListMode] = useState(false);
  // Camera moves are ignored until the native map has loaded its style.
  const [mapReady, setMapReady] = useState(false);

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

  const searchArea = useMemo(
    () => circlePolygon(searchCenter, filters.radiusMeters),
    [searchCenter, filters.radiusMeters],
  );

  const goToUser = useCallback(async () => {
    const position = await locate();
    if (!position) return false;
    setSearchCenter(position);
    setCenterSource('geo');
    return true;
  }, [locate]);

  // Center on the user once on open (falls back to Kyiv if denied).
  useEffect(() => {
    goToUser();
  }, [goToUser]);

  // A center from geolocation (first fix, the locate button) or a new radius
  // around it frames the whole search circle. A tapped center doesn't move the
  // camera — the user is already looking there.
  const headerBottom = insets.top + HEADER_HEIGHT + 12 + 50;
  useEffect(() => {
    if (!mapReady || centerSource === 'manual') return;
    cameraRef.current?.fitBounds(circleBounds(searchCenter, filters.radiusMeters), {
      padding: { top: headerBottom + 24, bottom: SHEET_OVERLAP + 24, left: 24, right: 24 },
      duration: 600,
    });
  }, [mapReady, searchCenter, centerSource, filters.radiusMeters, headerBottom]);

  const onRegionDidChange = useCallback((e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    zoomRef.current = e.nativeEvent.zoom;
  }, []);

  // Tap on empty map (marker taps don't reach here) → new search center.
  const onMapPress = useCallback((e: NativeSyntheticEvent<PressEvent>) => {
    Keyboard.dismiss();
    setSelectedId(null);
    setSearchCenter(e.nativeEvent.lngLat);
    setCenterSource('manual');
  }, []);

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

  const controlsTop = headerBottom + 16;

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
        onPress={onMapPress}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />
        <GeoJSONSource id="search-area" data={searchArea}>
          <Layer type="fill" id="search-area-fill" paint={{ 'fill-color': colors.primary, 'fill-opacity': 0.06 }} />
          <Layer
            type="line"
            id="search-area-line"
            paint={{ 'line-color': colors.primary, 'line-width': 2, 'line-opacity': 0.8 }}
          />
        </GeoJSONSource>
        {locationGranted && <UserLocation />}
        {centerSource === 'manual' && (
          <Marker id="search-center" lngLat={searchCenter} anchor="bottom">
            <SearchCenterPin />
          </Marker>
        )}
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
    backgroundColor: t.colors.background,
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
