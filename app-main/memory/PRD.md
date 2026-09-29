# PRD - قصص الأنبياء (Qisas Al-Anbiya)

## Overview
Arabic-first mobile app (React Native / Expo) presenting the stories of the 25 prophets mentioned in the Qur'an with reverence, dignity, and rich content, sourced from authoritative Islamic references (Qur'an, Tafsir Ibn Kathir's "Qisas al-Anbiya"). No figurative depictions of prophets — only calligraphy, nature, and geometric patterns.

## Features
- Home:
  - Story of the Day hero card (deterministic per calendar day)
  - Miracle of the Day card (rotates daily)
  - Horizontal scroll of all prophets in chronological order
  - Prominent Kids section CTA
- Stories tab: 25 prophets with search + chronological / alphabetical sorting
- Story Detail:
  - Full text story with generous line-height for Arabic
  - Segmented content: القصة / فيديو / المعجزات / الدروس
  - Inline YouTube search embed (via `list=search`) — no need to curate video IDs
  - Bookmark toggle in the hero
  - Floating "Listen to the Story" button → OpenAI TTS (voice: onyx, speed 0.95) with a global mini-player
- Kids Section:
  - Simplified stories for children (one per prophet)
  - Interactive quiz (10 questions) with haptics + progress bar + explanation
- Bookmarks tab: device-scoped saved prophets

## Backend (FastAPI)
Routes prefixed with `/api`:
- `GET /prophets?sort=chrono|alpha` — list summaries
- `GET /prophets/{id}` — full detail
- `GET /story-of-the-day`, `GET /miracle-of-the-day`
- `GET /kids/stories`, `GET /kids/quizzes`
- `POST /tts/generate` — Emergent OpenAI TTS (`tts-1`), disk-cached by hash → returns URL
- `GET /tts/{key}.mp3` — serves cached audio (Cache-Control 1 year)
- Bookmarks CRUD (device_id scoped) via MongoDB `bookmarks` collection

## Data
Hard-coded prophets data set in `backend/prophets_data.py` (25 prophets, miracles, lessons, kids stories, quizzes, miracle-of-day pool).

## Frontend
- Expo Router file-based navigation, RTL forced at boot (`I18nManager.forceRTL(true)`)
- Fonts loaded at runtime from Google Fonts (Amiri + Cairo); system fallback if network fails
- Theme tokens in `frontend/src/theme.ts` (Editorial Mobile Light — parchment / deep green / gold)
- Global audio store built on `expo-audio` with mini-player docked above the tab bar
- Bookmarks scoped by anonymous `device_id` in AsyncStorage

## Integrations
- Emergent Universal Key (`EMERGENT_LLM_KEY`) for OpenAI TTS (`tts-1`, voice `onyx`)
- YouTube: `list=search` embed URL — no API key required
