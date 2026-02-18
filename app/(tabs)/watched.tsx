import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getLibrary,
  migrateIfNeeded,
  unwatch,
  type WatchedItem,
} from '@/src/storage/library';

export default function WatchedScreen() {
  const router = useRouter();
  const [watched, setWatched] = useState<WatchedItem[]>([]);

  async function load() {
    await migrateIfNeeded();
    const lib = await getLibrary();
    setWatched(lib.watched);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function handleMoveBack(imdbID: string) {
    const lib = await unwatch(imdbID);
    setWatched(lib.watched);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watched</Text>

      {watched.length === 0 ? (
        <Text style={styles.empty}>
          No watched movies yet. Mark one watched from Details.
        </Text>
      ) : (
        <FlatList
          data={watched}
          keyExtractor={(item) => item.imdbID}
          renderItem={({ item }) => (
            <View style={styles.movieRow}>
              <Pressable
                style={styles.rowLeft}
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
                  <Text style={styles.movieTitle} numberOfLines={1}>
                    {item.Title}
                  </Text>
                  <Text style={styles.movieYear}>{item.Year}</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={() => handleMoveBack(item.imdbID)}
              >
                <Text style={styles.actionText}>Unwatch</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 12 },
  empty: { marginTop: 20, fontSize: 16, color: '#666' },

  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  poster: { width: 60, height: 90, borderRadius: 8 },
  movieInfo: { justifyContent: 'center', flex: 1 },
  movieTitle: { fontSize: 16, fontWeight: '600' },
  movieYear: { fontSize: 14, color: '#666', marginTop: 4 },

  actionBtn: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: { color: 'white', fontWeight: '700' },
});
