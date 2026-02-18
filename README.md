# 🎬 Movie Pocket Watchlist

A **React Native (Expo + TypeScript)** mobile application that allows users to **search movies**, view details, and save movies to a persistent **watchlist** using local storage.

Built as a learning project to explore React Native fundamentals including navigation, API integration, and AsyncStorage persistence.

---

## 🚀 Features

- 🔍 Search movies using the **OMDb API**
- 📄 View movie details (plot, cast, rating, etc.)
- ⭐ Add movies to a personal **Watchlist**
- 🗑 Remove movies from Watchlist
- 💾 Persistent storage using **AsyncStorage**
- 📱 Mobile-first UI optimized for iOS and Android
- 🧭 Navigation powered by **Expo Router (Tabs + Stack)**
- ⏳ Debounced search to reduce unnecessary API calls
- 📑 Pagination support (infinite scrolling)

---

## 🛠 Tech Stack

- **React Native**
- **Expo**
- **TypeScript**
- **Expo Router**
- **OMDb API**
- **AsyncStorage**
- **FontAwesome Icons (Expo Vector Icons)**

---

## 📂 Project Structure

```
movie-pocket-watchlist/
│
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation layout
│   │   ├── search.tsx         # Search screen
│   │   └── watchlist.tsx      # Watchlist screen
│   │
│   └── movie/
│       └── [imdbID].tsx       # Movie details screen (dynamic route)
│
├── src/
│   ├── api/
│   │   └── omdb.ts            # OMDb API functions
│   │
│   ├── hooks/
│   │   └── useDebounce.ts     # Debounce hook
│   │
│   └── storage/
│       └── watchlist.ts       # AsyncStorage persistence
│
├── constants/
├── components/
├── assets/
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd movie-pocket-watchlist
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your OMDb API Key

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_OMDB_KEY=your_omdb_key_here
```

> You can request an OMDb API key here:  
> https://www.omdbapi.com/apikey.aspx

---

## ▶️ Running the App

Start the development server:

```bash
npx expo start
```

To clear cache (recommended after env changes):

```bash
npx expo start -c
```

Run on:

- iOS Simulator
- Android Emulator
- Expo Go app (QR code)

---

## 🔑 Environment Variables

| Variable               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `EXPO_PUBLIC_OMDB_KEY` | OMDb API key used for search + movie details |

Expo supports `EXPO_PUBLIC_*` variables natively, allowing access via:

```ts
process.env.EXPO_PUBLIC_OMDB_KEY;
```

---

## 📌 Notes / Behavior

### OMDb Search Results

- OMDb returns results in pages of **10 movies per request**
- Pagination is implemented using infinite scrolling (`onEndReached`)

### Watchlist Persistence

Watchlist movies are stored locally using:

- `@react-native-async-storage/async-storage`

Data persists across app restarts.

---

## 🧠 Future Enhancements (Planned)

- 🎨 Improved UI styling + theming
- 🌙 Dark mode improvements
- 🏷 Genre filtering / sorting
- ✅ Watched vs Unwatched status
- 🔥 Favorite movies list
- 📊 Watch stats / summary screen
- 🧾 Offline caching of movie details
- ☁️ Optional sync with backend/auth later

---

## 👨‍💻 Author

**Thomas Woroniak**  
Frontend Developer | React / TypeScript | React Native Learner  
📍 Remote (USA)

---

## 📜 License

This project is for learning and portfolio purposes.  
Feel free to fork and modify.
