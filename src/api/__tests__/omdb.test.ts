import { getMovieDetails, searchMovies } from '../omdb';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockResponse(body: object) {
  mockFetch.mockResolvedValue({ json: () => Promise.resolve(body) });
}

// ---------------------------------------------------------------------------
// searchMovies
// ---------------------------------------------------------------------------

describe('searchMovies', () => {
  it('returns parsed results on a successful response', async () => {
    mockResponse({
      Response: 'True',
      Search: [
        { imdbID: 'tt0816692', Title: 'Interstellar', Year: '2014', Poster: 'N/A' },
      ],
      totalResults: '1',
    });

    const result = await searchMovies('interstellar');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].imdbID).toBe('tt0816692');
    expect(result.totalResults).toBe(1);
    expect(result.error).toBeNull();
  });

  it('returns empty results and the error string when OMDb responds False', async () => {
    mockResponse({ Response: 'False', Error: 'Movie not found!' });

    const result = await searchMovies('xyznotfound');

    expect(result.results).toHaveLength(0);
    expect(result.totalResults).toBe(0);
    expect(result.error).toBe('Movie not found!');
  });

  it('passes the page number through to the request URL', async () => {
    mockResponse({ Response: 'True', Search: [], totalResults: '0' });

    await searchMovies('test', 3);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=3'),
      expect.anything(),
    );
  });

  it('passes the AbortSignal to fetch', async () => {
    mockResponse({ Response: 'True', Search: [], totalResults: '0' });
    const controller = new AbortController();

    await searchMovies('test', 1, controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('limits results to movies (type=movie in URL)', async () => {
    mockResponse({ Response: 'True', Search: [], totalResults: '0' });

    await searchMovies('batman');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('type=movie'),
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// getMovieDetails
// ---------------------------------------------------------------------------

describe('getMovieDetails', () => {
  it('returns a typed movie detail object on success', async () => {
    mockResponse({
      Response: 'True',
      imdbID: 'tt0816692',
      Title: 'Interstellar',
      Year: '2014',
      Rated: 'PG',
      Runtime: '169 min',
      Genre: 'Adventure, Drama, Sci-Fi',
      Actors: 'Matthew McConaughey, Anne Hathaway',
      Plot: 'A team of explorers...',
      Poster: 'N/A',
      imdbRating: '8.7',
    });

    const movie = await getMovieDetails('tt0816692');

    expect(movie.imdbID).toBe('tt0816692');
    expect(movie.Title).toBe('Interstellar');
    expect(movie.imdbRating).toBe('8.7');
  });

  it('throws when OMDb returns a False response', async () => {
    mockResponse({ Response: 'False', Error: 'Incorrect IMDb ID.' });

    await expect(getMovieDetails('invalid')).rejects.toThrow('Incorrect IMDb ID.');
  });

  it('throws with a fallback message when OMDb error is missing', async () => {
    mockResponse({ Response: 'False' });

    await expect(getMovieDetails('invalid')).rejects.toThrow(
      'Failed to load movie details',
    );
  });

  it('requests the full plot', async () => {
    mockResponse({ Response: 'True', imdbID: 'tt123', Title: 'Test', Year: '2020', Rated: 'G', Runtime: '90 min', Genre: 'Drama', Actors: 'Someone', Plot: 'Something', Poster: 'N/A', imdbRating: '7.0' });

    await getMovieDetails('tt123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('plot=full'),
      expect.anything(),
    );
  });
});
