import {
  addToWatchlist,
  getLibrary,
  markWatched,
  migrateIfNeeded,
  removeFromWatchlist,
  unwatch,
} from '../library';

// In-memory store that mirrors AsyncStorage behaviour
const store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
}));

const MOVIE = { imdbID: 'tt0816692', Title: 'Interstellar', Year: '2014', Poster: 'N/A' };
const MOVIE_2 = { imdbID: 'tt1375666', Title: 'Inception', Year: '2010', Poster: 'N/A' };

beforeEach(() => {
  // Reset the in-memory store and clear call counts between tests
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getLibrary
// ---------------------------------------------------------------------------

describe('getLibrary', () => {
  it('returns empty state when storage is empty', async () => {
    const lib = await getLibrary();
    expect(lib.watchlist).toHaveLength(0);
    expect(lib.watched).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addToWatchlist
// ---------------------------------------------------------------------------

describe('addToWatchlist', () => {
  it('adds a movie to an empty watchlist', async () => {
    const state = await addToWatchlist(MOVIE);
    expect(state.watchlist).toHaveLength(1);
    expect(state.watchlist[0].imdbID).toBe(MOVIE.imdbID);
  });

  it('prepends new movies so the latest appears first', async () => {
    await addToWatchlist(MOVIE);
    const state = await addToWatchlist(MOVIE_2);
    expect(state.watchlist[0].imdbID).toBe(MOVIE_2.imdbID);
    expect(state.watchlist[1].imdbID).toBe(MOVIE.imdbID);
  });

  it('does not add a duplicate movie', async () => {
    await addToWatchlist(MOVIE);
    const state = await addToWatchlist(MOVIE);
    expect(state.watchlist).toHaveLength(1);
  });

  it('moves a movie from watched to watchlist', async () => {
    await markWatched(MOVIE);
    const state = await addToWatchlist(MOVIE);
    expect(state.watched).toHaveLength(0);
    expect(state.watchlist).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// removeFromWatchlist
// ---------------------------------------------------------------------------

describe('removeFromWatchlist', () => {
  it('removes a movie that is in the watchlist', async () => {
    await addToWatchlist(MOVIE);
    const state = await removeFromWatchlist(MOVIE.imdbID);
    expect(state.watchlist).toHaveLength(0);
  });

  it('is a no-op for a movie not in the watchlist', async () => {
    await addToWatchlist(MOVIE);
    const state = await removeFromWatchlist(MOVIE_2.imdbID);
    expect(state.watchlist).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// markWatched
// ---------------------------------------------------------------------------

describe('markWatched', () => {
  it('adds a movie to watched with a timestamp', async () => {
    const before = Date.now();
    const state = await markWatched(MOVIE);
    expect(state.watched).toHaveLength(1);
    expect(state.watched[0].watchedAt).toBeGreaterThanOrEqual(before);
  });

  it('removes the movie from the watchlist when marked watched', async () => {
    await addToWatchlist(MOVIE);
    const state = await markWatched(MOVIE);
    expect(state.watchlist).toHaveLength(0);
    expect(state.watched).toHaveLength(1);
  });

  it('does not duplicate if already watched', async () => {
    await markWatched(MOVIE);
    const state = await markWatched(MOVIE);
    expect(state.watched).toHaveLength(1);
  });

  it('stores an optional userRating', async () => {
    const state = await markWatched(MOVIE, 8);
    expect(state.watched[0].userRating).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// unwatch
// ---------------------------------------------------------------------------

describe('unwatch', () => {
  it('moves a movie from watched back to watchlist', async () => {
    await markWatched(MOVIE);
    const state = await unwatch(MOVIE.imdbID);
    expect(state.watched).toHaveLength(0);
    expect(state.watchlist).toHaveLength(1);
    expect(state.watchlist[0].imdbID).toBe(MOVIE.imdbID);
  });

  it('does not add to watchlist if it is already there', async () => {
    await addToWatchlist(MOVIE);
    await markWatched(MOVIE); // moves it to watched (off watchlist)
    await addToWatchlist(MOVIE); // moves it back to watchlist
    // Force a state where it is in both (shouldn't normally happen, but guard test)
    store['movie-library:v1'] = JSON.stringify({
      watchlist: [MOVIE],
      watched: [{ ...MOVIE, watchedAt: 0 }],
    });
    const state = await unwatch(MOVIE.imdbID);
    expect(state.watchlist).toHaveLength(1); // no duplicate
  });

  it('is a no-op if the movie is not watched', async () => {
    await addToWatchlist(MOVIE);
    const state = await unwatch(MOVIE.imdbID);
    // Not in watched → nothing moves back
    expect(state.watchlist).toHaveLength(1); // original watchlist untouched
  });
});

// ---------------------------------------------------------------------------
// migrateIfNeeded
// ---------------------------------------------------------------------------

describe('migrateIfNeeded', () => {
  it('returns empty state if there is nothing to migrate', async () => {
    const state = await migrateIfNeeded();
    expect(state.watchlist).toHaveLength(0);
    expect(state.watched).toHaveLength(0);
  });

  it('migrates the old watchlist:v1 key into the new library', async () => {
    store['watchlist:v1'] = JSON.stringify([
      { imdbID: 'tt0816692', Title: 'Interstellar', Year: '2014', Poster: 'N/A', addedAt: 0 },
    ]);
    const state = await migrateIfNeeded();
    expect(state.watchlist).toHaveLength(1);
    expect(state.watchlist[0].imdbID).toBe('tt0816692');
    expect(state.watched).toHaveLength(0);
    // Persisted to new key
    expect(store['movie-library:v1']).toBeDefined();
  });

  it('skips migration if the new library already has data', async () => {
    await addToWatchlist(MOVIE); // writes to movie-library:v1
    store['watchlist:v1'] = JSON.stringify([MOVIE_2]);
    const state = await migrateIfNeeded();
    // Original data preserved, old key not merged in
    expect(state.watchlist[0].imdbID).toBe(MOVIE.imdbID);
    expect(state.watchlist).toHaveLength(1);
  });
});
