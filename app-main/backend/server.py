import os
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from prophets_data import PROPHETS, MIRACLE_OF_DAY_ITEMS, KIDS_QUIZZES
from skill_tree import questions_for_level, TOTAL_LEVELS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

# Audio cache directory
AUDIO_DIR = ROOT_DIR / "audio_cache"
AUDIO_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ----- Models -----
class ProphetSummary(BaseModel):
    id: str
    name_ar: str
    name_short: str
    era: str
    order: int
    location: str
    summary: str


class ProphetDetail(ProphetSummary):
    story: str
    miracles: List[str]
    lessons: List[str]
    youtube_query: str
    kids_story: str


class MiracleOfDay(BaseModel):
    prophet_id: str
    prophet_name: str
    title: str
    text: str
    date: str


class QuizItem(BaseModel):
    id: str
    question: str
    options: List[str]
    answer: int
    explanation: str


class TTSRequest(BaseModel):
    text: str
    voice: str = "onyx"
    speed: float = 0.95


class TTSResponse(BaseModel):
    audio_url: str
    cached: bool


class BookmarkCreate(BaseModel):
    device_id: str
    prophet_id: str


class Bookmark(BaseModel):
    device_id: str
    prophet_id: str
    created_at: str


# ----- Helpers -----
def _tts_cache_key(text: str, voice: str, speed: float) -> str:
    raw = f"{text}|{voice}|{speed}|tts-1|mp3"
    return hashlib.sha256(raw.encode()).hexdigest()


def _prophet_by_id(pid: str) -> Optional[dict]:
    for p in PROPHETS:
        if p["id"] == pid:
            return p
    return None


# ----- Endpoints -----
@api_router.get("/")
async def root():
    return {"message": "Qisas Al-Anbiya API", "count": len(PROPHETS)}


@api_router.get("/prophets", response_model=List[ProphetSummary])
async def list_prophets(sort: str = "chrono"):
    """sort=chrono (by order) or sort=alpha (by name)."""
    items = [
        ProphetSummary(
            id=p["id"], name_ar=p["name_ar"], name_short=p["name_short"],
            era=p["era"], order=p["order"], location=p["location"], summary=p["summary"],
        )
        for p in PROPHETS
    ]
    if sort == "alpha":
        items.sort(key=lambda x: x.name_short)
    else:
        items.sort(key=lambda x: x.order)
    return items


@api_router.get("/prophets/{prophet_id}", response_model=ProphetDetail)
async def get_prophet(prophet_id: str):
    p = _prophet_by_id(prophet_id)
    if not p:
        raise HTTPException(status_code=404, detail="Prophet not found")
    return ProphetDetail(**p)


@api_router.get("/miracle-of-the-day", response_model=MiracleOfDay)
async def miracle_of_the_day():
    # Deterministic pick by day-of-year
    day = datetime.now(timezone.utc).timetuple().tm_yday
    item = MIRACLE_OF_DAY_ITEMS[day % len(MIRACLE_OF_DAY_ITEMS)]
    prophet = _prophet_by_id(item["prophet_id"])
    return MiracleOfDay(
        prophet_id=item["prophet_id"],
        prophet_name=prophet["name_ar"] if prophet else "",
        title=item["title"],
        text=item["text"],
        date=datetime.now(timezone.utc).date().isoformat(),
    )


@api_router.get("/story-of-the-day", response_model=ProphetSummary)
async def story_of_the_day():
    day = datetime.now(timezone.utc).timetuple().tm_yday
    p = PROPHETS[day % len(PROPHETS)]
    return ProphetSummary(
        id=p["id"], name_ar=p["name_ar"], name_short=p["name_short"],
        era=p["era"], order=p["order"], location=p["location"], summary=p["summary"],
    )


@api_router.get("/kids/quizzes", response_model=List[QuizItem])
async def kids_quizzes():
    return [QuizItem(**q) for q in KIDS_QUIZZES]


# ----- Skill Tree (100 levels) -----
class LevelQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    answer: int
    explanation: str = ""
    tier: str = ""


class LevelResponse(BaseModel):
    level: int
    total_levels: int
    questions: List[LevelQuestion]


class LevelCompletePayload(BaseModel):
    device_id: str
    level: int
    correct: int


class LevelCompleteResponse(BaseModel):
    passed: bool
    stars: int
    current_level: int


class ProgressResponse(BaseModel):
    device_id: str
    current_level: int
    total_levels: int
    total_stars: int
    levels: dict


def _stars_for_correct(correct: int) -> int:
    if correct >= 9:
        return 3
    if correct >= 7:
        return 2
    if correct >= 5:
        return 1
    return 0


@api_router.get("/kids/level/{level}", response_model=LevelResponse)
async def get_level(level: int):
    if level < 1 or level > TOTAL_LEVELS:
        raise HTTPException(status_code=400, detail="invalid level")
    qs = questions_for_level(level)
    return LevelResponse(
        level=level,
        total_levels=TOTAL_LEVELS,
        questions=[LevelQuestion(**q) for q in qs],
    )


@api_router.get("/kids/progress", response_model=ProgressResponse)
async def get_progress(device_id: str):
    doc = await db.kids_progress.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        return ProgressResponse(
            device_id=device_id, current_level=1, total_levels=TOTAL_LEVELS,
            total_stars=0, levels={},
        )
    levels = doc.get("levels", {}) or {}
    total_stars = sum(int(v.get("stars", 0)) for v in levels.values())
    return ProgressResponse(
        device_id=device_id,
        current_level=int(doc.get("current_level", 1)),
        total_levels=TOTAL_LEVELS,
        total_stars=total_stars,
        levels=levels,
    )


