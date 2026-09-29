# -*- coding: utf-8 -*-
"""Question bank generator for the Skill Tree.
Generates ~150+ deterministic questions from PROPHETS data, split into
three difficulty tiers (easy / medium / hard). Levels 1-100 pull 10
questions per level, with rising difficulty as the level increases.
"""
import random
from typing import List, Dict, Any

from prophets_data import PROPHETS, KIDS_QUIZZES


def _build_bank() -> Dict[str, List[Dict[str, Any]]]:
    rng = random.Random(42)
    bank: Dict[str, List[Dict[str, Any]]] = {"easy": [], "medium": [], "hard": []}

    all_eras = sorted({p["era"] for p in PROPHETS})
    all_locations = sorted({p["location"] for p in PROPHETS})

    def add(tier: str, question: str, correct: str, wrongs: List[str], explanation: str):
        wrongs = [w for w in wrongs if w != correct]
        if len(wrongs) < 3:
            return
        pool = list(dict.fromkeys(wrongs))  # dedupe preserve order
        picks = rng.sample(pool, 3)
        opts = [correct] + picks
        rng.shuffle(opts)
        bank[tier].append({
            "question": question,
            "options": opts,
            "answer": opts.index(correct),
            "explanation": explanation,
        })

    for p in PROPHETS:
        # EASY: order among prophets
        wrong_orders = [str(x) for x in range(1, 26) if x != p["order"]]
        add(
            "easy",
            f"ما ترتيب النبي {p['name_short']} بين الأنبياء؟",
            str(p["order"]),
            wrong_orders,
            f"سيدنا {p['name_short']} هو النبي رقم {p['order']}.",
        )

        # EASY: location
        add(
            "easy",
            f"أين عاش النبي {p['name_short']} أو دعا قومه؟",
            p["location"],
            [x for x in all_locations if x != p["location"]],
            f"عاش سيدنا {p['name_short']} في: {p['location']}.",
        )

        # MEDIUM: era matching
        add(
            "medium",
            f"في أي عصر عاش النبي {p['name_short']}؟",
            p["era"],
            [x for x in all_eras if x != p["era"]],
            f"عصر النبي {p['name_short']}: {p['era']}.",
        )

        # MEDIUM: which prophet lived here?
        others_at_loc = [x for x in PROPHETS if x["id"] != p["id"] and x["location"] != p["location"]]
        add(
            "medium",
            f"أيّ نبي عاش أو دعا قومه في «{p['location']}»؟",
            p["name_short"],
            [o["name_short"] for o in others_at_loc],
            f"في «{p['location']}» كان النبي {p['name_short']}.",
        )

        # HARD: pick a real miracle
        if p["miracles"]:
            correct = p["miracles"][0]
            other_miracles = [m for other in PROPHETS if other["id"] != p["id"] for m in other["miracles"]]
            add(
                "hard",
                f"أيّ ممّا يلي من معجزات النبي {p['name_short']}؟",
                correct,
                other_miracles,
                f"من معجزات {p['name_short']}: {correct}.",
            )

        # HARD: pick a real lesson
        if p["lessons"]:
            correct = p["lessons"][0]
            other_lessons = [l for other in PROPHETS if other["id"] != p["id"] for l in other["lessons"]]
            add(
                "hard",
                f"أيّ ممّا يلي من الدروس المستفادة من قصة النبي {p['name_short']}؟",
                correct,
                other_lessons,
                f"من دروس قصة {p['name_short']}: {correct}.",
            )

    # Convert existing KIDS_QUIZZES (curated 10) into easy questions
    for q in KIDS_QUIZZES:
        options = list(q["options"])
        correct = options[q["answer"]]
        bank["easy"].append({
            "question": q["question"],
            "options": options,
            "answer": q["answer"],
            "explanation": q.get("explanation", ""),
        })

    # Assign ids
    counter = 0
    for tier in ("easy", "medium", "hard"):
        for item in bank[tier]:
            item["id"] = f"q{counter}"
            item["tier"] = tier
            counter += 1

    return bank


QUESTION_BANK_BY_TIER: Dict[str, List[Dict[str, Any]]] = _build_bank()


def questions_for_level(level: int) -> List[Dict[str, Any]]:
    """Return 10 deterministic questions for a level (1..100).

    - Levels 1-33: easy
    - Levels 34-66: mix (easy + medium, medium-heavy near 66)
    - Levels 67-100: mix (medium + hard, hard-heavy near 100)
    """
    level = max(1, min(100, level))
    rng = random.Random(1000 + level)

    easy = QUESTION_BANK_BY_TIER["easy"]
    medium = QUESTION_BANK_BY_TIER["medium"]
    hard = QUESTION_BANK_BY_TIER["hard"]

    if level <= 33:
        pool = list(easy)
    elif level <= 66:
        # more medium the higher the level in this band
        w_med = (level - 33) / 33.0
        n_med = int(round(10 * (0.4 + 0.5 * w_med)))
        n_easy = 10 - n_med
        picks_easy = rng.sample(easy, min(n_easy, len(easy)))
        picks_med = rng.sample(medium, min(n_med, len(medium)))
        pool = picks_easy + picks_med
    else:
        w_hard = (level - 66) / 34.0
        n_hard = int(round(10 * (0.4 + 0.5 * w_hard)))
        n_med = 10 - n_hard
        picks_med = rng.sample(medium, min(n_med, len(medium)))
        picks_hard = rng.sample(hard, min(n_hard, len(hard)))
        pool = picks_med + picks_hard

    if len(pool) >= 10:
        selected = rng.sample(pool, 10)
    else:
        selected = pool + rng.sample(pool, max(0, 10 - len(pool)))
    rng.shuffle(selected)
    # Return copies without leaking bank fields we don't want
    return [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "answer": q["answer"],
            "explanation": q.get("explanation", ""),
            "tier": q.get("tier"),
        }
        for q in selected
    ]


TOTAL_LEVELS = 100
