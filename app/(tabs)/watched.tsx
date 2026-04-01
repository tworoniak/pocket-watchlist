import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MovieList } from '@/components/MovieList';
import {
  getLibrary,
  unwatch,
  type MovieItem,
  type WatchedItem,
} from '@/src/storage/library';

export default function WatchedScreen() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setIsLoading(true);
          setError(null);
          const lib = await getLibrary();
          setWatched(lib.watched);
        } catch {
          setError('Failed to load your watched list.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, []),
  );

  async function handleUnwatch(item: MovieItem) {
    const lib = await unwatch(item.imdbID);
    setWatched(lib.watched);
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Watched</Text>

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
          items={watched}
          onAction={handleUnwatch}
          actionLabel="Unwatch"
          emptyMessage="No watched movies yet. Mark one watched from Details."
          getSubtitle={(item) => {
            const w = item as WatchedItem;
            return `Watched ${new Date(w.watchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          }}
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
