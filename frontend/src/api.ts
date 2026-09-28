const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";

export const API_BASE = `${BASE}/api`;

export type Prophet = {
  id: string;
  name_ar: string;
  name_short: string;
  era: string;
  order: number;
  location: string;
  summary: string;
};

export type ProphetDetail = Prophet & {
  story: string;
  miracles: string[];
  lessons: string[];
  youtube_query: string;
  kids_story: string;
};

export type MiracleOfDay = {
  prophet_id: string;
  prophet_name: string;
  title: string;
  text: string;
  date: string;
};

export type Quiz = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type SurahDetail = Surah & {
  ayahs: { number: number; text: string }[];
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  listProphets: (sort: "chrono" | "alpha") =>
    get<Prophet[]>(`/prophets?sort=${sort}`),
  getProphet: (id: string) => get<ProphetDetail>(`/prophets/${id}`),
  miracleOfDay: () => get<MiracleOfDay>(`/miracle-of-the-day`),
  storyOfDay: () => get<Prophet>(`/story-of-the-day`),
  quizzes: () => get<Quiz[]>(`/kids/quizzes`),
  kidsStories: () =>
    get<{ id: string; name_ar: string; name_short: string; kids_story: string }[]>(
      `/kids/stories`,
    ),
  ttsGenerate: (text: string, voice = "onyx", speed = 0.95) =>
    post<{ audio_url: string; cached: boolean }>(`/tts/generate`, { text, voice, speed }),
  bookmarks: (deviceId: string) =>
    get<{ device_id: string; prophet_id: string; created_at: string }[]>(
      `/bookmarks?device_id=${deviceId}`,
    ),
  addBookmark: (deviceId: string, prophetId: string) =>
    post(`/bookmarks`, { device_id: deviceId, prophet_id: prophetId }),
  removeBookmark: async (deviceId: string, prophetId: string) => {
    await fetch(
      `${API_BASE}/bookmarks?device_id=${deviceId}&prophet_id=${prophetId}`,
      { method: "DELETE" },
    );
  },
  listSurahs: () => get<Surah[]>(`/quran/surahs`),
  getSurah: (n: number) => get<SurahDetail>(`/quran/surah/${n}`),
};

export function absAudioUrl(path: string) {
  return path.startsWith("http") ? path : `${BASE}${path}`;
}

export function youtubeSearchUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://www.youtube.com/embed?listType=search&list=${q}`;
}
