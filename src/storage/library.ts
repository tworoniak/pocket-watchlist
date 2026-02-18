import AsyncStorage from '@react-native-async-storage/async-storage';

export type MovieItem = {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
};

export type WatchedItem = MovieItem & {
  watchedAt: number;
  userRating?: number; // optional (1-10 later)
};

export type LibraryState = {
  watchlist: MovieItem[];
  watched: WatchedItem[];
};

const LIB_KEY = 'movie-library:v1';

// Old key from your first implementation (keep for migration)
const OLD_WATCHLIST_KEY = 'watchlist:v1';

async function read(): Promise<LibraryState> {
  const raw = await AsyncStorage.getItem(LIB_KEY);
  return raw
    ? (JSON.parse(raw) as LibraryState)
    : { watchlist: [], watched: [] };
}

async function write(state: LibraryState) {
  await AsyncStorage.setItem(LIB_KEY, JSON.stringify(state));
}

/**
 * One-time migration:
 * - If new library is empty AND old watchlist exists, copy old watchlist into new watchlist.
 */
export async function migrateIfNeeded() {
  const current = await read();
  if (current.watchlist.length > 0 || current.watched.length > 0)
    return current;

  const oldRaw = await AsyncStorage.getItem(OLD_WATCHLIST_KEY);
  if (!oldRaw) return current;

  try {
    const oldList = JSON.parse(oldRaw) as Array<
      MovieItem & { addedAt?: number }
    >;

    const migrated: LibraryState = {
      watchlist: oldList.map(({ imdbID, Title, Year, Poster }) => ({
        imdbID,
        Title,
        Year,
        Poster,
      })),
      watched: [],
    };

    await write(migrated);
    return migrated;
  } catch {
    return current;
  }
}

export async function getLibrary() {
  return read();
}

export async function addToWatchlist(movie: MovieItem) {
  const state = await read();

  // If it’s already watched, remove from watched
  state.watched = state.watched.filter((m) => m.imdbID !== movie.imdbID);

  if (!state.watchlist.some((m) => m.imdbID === movie.imdbID)) {
    state.watchlist = [movie, ...state.watchlist];
    await write(state);
  }

  return state;
}

export async function removeFromWatchlist(imdbID: string) {
  const state = await read();
  state.watchlist = state.watchlist.filter((m) => m.imdbID !== imdbID);
  await write(state);
  return state;
}

export async function markWatched(movie: MovieItem, userRating?: number) {
  const state = await read();

  // remove from watchlist
  state.watchlist = state.watchlist.filter((m) => m.imdbID !== movie.imdbID);

  // add to watched if not already
  if (!state.watched.some((m) => m.imdbID === movie.imdbID)) {
    state.watched = [
      { ...movie, watchedAt: Date.now(), userRating },
      ...state.watched,
    ];
    await write(state);
  }

  return state;
}

export async function unwatch(imdbID: string) {
  const state = await read();
  const found = state.watched.find((m) => m.imdbID === imdbID);
  state.watched = state.watched.filter((m) => m.imdbID !== imdbID);

  // move back to watchlist
  if (found && !state.watchlist.some((m) => m.imdbID === imdbID)) {
    const { Title, Year, Poster } = found;
    state.watchlist = [{ imdbID, Title, Year, Poster }, ...state.watchlist];
  }

  await write(state);
  return state;
}
