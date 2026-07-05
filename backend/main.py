"""
CropCare AI Agent -- FastAPI Backend
Three autonomous AI endpoints powered by Google Gemini 2.5 Flash
"""
import os
import sys
import json
import base64

from dotenv import load_dotenv
load_dotenv()  # loads .env from the current directory (backend/.env)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# ── API KEY GUARD ─────────────────────────────────────────────────────────────
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY environment variable not set.")
    print("  Windows CMD:   set GEMINI_API_KEY=your_key")
    print("  PowerShell:    $env:GEMINI_API_KEY='your_key'")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# ── FASTAPI APP ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="CropCare AI Agent API",
    version="1.0.0",
    description="Autonomous agricultural intelligence powered by Gemini 2.5 Flash",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REQUEST MODELS ─────────────────────────────────────────────────────────────
class DiagnoseRequest(BaseModel):
    image_b64: str
    mime_type: str = "image/jpeg"

class RecommendRequest(BaseModel):
    region: str
    query: str

class YieldRequest(BaseModel):
    crop: str
    area_ha: float
    season: str

# ── UTILITY: Strip markdown JSON fences ────────────────────────────────────────
def clean_json_text(text: str) -> str:
    """Remove markdown code fences so json.loads can parse cleanly."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # drop opening fence line (e.g. ```json)
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

# ── TOOL: Regional Soil Knowledge-Base ────────────────────────────────────────
def query_soil_database(region: str) -> str:
    """
    Queries the CropCare regional soil knowledge-base and returns a structured
    agricultural profile containing soil type, pH, moisture retention, and
    primary nutrient deficiencies for the specified geographic region.

    Args:
        region: A city name, state, or geographic region (e.g. 'Mumbai', 'Punjab').

    Returns:
        A pipe-delimited soil profile string with agronomic parameters.
    """
    r = region.strip().lower()
    if "mumbai" in r or "maharashtra" in r:
        return (
            "Soil: Black/Alluvial mix | pH: 7.2 | Moisture Retention: High | "
            "Deficiency: Nitrogen deficient. "
            "Recommendation: Urea top-dressing pre-Kharif season."
        )
    elif "punjab" in r:
        return (
            "Soil: Alluvial | pH: 6.8 | Moisture Retention: Moderate | "
            "Deficiency: Low organic carbon, rich in potassium. "
            "Recommendation: Green-manure or FYM incorporation."
        )
    else:
        return (
            f"Soil: Loam blend (generic for '{region}') | pH: 6.5 | "
            "Moisture Retention: Moderate | "
            "Deficiency: Standard N-P-K profile. "
            "Recommendation: On-site soil testing advised before prescription."
        )

TOOL_REGISTRY: dict = {"query_soil_database": query_soil_database}

# ── SYSTEM INSTRUCTIONS ────────────────────────────────────────────────────────
DIAGNOSE_PROMPT = """You are CropCare AI, an expert plant pathologist. Analyze the provided leaf image.

Supported crops: Apple, Corn, Grape, Pepper, Potato, Tomato.

Reasoning steps:
1. Identify the crop species from visual morphology.
2. Identify the disease class (e.g. Late Blight, Powdery Mildew, Leaf Curl, Bacterial Spot, Healthy, Unknown).
3. Assess severity: Low / Moderate / High / Critical.
4. Estimate detection confidence as a percentage (e.g. "87%").
5. Provide exactly 3 to 5 concrete, actionable treatment steps.
6. Write your complete step-by-step diagnostic reasoning.

Return ONLY a valid JSON object with exactly these keys and no surrounding text:
{
  "crop": "...",
  "disease": "...",
  "severity": "Low",
  "confidence": "..%",
  "treatment": ["step 1", "step 2", "step 3"],
  "reasoning": "..."
}"""

RECOMMEND_SYSTEM = """You are CropCare AI, an advanced autonomous agricultural advisor.

## Reasoning Protocol
1. Parse the geographic region from the user message.
2. ALWAYS call query_soil_database with the region name as the VERY FIRST action.
3. Read the returned soil profile and reason about crop suitability.
4. Synthesise a precise fertilizer prescription and crop plan.

## Mandatory Rule
Whenever a city, state, or region is mentioned, call query_soil_database immediately. Never skip this step.

## Output Format
After reasoning, return ONLY a valid JSON object with exactly these keys and no surrounding text:
{
  "soil_profile": "<raw string returned by query_soil_database>",
  "crop_recommendations": ["Crop A", "Crop B", "Crop C"],
  "fertilizer_plan": "<detailed fertilizer schedule and prescription>",
  "reasoning": "<complete step-by-step agronomic reasoning>"
}"""

YIELD_SYSTEM = """You are CropCare AI, an agronomic yield estimation specialist.

