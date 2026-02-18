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

import { searchMovies, type OmdbSearchMovie } from '@/src/api/omdb';
import { useDebounce } from '@/src/hooks/useDebounce';
import { getWatchlist } from '@/src/storage/watchlist';

const MIN_CHARS = 3;

export default function SearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 450);

  const [movies, setMovies] = useState<OmdbSearchMovie[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved badge support
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const wl = await getWatchlist();
        setSavedIds(new Set(wl.map((m) => m.imdbID)));
      })();
    }, []),
  );

  const canSearch = debouncedQuery.length >= MIN_CHARS;

  // Reset when query changes
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
  }, [debouncedQuery, canSearch]);

  const totalPages = useMemo(
    () => Math.ceil(totalResults / 10),
    [totalResults],
  ); // OMDb returns 10 per page
  const hasMore = page < totalPages;

  async function loadMore() {
    if (!canSearch) return;
    if (!hasMore) return;
    if (isLoading || isLoadingMore) return;
    if (error) return;

    const nextPage = page + 1;

    try {
      setIsLoadingMore(true);
      const data = await searchMovies(debouncedQuery, nextPage);

      // Append new results
      setMovies((prev) => {
        const existing = new Set(prev.map((m) => m.imdbID));
        const uniqueNext = data.results.filter((m) => !existing.has(m.imdbID));
        return [...prev, ...uniqueNext];
      });

      setPage(nextPage);
      if (data.error) setError(data.error);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong while loading more.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  const renderItem = ({ item }: { item: OmdbSearchMovie }) => {
    const isSaved = savedIds.has(item.imdbID);

    return (
      <Pressable
        style={styles.movieRow}
        onPress={() => router.push(`/movie/${item.imdbID}`)}
      >
        <Image
          source={{
            uri:
              item.Poster !== 'N/A'
                ? item.Poster
                : 'https://via.placeholder.com/80x120.png?text=No+Poster',
          }}
          style={styles.poster}
        />

        <View style={styles.movieInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {item.Title}
            </Text>

            {isSaved && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Saved</Text>
              </View>
            )}
          </View>

          <Text style={styles.movieYear}>{item.Year}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Movie Search</Text>

      <TextInput
        placeholder='Search movies (min 3 chars)...'
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        autoCapitalize='none'
        autoCorrect={false}
        returnKeyType='search'
      />

      {!canSearch && query.trim().length > 0 && (
        <Text style={styles.hint}>Type at least {MIN_CHARS} characters…</Text>
      )}

      {isLoading && <Text style={styles.info}>Loading...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

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
              <Text style={styles.footerText}>Loading more…</Text>
            </View>
          ) : movies.length > 0 ? (
            <Text style={styles.footerText}>
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
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  hint: { color: '#666', marginBottom: 8 },
  info: { marginTop: 10 },
  error: { marginTop: 10, color: 'crimson' },

  movieRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  poster: { width: 60, height: 90, borderRadius: 8 },
  movieInfo: { justifyContent: 'center', flex: 1 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  movieTitle: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  movieYear: { fontSize: 14, color: '#666', marginTop: 4 },

  badge: {
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },

  footer: { paddingVertical: 14, alignItems: 'center', gap: 8 },
  footerText: { paddingVertical: 14, textAlign: 'center', color: '#666' },
});
