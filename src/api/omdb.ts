// const OMDB_KEY = Constants.expoConfig?.extra?.omdbKey as string | undefined;
const OMDB_KEY = process.env.EXPO_PUBLIC_OMDB_KEY;
const BASE_URL = 'https://www.omdbapi.com/';

function requireKey() {
  if (!OMDB_KEY) {
    throw new Error(
      'Missing OMDb API key. Set EXPO_PUBLIC_OMDB_KEY in your .env file.',
    );
  }
}

export type OmdbSearchMovie = {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
};

export async function searchMovies(
  query: string,
  page = 1,
  signal?: AbortSignal,
) {
  requireKey();

  const url = `${BASE_URL}?apikey=${OMDB_KEY}&s=${encodeURIComponent(
    query,
  )}&page=${page}&type=movie`;

  const res = await fetch(url, { signal });
  const data = await res.json();

  if (data.Response === 'False') {
    return { results: [], totalResults: 0, error: data.Error as string };
  }

  return {
    results: data.Search as OmdbSearchMovie[],
    totalResults: Number(data.totalResults || 0),
    error: null as string | null,
  };
}

export async function getMovieDetails(imdbID: string, signal?: AbortSignal) {
  requireKey();

  const url = `${BASE_URL}?apikey=${OMDB_KEY}&i=${encodeURIComponent(imdbID)}&plot=full`;

  const res = await fetch(url, { signal });
  const data = await res.json();

  if (data.Response === 'False')
    throw new Error(data.Error || 'Failed to load movie details');

  return data;
}