Reason step-by-step using these national average benchmarks (metric tons per hectare):
- Wheat (Rabi): 3.5 | Rice (Kharif): 2.6 | Cotton (Kharif): 0.45 (lint)
- Sugarcane: 70  | Maize: 3.0 | Soybean (Kharif): 1.1
- Tomato: 25 | Potato: 22 | Onion: 20 | Barley: 2.8

Apply seasonal fit and variability adjustments when reasoning.

Return ONLY a valid JSON object with exactly these keys and no surrounding text:
{
  "crop": "...",
  "area_ha": <number>,
  "season": "...",
  "estimated_yield_mt": <number>,
  "yield_per_ha": <number>,
  "confidence": "Low",
  "notes": "<agronomic reasoning, assumptions, and caveats>"
}"""

# ── ENDPOINT 1: LEAF DISEASE DIAGNOSTICS ──────────────────────────────────────
@app.post("/api/diagnose")
async def diagnose(req: DiagnoseRequest):
    """Analyze a base64-encoded leaf image for disease class, severity, and treatment."""
    try:
        image_bytes = base64.b64decode(req.image_b64)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=req.mime_type)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[DIAGNOSE_PROMPT, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        raw = clean_json_text(response.text or "")
        return json.loads(raw)

    except json.JSONDecodeError as exc:
        detail = f"Model returned non-JSON output: {exc}"
        raise HTTPException(status_code=500, detail=detail)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ── ENDPOINT 2: CROP & FERTILIZER RECOMMENDATION ──────────────────────────────
@app.post("/api/recommend")
async def recommend(req: RecommendRequest):
    """Stateful agent session with query_soil_database tool -- region-aware crop & fertilizer plan."""
    try:
        chat = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=RECOMMEND_SYSTEM,
                tools=[query_soil_database],
                temperature=0.3,
            ),
        )

        user_msg = f"Region: {req.region}\n\nUser query: {req.query}"
        response = chat.send_message(user_msg)
        soil_profile_captured: str | None = None

        # ── Agentic tool dispatch loop ─────────────────────────────────────
        while True:
            tool_parts = [
                part
                for cand in response.candidates
                for part in cand.content.parts
                if part.function_call is not None
            ]
            if not tool_parts:
                break  # No pending tool calls -- final text answer ready

            fn_response_parts = []
            for part in tool_parts:
                fc = part.function_call
                fn_args = dict(fc.args) if fc.args else {}

                if fc.name in TOOL_REGISTRY:
                    tool_result = TOOL_REGISTRY[fc.name](**fn_args)
                    if fc.name == "query_soil_database":
                        soil_profile_captured = tool_result
                else:
                    tool_result = f"Error: tool '{fc.name}' not registered."

                fn_response_parts.append(
                    types.Part.from_function_response(
                        name=fc.name,
                        response={"result": tool_result},
                    )
                )

            response = chat.send_message(fn_response_parts)

        # ── Parse final text response ──────────────────────────────────────
        raw = clean_json_text(response.text or "")
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: wrap unstructured text gracefully
            result = {
                "soil_profile": soil_profile_captured or "N/A",
                "crop_recommendations": [],
                "fertilizer_plan": response.text or "",
                "reasoning": response.text or "",
            }

        # Ensure captured soil profile is always present
        if soil_profile_captured and not result.get("soil_profile"):
            result["soil_profile"] = soil_profile_captured

        return result

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ── ENDPOINT 3: CROP YIELD PREDICTION ─────────────────────────────────────────
@app.post("/api/predict-yield")
async def predict_yield(req: YieldRequest):
    """Knowledge-based agronomic yield estimation with step-by-step reasoning."""
    try:
        prompt = (
            f"Estimate the crop yield for:\n"
            f"- Crop: {req.crop}\n"
            f"- Farm Area: {req.area_ha} hectares\n"
            f"- Growing Season: {req.season}\n\n"
            "Reason step-by-step, then return the yield estimate as a JSON object."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=YIELD_SYSTEM,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        raw = clean_json_text(response.text or "")
        result = json.loads(raw)
        result["area_ha"] = req.area_ha  # echo original input in case model rounds it
        return result

    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Model returned non-JSON output: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

# ── HEALTH CHECK ───────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "CropCare AI Agent API",
        "model": "gemini-2.5-flash",
    }
