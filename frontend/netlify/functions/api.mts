import type { Config } from "@netlify/functions";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { bookmarks, kidsProgress } from "../../db/schema.js";
import content from "./content.json";

type Prophet = (typeof content.prophets)[number];
type Question = { id: string; question: string; options: string[]; answer: number; explanation: string; tier: string };
const TOTAL_LEVELS = 100;

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": status === 200 ? "public, max-age=60" : "no-store" },
});

function seeded(level: number) {
  let state = (1000 + level) >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function questionBank() {
  const names = content.prophets.map((p) => p.name_short);
  const locations = [...new Set(content.prophets.map((p) => p.location))];
  const bank: Question[] = content.quizzes.map((q, i) => ({ ...q, id: q.id || `quiz-${i}`, tier: "easy" }));
  content.prophets.forEach((p, i) => {
    const orderOptions = shuffled([String(p.order), ...[1, 5, 10, 15, 20, 25].filter((n) => n !== p.order).map(String)].slice(0, 4), seeded(i));
    bank.push({ id: `order-${p.id}`, question: `ما ترتيب النبي ${p.name_short} بين الأنبياء؟`, options: orderOptions, answer: orderOptions.indexOf(String(p.order)), explanation: `ترتيب سيدنا ${p.name_short} هو ${p.order}.`, tier: "easy" });
    const placeOptions = shuffled([p.location, ...locations.filter((x) => x !== p.location).slice(i % Math.max(1, locations.length - 3), i % Math.max(1, locations.length - 3) + 3)], seeded(i + 100));
    bank.push({ id: `place-${p.id}`, question: `أين عاش النبي ${p.name_short} أو دعا قومه؟`, options: placeOptions, answer: placeOptions.indexOf(p.location), explanation: `عاش سيدنا ${p.name_short} في ${p.location}.`, tier: "medium" });
    const nameOptions = shuffled([p.name_short, ...names.filter((x) => x !== p.name_short).slice((i + 3) % 20, (i + 3) % 20 + 3)], seeded(i + 200));
    bank.push({ id: `era-${p.id}`, question: `من النبي المرتبط بعصر «${p.era}»؟`, options: nameOptions, answer: nameOptions.indexOf(p.name_short), explanation: `هو سيدنا ${p.name_short}.`, tier: "hard" });
  });
  return bank;
}

const BANK = questionBank();

async function handleQuran(path: string) {
  const match = path.match(/^\/quran\/surah\/(\d+)$/);
  const upstream = match
    ? `https://api.alquran.cloud/v1/surah/${match[1]}/quran-uthmani`
    : "https://api.alquran.cloud/v1/surah";
  if (match && (+match[1] < 1 || +match[1] > 114)) return json({ detail: "invalid surah number" }, 400);
  const response = await fetch(upstream, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) return json({ detail: "Quran service unavailable" }, 502);
  const { data } = await response.json() as { data: any };
  if (!match) return json(data.map(({ number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType }: any) => ({ number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType })));
  return json({ ...data, ayahs: data.ayahs.map((a: any) => ({ number: a.numberInSurah, text: a.text })) });
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (req.method === "GET" && path === "/") return json({ message: "Qisas Al-Anbiya API", count: content.prophets.length });
    if (req.method === "GET" && path === "/prophets") {
      const items = content.prophets.map(({ story, miracles, lessons, youtube_query, kids_story, ...summary }) => summary);
      items.sort(url.searchParams.get("sort") === "alpha" ? (a, b) => a.name_short.localeCompare(b.name_short, "ar") : (a, b) => a.order - b.order);
      return json(items);
    }
    const prophetMatch = path.match(/^\/prophets\/([^/]+)$/);
    if (req.method === "GET" && prophetMatch) {
      const prophet = content.prophets.find((p) => p.id === decodeURIComponent(prophetMatch[1]));
      return prophet ? json(prophet) : json({ detail: "Prophet not found" }, 404);
    }
    if (req.method === "GET" && path === "/story-of-the-day") {
      const p = content.prophets[Math.floor(Date.now() / 86400000) % content.prophets.length];
      const { story, miracles, lessons, youtube_query, kids_story, ...summary } = p;
      return json(summary);
    }
    if (req.method === "GET" && path === "/miracle-of-the-day") {
      const item = content.miracles[Math.floor(Date.now() / 86400000) % content.miracles.length];
      const p = content.prophets.find((x) => x.id === item.prophet_id);
      return json({ ...item, prophet_name: p?.name_ar || "", date: new Date().toISOString().slice(0, 10) });
    }
    if (req.method === "GET" && path === "/kids/quizzes") return json(content.quizzes);
    if (req.method === "GET" && path === "/kids/stories") return json(content.prophets.map(({ id, name_ar, name_short, kids_story }) => ({ id, name_ar, name_short, kids_story })));
    const levelMatch = path.match(/^\/kids\/level\/(\d+)$/);
    if (req.method === "GET" && levelMatch) {
      const level = +levelMatch[1];
      if (level < 1 || level > TOTAL_LEVELS) return json({ detail: "invalid level" }, 400);
      const tier = level <= 33 ? "easy" : level <= 66 ? "medium" : "hard";
      const pool = BANK.filter((q) => q.tier === tier);
      return json({ level, total_levels: TOTAL_LEVELS, questions: shuffled(pool, seeded(level)).slice(0, 10) });
    }
    if (path === "/kids/progress" && req.method === "GET") {
      const deviceId = url.searchParams.get("device_id")?.trim();
      if (!deviceId) return json({ detail: "device_id is required" }, 400);
      const [row] = await db.select().from(kidsProgress).where(eq(kidsProgress.deviceId, deviceId));
      const levels = row?.levels || {};
      return json({ device_id: deviceId, current_level: row?.currentLevel || 1, total_levels: TOTAL_LEVELS, total_stars: Object.values(levels).reduce((sum, x) => sum + x.stars, 0), levels });
    }
    if (path === "/kids/level/complete" && req.method === "POST") {
      const body = await req.json() as { device_id?: string; level?: number; correct?: number };
      if (!body.device_id || !body.level || body.level < 1 || body.level > TOTAL_LEVELS) return json({ detail: "invalid request" }, 400);
      const correct = Math.max(0, Math.min(10, Number(body.correct) || 0));
      const stars = correct >= 9 ? 3 : correct >= 7 ? 2 : correct >= 5 ? 1 : 0;
      const [existing] = await db.select().from(kidsProgress).where(eq(kidsProgress.deviceId, body.device_id));
      const levels = existing?.levels || {};
      levels[String(body.level)] = { stars: Math.max(levels[String(body.level)]?.stars || 0, stars), correct, completed_at: new Date().toISOString() };
      const passed = correct >= 6;
      const currentLevel = passed && body.level >= (existing?.currentLevel || 1) ? Math.min(TOTAL_LEVELS, body.level + 1) : (existing?.currentLevel || 1);
      await db.insert(kidsProgress).values({ deviceId: body.device_id, currentLevel, levels }).onConflictDoUpdate({ target: kidsProgress.deviceId, set: { currentLevel, levels } });
      return json({ passed, stars, current_level: currentLevel });
    }
    if (path === "/bookmarks" && req.method === "GET") {
      const deviceId = url.searchParams.get("device_id")?.trim();
      if (!deviceId) return json({ detail: "device_id is required" }, 400);
      const rows = await db.select().from(bookmarks).where(eq(bookmarks.deviceId, deviceId));
      return json(rows.map((x) => ({ device_id: x.deviceId, prophet_id: x.prophetId, created_at: x.createdAt.toISOString() })));
    }
    if (path === "/bookmarks" && req.method === "POST") {
      const body = await req.json() as { device_id?: string; prophet_id?: string };
      if (!body.device_id || !body.prophet_id) return json({ detail: "invalid request" }, 400);
      const [row] = await db.insert(bookmarks).values({ deviceId: body.device_id, prophetId: body.prophet_id }).onConflictDoUpdate({ target: [bookmarks.deviceId, bookmarks.prophetId], set: { createdAt: sql`now()` } }).returning();
      return json({ device_id: row.deviceId, prophet_id: row.prophetId, created_at: row.createdAt.toISOString() });
    }
    if (path === "/bookmarks" && req.method === "DELETE") {
      const deviceId = url.searchParams.get("device_id");
      const prophetId = url.searchParams.get("prophet_id");
      if (!deviceId || !prophetId) return json({ detail: "invalid request" }, 400);
      await db.delete(bookmarks).where(and(eq(bookmarks.deviceId, deviceId), eq(bookmarks.prophetId, prophetId)));
      return json({ ok: true });
    }
    if (req.method === "GET" && (path === "/quran/surahs" || path.startsWith("/quran/surah/"))) return handleQuran(path);
    if (req.method === "POST" && path === "/tts/generate") return json({ detail: "Audio generation is not configured on Netlify" }, 503);
    return json({ detail: "Not found" }, 404);
  } catch (error) {
    console.error("API request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ detail: "Service temporarily unavailable" }, 500);
  }
}

export const config: Config = { path: "/api/*" };
