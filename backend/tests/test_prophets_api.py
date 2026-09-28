"""Backend tests for Qisas Al-Anbiya (Stories of the Prophets) API."""
import datetime as dt
import uuid
import pytest


# ---------- Root ----------
class TestRoot:
    def test_root_returns_count_25(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("count") == 25
        assert "message" in data


# ---------- Prophets list ----------
class TestProphetsList:
    def test_chrono_sorted(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/prophets", params={"sort": "chrono"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 25
        orders = [p["order"] for p in items]
        assert orders == sorted(orders)
        assert orders[0] == 1 and orders[-1] == 25
        required = {"id", "name_ar", "name_short", "era", "order", "location", "summary"}
        assert required.issubset(items[0].keys())

    def test_alpha_sorted(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/prophets", params={"sort": "alpha"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 25
        names = [p["name_short"] for p in items]
        assert names == sorted(names)


# ---------- Prophet detail ----------
class TestProphetDetail:
    def test_musa_full_detail(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/prophets/musa")
        assert r.status_code == 200, r.text
        d = r.json()
        for field in ("id", "name_ar", "story", "miracles", "lessons", "youtube_query", "kids_story"):
            assert field in d, f"missing field {field}"
        assert d["id"] == "musa"
        assert isinstance(d["miracles"], list) and len(d["miracles"]) > 0
        assert isinstance(d["lessons"], list) and len(d["lessons"]) > 0
        assert isinstance(d["story"], str) and len(d["story"]) > 0

    def test_missing_prophet_404(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/prophets/nonexistent-id-xyz")
        assert r.status_code == 404


# ---------- Miracle of the day ----------
class TestMiracleOfDay:
    def test_shape_and_date(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/miracle-of-the-day")
        assert r.status_code == 200
        d = r.json()
        for f in ("prophet_id", "prophet_name", "title", "text", "date"):
            assert f in d
        # date is today ISO date
        today = dt.datetime.utcnow().date().isoformat()
        assert d["date"] == today
        assert d["prophet_id"]
        assert d["prophet_name"]


# ---------- Story of the day ----------
class TestStoryOfDay:
    def test_shape_and_deterministic(self, api_client, base_url):
        r1 = api_client.get(f"{base_url}/api/story-of-the-day")
        assert r1.status_code == 200
        d = r1.json()
        for f in ("id", "name_ar", "name_short", "era", "order", "location", "summary"):
            assert f in d
        r2 = api_client.get(f"{base_url}/api/story-of-the-day")
        assert r2.json()["id"] == d["id"]  # deterministic by day


# ---------- Kids ----------
class TestKids:
    def test_kids_stories(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/kids/stories")
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 25
        assert all("kids_story" in it and it["kids_story"] for it in items)

    def test_kids_quizzes(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/kids/quizzes")
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 10
        for q in items:
            assert "question" in q and q["question"]
            assert isinstance(q["options"], list) and len(q["options"]) >= 2
            assert isinstance(q["answer"], int)
            assert 0 <= q["answer"] < len(q["options"])
            assert "explanation" in q


# ---------- Bookmarks ----------
class TestBookmarks:
    device_id = f"TEST_device_{uuid.uuid4().hex[:8]}"
    prophet_id = "musa"

    def test_01_add_bookmark(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/bookmarks",
            json={"device_id": self.device_id, "prophet_id": self.prophet_id},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["device_id"] == self.device_id
        assert d["prophet_id"] == self.prophet_id
        assert "created_at" in d
        assert "_id" not in d

    def test_02_idempotent_upsert(self, api_client, base_url):
        # Second POST should not error and not duplicate
        r = api_client.post(
            f"{base_url}/api/bookmarks",
            json={"device_id": self.device_id, "prophet_id": self.prophet_id},
        )
        assert r.status_code == 200
        # verify count is 1
        r2 = api_client.get(f"{base_url}/api/bookmarks", params={"device_id": self.device_id})
        assert r2.status_code == 200
        items = r2.json()
        assert len(items) == 1
        assert items[0]["prophet_id"] == self.prophet_id
        for it in items:
            assert "_id" not in it  # ensure no leak

    def test_03_list_bookmarks(self, api_client, base_url):
        # add second prophet
        api_client.post(
            f"{base_url}/api/bookmarks",
            json={"device_id": self.device_id, "prophet_id": "isa"},
        )
        r = api_client.get(f"{base_url}/api/bookmarks", params={"device_id": self.device_id})
        assert r.status_code == 200
        items = r.json()
        pids = {it["prophet_id"] for it in items}
        assert {"musa", "isa"}.issubset(pids)

    def test_04_delete_bookmark(self, api_client, base_url):
        r = api_client.delete(
            f"{base_url}/api/bookmarks",
            params={"device_id": self.device_id, "prophet_id": "isa"},
        )
        assert r.status_code == 200
        r2 = api_client.get(f"{base_url}/api/bookmarks", params={"device_id": self.device_id})
        pids = {it["prophet_id"] for it in r2.json()}
        assert "isa" not in pids

    def test_05_cleanup(self, api_client, base_url):
        api_client.delete(
            f"{base_url}/api/bookmarks",
            params={"device_id": self.device_id, "prophet_id": self.prophet_id},
        )
        r = api_client.get(f"{base_url}/api/bookmarks", params={"device_id": self.device_id})
        assert r.json() == []


# ---------- TTS ----------
class TestTTS:
    text = "بسم الله"

    def test_01_generate_first_call(self, api_client, base_url):
        # Best-effort: cache may already exist from prior runs; second-call verifies caching.
        r = api_client.post(f"{base_url}/api/tts/generate", json={"text": self.text})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "audio_url" in d and d["audio_url"].startswith("/api/tts/")
        assert "cached" in d
        # store for next tests
        pytest._tts_url = d["audio_url"]

    def test_02_generate_cached_second_call(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/tts/generate", json={"text": self.text})
        assert r.status_code == 200
        d = r.json()
        assert d["cached"] is True, "second call should be cached"

    def test_03_serve_audio(self, api_client, base_url):
        url = getattr(pytest, "_tts_url", None)
        assert url, "no audio url from generate"
        r = api_client.get(f"{base_url}{url}")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r.content) > 5 * 1024, f"audio too small: {len(r.content)} bytes"

    def test_04_empty_text_400(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/tts/generate", json={"text": "   "})
        assert r.status_code == 400
