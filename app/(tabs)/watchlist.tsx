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
  getWatchlist,
  removeMovieFromWatchlist,
  type WatchlistMovie,
} from '@/src/storage/watchlist';

export default function WatchlistScreen() {
  const router = useRouter();

  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);

  async function load() {
    const data = await getWatchlist();
    setWatchlist(data);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function handleRemove(imdbID: string) {
    const updated = await removeMovieFromWatchlist(imdbID);
    setWatchlist(updated);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Watchlist</Text>

      {watchlist.length === 0 ? (
        <Text style={styles.empty}>
          No movies saved yet. Add some from Search.
        </Text>
      ) : (
        <FlatList
          data={watchlist}
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
                  <Text style={styles.movieTitle}>{item.Title}</Text>
                  <Text style={styles.movieYear}>{item.Year}</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.removeBtn}
                onPress={() => handleRemove(item.imdbID)}
              >
                <Text style={styles.removeText}>Remove</Text>
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
  removeBtn: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeText: { color: 'white', fontWeight: '600' },
});
