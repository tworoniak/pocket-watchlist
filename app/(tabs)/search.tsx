import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { searchMovies, type OmdbSearchMovie } from '@/src/api/omdb';
import { useDebounce } from '@/src/hooks/useDebounce';
import { getLibrary } from '@/src/storage/library';

const MIN_CHARS = 3;

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 450);

  const [movies, setMovies] = useState<OmdbSearchMovie[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const lib = await getLibrary();
        setWatchlistIds(new Set(lib.watchlist.map((m) => m.imdbID)));
        setWatchedIds(new Set(lib.watched.map((m) => m.imdbID)));
      })();
    }, []),
  );

  const canSearch = debouncedQuery.length >= MIN_CHARS;

  // Reset and search when query changes
  useEffect(() => {
    setMovies([]);
    setTotalResults(0);
    setPage(1);
    setError(null);

    if (!canSearch) return;

    const controller = new AbortController();

    (async () => {
      try {
        setIsLoading(true);
        const data = await searchMovies(debouncedQuery, 1, controller.signal);
        setMovies(data.results);
        setTotalResults(data.totalResults);
        setError(data.error ?? null);
      } catch (err: any) {
        if (err?.name !== 'AbortError')
          setError(err?.message ?? 'Something went wrong.');
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  const totalPages = useMemo(() => Math.ceil(totalResults / 10), [totalResults]);
  const hasMore = page < totalPages;

  async function loadMore() {
    if (!canSearch || !hasMore || isLoading || isLoadingMore || error) return;

    const nextPage = page + 1;
    try {
      setIsLoadingMore(true);
      const data = await searchMovies(debouncedQuery, nextPage);
      setMovies((prev) => {
        const existing = new Set(prev.map((m) => m.imdbID));
        return [...prev, ...data.results.filter((m) => !existing.has(m.imdbID))];
      });
      setPage(nextPage);
      if (data.error) setError(data.error);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong while loading more.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: OmdbSearchMovie }) => {
      const inWatchlist = watchlistIds.has(item.imdbID);
      const inWatched = watchedIds.has(item.imdbID);
      const statusLabel = inWatched ? ', watched' : inWatchlist ? ', saved' : '';

      return (
        <Pressable
          style={[styles.movieRow, { borderBottomColor: c.border }]}
          onPress={() => router.push(`/movie/${item.imdbID}`)}
          accessibilityRole="button"
          accessibilityLabel={`${item.Title}, ${item.Year}${statusLabel}. View details.`}
        >
          <Image
            source={{
              uri:
                item.Poster !== 'N/A'
                  ? item.Poster
                  : 'https://via.placeholder.com/80x120.png?text=No+Poster',
            }}
            style={styles.poster}
            accessibilityLabel={`${item.Title} poster`}
            accessibilityIgnoresInvertColors
          />

          <View style={styles.movieInfo}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.movieTitle, { color: c.text }]}
                numberOfLines={1}
              >
                {item.Title}
              </Text>

              {inWatched ? (
                <View style={[styles.badge, { backgroundColor: c.buttonBg }]}>
                  <Text style={[styles.badgeText, { color: c.buttonText }]}>
                    Watched
                  </Text>
                </View>
              ) : inWatchlist ? (
                <View style={[styles.badge, { backgroundColor: c.buttonBg }]}>
                  <Text style={[styles.badgeText, { color: c.buttonText }]}>
                    Saved
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.movieYear, { color: c.subtext }]}>
              {item.Year}
            </Text>
          </View>
        </Pressable>
      );
    },
    [watchlistIds, watchedIds, c, router],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Movie Search</Text>

      <TextInput
        placeholder="Search movies (min 3 chars)..."
        placeholderTextColor={c.subtext}
        value={query}
        onChangeText={setQuery}
        style={[styles.input, { borderColor: c.input, color: c.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search movies"
      />

      {!canSearch && query.trim().length > 0 && (
        <Text style={[styles.hint, { color: c.subtext }]}>
          Type at least {MIN_CHARS} characters…
        </Text>
      )}

      {isLoading && (
        <Text style={[styles.info, { color: c.text }]}>Loading...</Text>
      )}
      {error && (
        <Text
          style={[styles.error, { color: c.error }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      <FlatList
        data={movies}
        keyExtractor={(item) => item.imdbID}
        renderItem={renderItem}
        onEndReachedThreshold={0.6}
        onEndReached={loadMore}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator />
              <Text style={[styles.footerText, { color: c.subtext }]}>
                Loading more…
              </Text>
            </View>
          ) : movies.length > 0 ? (
            <Text style={[styles.footerText, { color: c.subtext }]}>
              {movies.length} of {totalResults.toLocaleString()}
              {hasMore ? ' • Scroll for more' : ' • End'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  hint: { marginBottom: 8 },
  info: { marginTop: 10 },
  error: { marginTop: 10 },

  movieRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  poster: { width: 60, height: 90, borderRadius: 8 },
  movieInfo: { justifyContent: 'center', flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  movieTitle: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  movieYear: { fontSize: 14, marginTop: 4 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  footer: { paddingVertical: 14, alignItems: 'center', gap: 8 },
  footerText: { paddingVertical: 14, textAlign: 'center' },
});
