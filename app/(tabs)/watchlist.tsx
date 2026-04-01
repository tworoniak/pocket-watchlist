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

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  getLibrary,
  removeFromWatchlist,
  type MovieItem,
} from '@/src/storage/library';

export default function WatchlistScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  const [watchlist, setWatchlist] = useState<MovieItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const lib = await getLibrary();
        setWatchlist(lib.watchlist);
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

      {watchlist.length === 0 ? (
        <Text style={[styles.empty, { color: c.subtext }]}>
          No movies saved yet. Add some from Search.
        </Text>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.imdbID}
          renderItem={({ item }) => (
            <View style={[styles.movieRow, { borderBottomColor: c.border }]}>
              <Pressable
                style={styles.rowLeft}
                onPress={() => router.push(`/movie/${item.imdbID}`)}
                accessibilityRole="button"
                accessibilityLabel={`${item.Title}, ${item.Year}. View details.`}
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
                  <Text
                    style={[styles.movieTitle, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {item.Title}
                  </Text>
                  <Text style={[styles.movieYear, { color: c.subtext }]}>
                    {item.Year}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: c.buttonBg }]}
                onPress={() => handleRemove(item)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.Title} from watchlist`}
              >
                <Text style={[styles.actionText, { color: c.buttonText }]}>
                  Remove
                </Text>
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
  empty: { marginTop: 20, fontSize: 16 },

  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  poster: { width: 60, height: 90, borderRadius: 8 },
  movieInfo: { justifyContent: 'center', flex: 1 },
  movieTitle: { fontSize: 16, fontWeight: '600' },
  movieYear: { fontSize: 14, marginTop: 4 },

  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: { fontWeight: '700' },
});
