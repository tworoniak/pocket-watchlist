import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MovieList } from '@/components/MovieList';
import {
  getLibrary,
  removeFromWatchlist,
  type MovieItem,
} from '@/src/storage/library';

export default function WatchlistScreen() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  const [watchlist, setWatchlist] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setIsLoading(true);
          setError(null);
          const lib = await getLibrary();
          setWatchlist(lib.watchlist);
        } catch {
          setError('Failed to load your watchlist.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, []),
  );

  async function handleRemove(item: MovieItem) {
    const lib = await removeFromWatchlist(item.imdbID);
    setWatchlist(lib.watchlist);
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Watchlist</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : error ? (
        <Text
          style={[styles.error, { color: c.error }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : (
        <MovieList
          items={watchlist}
          onAction={handleRemove}
          actionLabel="Remove"
          emptyMessage="No movies saved yet. Add some from Search."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12 },
  loader: { marginTop: 40 },
  error: { marginTop: 20, fontSize: 16 },
});
