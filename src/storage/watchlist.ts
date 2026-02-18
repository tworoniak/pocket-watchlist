import AsyncStorage from '@react-native-async-storage/async-storage';

export type WatchlistMovie = {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  addedAt: number;
};

const STORAGE_KEY = 'movie-watchlist:v1';

export async function getWatchlist(): Promise<WatchlistMovie[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as WatchlistMovie[]) : [];
}

export async function saveWatchlist(list: WatchlistMovie[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function addMovieToWatchlist(
  movie: Omit<WatchlistMovie, 'addedAt'>,
) {
  const current = await getWatchlist();

  if (current.some((m) => m.imdbID === movie.imdbID)) return current;

  const updated: WatchlistMovie[] = [
    { ...movie, addedAt: Date.now() },
    ...current,
  ];
  await saveWatchlist(updated);

  return updated;
}

export async function removeMovieFromWatchlist(imdbID: string) {
  const current = await getWatchlist();
  const updated = current.filter((m) => m.imdbID !== imdbID);

  await saveWatchlist(updated);
  return updated;
}
