import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getMovieDetails, type OmdbMovieDetail } from '@/src/api/omdb';
import { POSTER_FALLBACK_URI } from '@/src/constants';
import {
  addToWatchlist,
  getLibrary,
  markWatched,
  removeFromWatchlist,
  unwatch,
  type MovieItem,
} from '@/src/storage/library';

export default function MovieDetailsScreen() {
  const router = useRouter();
  const { imdbID } = useLocalSearchParams<{ imdbID: string }>();
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'light'];

  const [movie, setMovie] = useState<OmdbMovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inWatched, setInWatched] = useState(false);

  useEffect(() => {
    if (!imdbID) return;

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getMovieDetails(imdbID, controller.signal);
        setMovie(data);

        const lib = await getLibrary();
        setInWatchlist(lib.watchlist.some((m) => m.imdbID === imdbID));
        setInWatched(lib.watched.some((m) => m.imdbID === imdbID));
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message ?? 'Failed to load movie details.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [imdbID]);

  async function handleToggleWatchlist() {
    if (!movie) return;

    const item: MovieItem = {
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
    };

    if (inWatchlist) {
      const lib = await removeFromWatchlist(item.imdbID);
      setInWatchlist(false);
      setInWatched(lib.watched.some((m) => m.imdbID === item.imdbID));
    } else {
      const lib = await addToWatchlist(item);
      setInWatchlist(true);
      setInWatched(lib.watched.some((m) => m.imdbID === item.imdbID));
    }
  }

  async function handleToggleWatched() {
    if (!movie) return;

    const item: MovieItem = {
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
    };

    if (inWatched) {
      const lib = await unwatch(item.imdbID);
      setInWatched(false);
      setInWatchlist(lib.watchlist.some((m) => m.imdbID === item.imdbID));
    } else {
      await markWatched(item);
      setInWatched(true);
      setInWatchlist(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text
          style={[styles.errorText, { color: c.error }]}
          accessibilityRole="alert"
        >
          {error ?? 'Movie not found.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backLink, { color: c.tint }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: c.text }]}>{movie.Title}</Text>

      <Image
        source={{ uri: movie.Poster !== 'N/A' ? movie.Poster : POSTER_FALLBACK_URI }}
        style={styles.poster}
        alt={`${movie.Title} poster`}
        transition={200}
      />

      <Text style={[styles.meta, { color: c.subtext }]}>
        {movie.Year} • {movie.Runtime} • {movie.Rated}
      </Text>

      {/* Outline button — lightweight "save for later" action */}
      <Pressable
        style={[styles.buttonOutline, { borderColor: c.buttonBg }]}
        onPress={handleToggleWatchlist}
        accessibilityRole="button"
        accessibilityLabel={
          inWatchlist
            ? `Remove ${movie.Title} from watchlist`
            : `Add ${movie.Title} to watchlist`
        }
      >
        <Text style={[styles.buttonOutlineText, { color: c.buttonBg }]}>
          {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Text>
      </Pressable>

      {/* Filled button — primary "mark done" action */}
      <Pressable
        style={[styles.buttonFilled, { backgroundColor: c.buttonBg }]}
        onPress={handleToggleWatched}
        accessibilityRole="button"
        accessibilityLabel={
          inWatched
            ? `Mark ${movie.Title} as unwatched`
            : `Mark ${movie.Title} as watched`
        }
      >
        <Text style={[styles.buttonFilledText, { color: c.buttonText }]}>
          {inWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Plot</Text>
      <Text style={[styles.body, { color: c.text }]}>{movie.Plot}</Text>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Cast</Text>
      <Text style={[styles.body, { color: c.text }]}>{movie.Actors}</Text>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Genre</Text>
      <Text style={[styles.body, { color: c.text }]}>{movie.Genre}</Text>

      <Text style={[styles.sectionTitle, { color: c.text }]}>IMDb Rating</Text>
      <Text style={[styles.body, { color: c.text }]}>{movie.imdbRating}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 12 },
  backLink: { fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 12 },
  poster: {
    width: 220,
    height: 330,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 14,
  },
  meta: { textAlign: 'center', marginBottom: 16 },
  buttonOutline: {
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonOutlineText: { fontWeight: '700' },
  buttonFilled: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonFilledText: { fontWeight: '700' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  body: { fontSize: 15, lineHeight: 22 },
});
