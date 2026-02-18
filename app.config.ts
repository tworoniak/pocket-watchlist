import 'dotenv/config';

export default {
  expo: {
    name: 'movie-watchlist',
    slug: 'movie-watchlist',
    extra: {
      omdbKey: process.env.EXPO_PUBLIC_OMDB_KEY,
    },
  },
};