@api_router.post("/kids/level/complete", response_model=LevelCompleteResponse)
async def complete_level(payload: LevelCompletePayload):
    if payload.level < 1 or payload.level > TOTAL_LEVELS:
        raise HTTPException(status_code=400, detail="invalid level")
    correct = max(0, min(10, int(payload.correct)))
    doc = await db.kids_progress.find_one(
        {"device_id": payload.device_id}, {"_id": 0}
    ) or {"device_id": payload.device_id, "current_level": 1, "levels": {}}

    stars = _stars_for_correct(correct)
    passed = correct >= 6  # need 6/10 to advance
    levels = doc.get("levels", {}) or {}
    prev_stars = int(levels.get(str(payload.level), {}).get("stars", 0))
    levels[str(payload.level)] = {
        "stars": max(prev_stars, stars),
        "correct": correct,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    doc["levels"] = levels
    current_level = int(doc.get("current_level", 1))
    if passed and payload.level >= current_level:
        current_level = min(TOTAL_LEVELS, payload.level + 1)
    doc["current_level"] = current_level

    await db.kids_progress.update_one(
        {"device_id": payload.device_id},
        {"$set": {"current_level": current_level, "levels": levels}},
        upsert=True,
    )
    return LevelCompleteResponse(
        passed=passed, stars=stars, current_level=current_level,
    )


@api_router.get("/kids/stories", response_model=List[dict])
async def kids_stories():
    return [
        {
            "id": p["id"],
            "name_ar": p["name_ar"],
            "name_short": p["name_short"],
            "kids_story": p["kids_story"],
        }
        for p in PROPHETS
    ]


# ----- Bookmarks (device-based, no auth) -----
@api_router.post("/bookmarks", response_model=Bookmark)
async def add_bookmark(payload: BookmarkCreate):
    doc = {
        "device_id": payload.device_id,
        "prophet_id": payload.prophet_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookmarks.update_one(
        {"device_id": payload.device_id, "prophet_id": payload.prophet_id},
        {"$set": doc},
        upsert=True,
    )
    return Bookmark(**doc)


@api_router.delete("/bookmarks")
async def remove_bookmark(device_id: str, prophet_id: str):
    await db.bookmarks.delete_one({"device_id": device_id, "prophet_id": prophet_id})
    return {"ok": True}


@api_router.get("/bookmarks", response_model=List[Bookmark])
async def list_bookmarks(device_id: str):
    cursor = db.bookmarks.find({"device_id": device_id}, {"_id": 0})
    return [Bookmark(**doc) async for doc in cursor]


# ----- TTS -----
@api_router.post("/tts/generate", response_model=TTSResponse)
async def generate_tts(req: TTSRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    # OpenAI TTS caps at 4096 chars
    text = text[:4000]

    key = _tts_cache_key(text, req.voice, req.speed)
    audio_path = AUDIO_DIR / f"{key}.mp3"
    if audio_path.exists():
        return TTSResponse(audio_url=f"/api/tts/{key}.mp3", cached=True)

    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))
        audio_bytes = await tts.generate_speech(
            text=text, model="tts-1", voice=req.voice, speed=req.speed, response_format="mp3",
        )
        audio_path.write_bytes(audio_bytes)
        return TTSResponse(audio_url=f"/api/tts/{key}.mp3", cached=False)
    except Exception as e:
        logger.exception("TTS generation failed")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@api_router.get("/tts/{key}.mp3")
async def serve_tts(key: str):
    audio_path = AUDIO_DIR / f"{key}.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="audio not found")
    return Response(
        content=audio_path.read_bytes(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000"},
    )


# ----- Quran endpoints (proxying alquran.cloud, cached in-memory) -----
QURAN_BASE = "https://api.alquran.cloud/v1"
_surahs_cache: Optional[List[dict]] = None
_surah_cache: dict = {}


@api_router.get("/quran/surahs")
async def quran_surahs():
    global _surahs_cache
    if _surahs_cache is not None:
        return _surahs_cache
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(f"{QURAN_BASE}/surah")
        r.raise_for_status()
        data = r.json().get("data", [])
        _surahs_cache = [
            {
                "number": s["number"],
                "name": s["name"],
                "englishName": s["englishName"],
                "englishNameTranslation": s["englishNameTranslation"],
                "numberOfAyahs": s["numberOfAyahs"],
                "revelationType": s["revelationType"],
            }
            for s in data
        ]
        return _surahs_cache


@api_router.get("/quran/surah/{number}")
async def quran_surah(number: int):
    if number < 1 or number > 114:
        raise HTTPException(status_code=400, detail="invalid surah number")
    if number in _surah_cache:
        return _surah_cache[number]
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{QURAN_BASE}/surah/{number}/quran-uthmani")
        r.raise_for_status()
        data = r.json().get("data", {})
        result = {
            "number": data.get("number"),
            "name": data.get("name"),
            "englishName": data.get("englishName"),
            "englishNameTranslation": data.get("englishNameTranslation"),
            "revelationType": data.get("revelationType"),
            "ayahs": [
                {"number": a.get("numberInSurah"), "text": a.get("text")}
                for a in data.get("ayahs", [])
            ],
        }
        _surah_cache[number] = result
        return result


app.include_router(api_router)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
