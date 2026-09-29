"""Backend tests for Skill Tree endpoints (Kids section).

Covers:
- GET /api/kids/level/{level} (valid + invalid)
- GET /api/kids/progress?device_id=...
- POST /api/kids/level/complete
- Determinism, no _id leaks
- Regression: /api/prophets, /api/prophets/{id}, /api/quran/surahs, /api/tts/generate
"""
import os
import uuid
import requests

BASE_URL = os.environ.get("BACKEND_TEST_URL", "http://localhost:8001").rstrip("/")


# ----- helpers -----
def _get(path, **kw):
    return requests.get(f"{BASE_URL}{path}", timeout=30, **kw)


def _post(path, **kw):
    return requests.post(f"{BASE_URL}{path}", timeout=30, **kw)


# ================== SKILL TREE - GET LEVEL ==================
class TestGetLevel:
    def test_level_1_easy(self):
        r = _get("/api/kids/level/1")
        assert r.status_code == 200
        data = r.json()
        assert data["level"] == 1
        assert data["total_levels"] == 100
        qs = data["questions"]
        assert len(qs) == 10
        for q in qs:
            assert set(["id", "question", "options", "answer", "explanation", "tier"]).issubset(q)
            assert isinstance(q["options"], list) and len(q["options"]) == 4
            assert isinstance(q["answer"], int) and 0 <= q["answer"] <= 3
            assert q["tier"] == "easy"

    def test_level_50_mix(self):
        r = _get("/api/kids/level/50")
        assert r.status_code == 200
        qs = r.json()["questions"]
        assert len(qs) == 10
        tiers = [q["tier"] for q in qs]
        # In band 34-66: mix of easy + medium, mostly medium at 50
        for t in tiers:
            assert t in ("easy", "medium")
        # At level 50 w_med=(50-33)/33=0.515, n_med=round(10*(0.4+0.5*0.515))=round(6.575)=7
        assert tiers.count("medium") >= 5

    def test_level_95_hard(self):
        r = _get("/api/kids/level/95")
        assert r.status_code == 200
        qs = r.json()["questions"]
        assert len(qs) == 10
        tiers = [q["tier"] for q in qs]
        for t in tiers:
            assert t in ("medium", "hard")
        # At level 95, mostly hard
        assert tiers.count("hard") >= 5

    def test_level_0_bad(self):
        r = _get("/api/kids/level/0")
        assert r.status_code == 400

    def test_level_101_bad(self):
        r = _get("/api/kids/level/101")
        assert r.status_code == 400

    def test_level_deterministic(self):
        r1 = _get("/api/kids/level/7").json()
        r2 = _get("/api/kids/level/7").json()
        ids1 = [q["id"] for q in r1["questions"]]
        ids2 = [q["id"] for q in r2["questions"]]
        assert ids1 == ids2
        # Also same options order
        for a, b in zip(r1["questions"], r2["questions"]):
            assert a["question"] == b["question"]
            assert a["options"] == b["options"]
            assert a["answer"] == b["answer"]


# ================== KIDS PROGRESS - FRESH ==================
class TestProgressFresh:
    def test_fresh_device_progress(self):
        dev = f"TEST_fresh_{uuid.uuid4().hex[:8]}"
        r = _get("/api/kids/progress", params={"device_id": dev})
        assert r.status_code == 200
        data = r.json()
        assert data["current_level"] == 1
        assert data["total_levels"] == 100
        assert data["total_stars"] == 0
        assert data["levels"] == {}
        # No _id leak
        assert "_id" not in data


# ================== COMPLETE-LEVEL FLOW ==================
class TestCompleteLevelFlow:
    _dev = f"TEST_progress_{uuid.uuid4().hex[:8]}"

    def test_a_complete_level1_9correct(self):
        r = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 1, "correct": 9},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["passed"] is True
        assert data["stars"] == 3
        assert data["current_level"] == 2

    def test_b_progress_reflects_level1(self):
        r = _get("/api/kids/progress", params={"device_id": self._dev})
        assert r.status_code == 200
        d = r.json()
        assert d["current_level"] == 2
        assert d["total_stars"] == 3
        assert "1" in d["levels"]
        lv1 = d["levels"]["1"]
        assert lv1["stars"] == 3
        assert lv1["correct"] == 9
        assert "_id" not in d

    def test_c_complete_level2_6correct(self):
        r = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 2, "correct": 6},
        )
        assert r.status_code == 200
        d = r.json()
        assert d["passed"] is True
        assert d["stars"] == 1
        assert d["current_level"] == 3

    def test_d_complete_level3_fail(self):
        r = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 3, "correct": 4},
        )
        assert r.status_code == 200
        d = r.json()
        assert d["passed"] is False
        assert d["stars"] == 0
        # Should stay at 3, not regress
        assert d["current_level"] == 3

    def test_e_replay_level1_lower_score_no_regress(self):
        # Redo level 1 with a lower score (5 -> 1 star). Should NOT overwrite 3 stars.
        r = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 1, "correct": 5},
        )
        assert r.status_code == 200
        d = r.json()
        # response reports "stars" for THIS attempt = 1 (5/10) OK per handler
        # But persisted stars should remain max = 3
        # current_level must NOT regress (still 3)
        assert d["current_level"] == 3

        g = _get("/api/kids/progress", params={"device_id": self._dev}).json()
        assert g["current_level"] == 3
        assert g["levels"]["1"]["stars"] == 3, "level 1 stars must remain 3 (max wins)"

    def test_f_invalid_level_complete(self):
        r = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 0, "correct": 5},
        )
        assert r.status_code == 400
        r2 = _post(
            "/api/kids/level/complete",
            json={"device_id": self._dev, "level": 101, "correct": 5},
        )
        assert r2.status_code == 400


# ================== REGRESSION ==================
class TestRegression:
    def test_prophets_chrono_25(self):
        r = _get("/api/prophets", params={"sort": "chrono"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 25
        # ascending by order
        orders = [p["order"] for p in data]
        assert orders == sorted(orders)

    def test_prophet_musa_detail(self):
        r = _get("/api/prophets/musa")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "musa"
        assert "story" in d and len(d["story"]) > 0
        assert isinstance(d["miracles"], list)
        assert isinstance(d["lessons"], list)

    def test_quran_surahs_114(self):
        r = _get("/api/quran/surahs")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 114
        assert data[0]["number"] == 1

    def test_tts_generate_small(self):
        r = _post("/api/tts/generate", json={"text": "بسم الله", "voice": "onyx", "speed": 0.95})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["audio_url"].startswith("/api/tts/")
        assert d["audio_url"].endswith(".mp3")
