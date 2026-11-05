"""Gemini-backed analysis for Verdict AI feature workflows.

The deterministic services calculate transparent metrics. Gemini interprets only
those metrics and the user's submitted inputs; it is not given permission to
invent market quotes, news, or sources.
"""
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class AIAnalysisError(RuntimeError):
    """Raised when Gemini is not configured or cannot complete an analysis."""


FEATURE_GUIDANCE = {
    "investor_dna": "Describe observed trading habits and compare them with the user's self-assessment. Do not diagnose personality.",
    "circuit_breaker": "Review the proposed trade rationale, emotional state, confidence, and historical behaviour. Do not tell the user to buy or sell.",
    "stress_test": "Explain the arithmetic impact of the hypothetical scenario and its assumptions. Do not present the scenario as a forecast.",
    "regret_replay": "Explain the hindsight comparison carefully. Do not imply that a later price proves the original exit was wrong.",
    "hype_radar": "Assess the submitted narrative for promotional framing, missing evidence, and uncertainty. Do not claim to have scanned social media.",
    "move_autopsy": "Separate user-supplied observations from possible interpretations. Never claim correlation proves causation.",
    "bull_vs_bear": "Compare both theses fairly, identify assumptions and missing evidence, and avoid choosing a winner without sufficient facts.",
    "earnings_analysis": "Interpret only the supplied transcript excerpt. Distinguish management wording from verified financial performance; do not infer dishonesty.",
}


def generate_feature_analysis(feature, user_inputs, computed_result):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise AIAnalysisError(
            "Gemini is not configured. Add your GEMINI_API_KEY to the local .env file, restart Flask, and retry."
        )

    model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
    if not re.fullmatch(r"[A-Za-z0-9._-]+", model):
        raise AIAnalysisError("GEMINI_MODEL contains unsupported characters.")

    system_instruction = (
        "You are the analysis engine inside Verdict AI, an educational investing "
        "decision-support application. Use only the user's submitted inputs and "
        "the supplied computed result. Never invent prices, company facts, market "
        "news, analyst opinions, citations, or data sources. Clearly distinguish "
        "facts, user claims, calculations, and interpretations. Do not provide "
        "personalized buy/sell instructions, price targets, or guaranteed outcomes. "
        "Mention uncertainty and data gaps. Return one valid JSON object only, with "
        "these keys: summary (string), key_findings (array of strings), risks "
        "(array of strings), next_steps (array of strings), data_gaps (array of "
        "strings), limitations (array of strings)."
    )
    prompt = (
        "Feature: " + feature + "\n"
        "Task: " + FEATURE_GUIDANCE.get(feature, "Analyse the supplied information carefully.") + "\n\n"
        "USER INPUTS (unverified unless they are simple preferences):\n"
        + json.dumps(user_inputs, ensure_ascii=False, default=str)[:12000]
        + "\n\nDETERMINISTIC BACKEND RESULT (may include local sample data):\n"
        + json.dumps(computed_result, ensure_ascii=False, default=str)[:16000]
        + "\n\nWrite a concise, useful analysis. Do not repeat the whole input."
    )
    body = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 1400,
        },
    }
    request = Request(
        "https://generativelanguage.googleapis.com/v1beta/models/"
        + model
        + ":generateContent",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            details = json.loads(error.read().decode("utf-8"))
            message = details.get("error", {}).get("message", "Gemini request failed.")
        except Exception:
            message = "Gemini request failed with HTTP " + str(error.code) + "."
        raise AIAnalysisError("Gemini API error: " + str(message)[:500]) from error
    except (URLError, TimeoutError) as error:
        raise AIAnalysisError("Could not reach Gemini. Check your connection and try again.") from error
    except (ValueError, json.JSONDecodeError) as error:
        raise AIAnalysisError("Gemini returned an unreadable response. Please retry.") from error

    try:
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        analysis = json.loads(text)
        if not isinstance(analysis, dict):
            raise ValueError("Gemini response must be a JSON object.")
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise AIAnalysisError("Gemini did not return the expected structured analysis. Please retry.") from error

    for key in ("key_findings", "risks", "next_steps", "data_gaps", "limitations"):
        if not isinstance(analysis.get(key), list):
            analysis[key] = []
        analysis[key] = [str(item)[:700] for item in analysis[key][:8]]
    analysis["summary"] = str(analysis.get("summary", "Analysis completed."))[:1800]
    analysis["provider"] = "Google Gemini API"
    analysis["model"] = model
    return analysis
