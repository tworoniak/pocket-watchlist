import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMovieDetails } from '@/src/api/omdb';
import {
  addMovieToWatchlist,
  getWatchlist,
  removeMovieFromWatchlist,
} from '@/src/storage/watchlist';

export default function MovieDetailsScreen() {
  const router = useRouter();
  const { imdbID } = useLocalSearchParams<{ imdbID: string }>();

  const [movie, setMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!imdbID) return;

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);

        const data = await getMovieDetails(imdbID, controller.signal);
        setMovie(data);

        const watchlist = await getWatchlist();
        setIsSaved(watchlist.some((m) => m.imdbID === imdbID));
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [imdbID]);

  async function handleToggleWatchlist() {
    if (!movie) return;

    if (isSaved) {
      await removeMovieFromWatchlist(movie.imdbID);
      setIsSaved(false);
    } else {
      await addMovieToWatchlist({
        imdbID: movie.imdbID,
        Title: movie.Title,
        Year: movie.Year,
        Poster: movie.Poster,
      });
      setIsSaved(true);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.center}>
        <Text>Movie not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ marginTop: 10, color: 'blue' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{movie.Title}</Text>

      <Image
        source={{
          uri:
            movie.Poster !== 'N/A'
              ? movie.Poster
              : 'https://via.placeholder.com/200x300.png?text=No+Poster',
        }}
        style={styles.poster}
      />

      <Text style={styles.meta}>
        {movie.Year} • {movie.Runtime} • {movie.Rated}
      </Text>

      <Pressable style={styles.button} onPress={handleToggleWatchlist}>
        <Text style={styles.buttonText}>
          {isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Plot</Text>
      <Text style={styles.body}>{movie.Plot}</Text>

      <Text style={styles.sectionTitle}>Cast</Text>
      <Text style={styles.body}>{movie.Actors}</Text>

      <Text style={styles.sectionTitle}>Genre</Text>
      <Text style={styles.body}>{movie.Genre}</Text>

      <Text style={styles.sectionTitle}>IMDb Rating</Text>
      <Text style={styles.body}>{movie.imdbRating}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  poster: {
    width: 220,
    height: 330,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 14,
  },
  meta: { textAlign: 'center', color: '#666', marginBottom: 16 },
  button: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: 'white', fontWeight: '700' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  body: { fontSize: 15, lineHeight: 22, color: '#333' },
});
