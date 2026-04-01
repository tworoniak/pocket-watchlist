import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { POSTER_FALLBACK_URI } from '@/src/constants';
import type { MovieItem } from '@/src/storage/library';

type Props = {
  items: MovieItem[];
  onAction: (item: MovieItem) => void;
  actionLabel: string;
  emptyMessage: string;
  getSubtitle?: (item: MovieItem) => string | null;
};

export function MovieList({ items, onAction, actionLabel, emptyMessage, getSubtitle }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  if (items.length === 0) {
    return (
      <Text style={[styles.empty, { color: c.subtext }]}>{emptyMessage}</Text>
    );
  }

  return (
    <FlatList
      data={items}
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
              source={{ uri: item.Poster !== 'N/A' ? item.Poster : POSTER_FALLBACK_URI }}
              style={styles.poster}
              alt={`${item.Title} poster`}
              transition={200}
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
              {getSubtitle && (
                <Text style={[styles.movieSubtitle, { color: c.subtext }]}>
                  {getSubtitle(item)}
                </Text>
              )}
            </View>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.buttonBg }]}
            onPress={() => onAction(item)}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} ${item.Title}`}
          >
            <Text style={[styles.actionText, { color: c.buttonText }]}>
              {actionLabel}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  movieSubtitle: { fontSize: 12, marginTop: 2 },

  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  actionText: { fontWeight: '700' },
});
