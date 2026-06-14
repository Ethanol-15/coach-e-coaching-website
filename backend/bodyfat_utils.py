"""
bodyfat_utils.py
----------------
Pure utility functions for the Body Fat Analyzer.
No Streamlit imports — this runs inside FastAPI.

Contains:
- Unit conversion helpers (imperial → metric)
- Navy Body Fat Formula (math-based estimate from measurements)
- BF% category classifier (ACE ranges)
- Groq Vision API call (AI visual estimate from photo)
"""

import math
import base64


# ------------------------------------------------------------
# UNIT CONVERSION HELPERS
# The frontend sends metric values only, but these are kept
# here in case you ever want to handle conversion server-side.
# ------------------------------------------------------------

def feet_inches_to_cm(feet: float, inches: float) -> float:
    """Converts height from feet + inches to centimeters."""
    total_inches = (feet * 12) + inches
    return total_inches * 2.54


def inches_to_cm(inches: float) -> float:
    """Converts a single circumference measurement from inches to cm."""
    return inches * 2.54


# ------------------------------------------------------------
# NAVY BODY FAT FORMULA
# Math-based BF% estimate using body circumferences.
# Always receives centimeters — conversion is done before calling.
# Returns a float (e.g. 18.4) or None if inputs are invalid.
# ------------------------------------------------------------

def navy_formula(
    gender: str,
    height_cm: float,
    waist_cm: float,
    neck_cm: float,
    hip_cm: float = None,
) -> float | None:
    """
    U.S. Navy Body Fat Formula.
    All inputs must be in centimeters.

    Male   → needs: height, waist, neck
    Female → needs: height, waist, neck, hip
    """
    try:
        if gender == "Male":
            # Formula breaks if waist <= neck (log of zero or negative)
            if waist_cm <= neck_cm:
                return None

            bf = (495 / (
                1.0324
                - 0.19077 * math.log10(waist_cm - neck_cm)
                + 0.15456 * math.log10(height_cm)
            )) - 450

        else:  # Female
            # Hip measurement is required for the female formula
            if hip_cm is None or (waist_cm + hip_cm) <= neck_cm:
                return None

            bf = (495 / (
                1.29579
                - 0.35004 * math.log10(waist_cm + hip_cm - neck_cm)
                + 0.22100 * math.log10(height_cm)
            )) - 450

        # Clamp to a realistic range — bad inputs can cause wild numbers
        return round(max(3.0, min(60.0, bf)), 1)

    except (ValueError, ZeroDivisionError):
        # log10 of zero or division errors from extreme inputs
        return None


# ------------------------------------------------------------
# BF% CATEGORY CLASSIFIER
# Based on ACE (American Council on Exercise) ranges.
# Returns a dict so the frontend can use both label and color.
# ------------------------------------------------------------

def get_bf_category(bf_percent: float, gender: str) -> dict:
    """
    Returns { label, color } based on BF% and gender.
    Color is a hint for the frontend UI — not enforced here.
    """
    if gender == "Male":
        if bf_percent < 6:
            return {"label": "Essential Fat", "color": "blue"}
        elif bf_percent < 14:
            return {"label": "Athlete", "color": "green"}
        elif bf_percent < 18:
            return {"label": "Fitness", "color": "lime"}
        elif bf_percent < 25:
            return {"label": "Average", "color": "orange"}
        else:
            return {"label": "Obese", "color": "red"}
    else:  # Female
        if bf_percent < 14:
            return {"label": "Essential Fat", "color": "blue"}
        elif bf_percent < 21:
            return {"label": "Athlete", "color": "green"}
        elif bf_percent < 25:
            return {"label": "Fitness", "color": "lime"}
        elif bf_percent < 32:
            return {"label": "Average", "color": "orange"}
        else:
            return {"label": "Obese", "color": "red"}


# ------------------------------------------------------------
# IMAGE → BASE64
# Used if the backend ever needs to re-encode an image.
# In the current flow the frontend sends base64 directly,
# so this is a helper kept for completeness.
# ------------------------------------------------------------

def image_to_base64(image_bytes: bytes) -> str:
    """Encodes raw image bytes to a base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")


# ------------------------------------------------------------
# GROQ VISION CALL
# Sends the base64 image + optional navy anchor to Groq.
# groq_client   → shared instance passed in from app.py
# vision_model  → configurable via GROQ_VISION_MODEL env var
# ------------------------------------------------------------

def analyze_bodyfat_with_groq(
    groq_client,
    image_b64: str,
    image_mime: str,
    gender: str,
    navy_estimate: float | None = None,
    vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
) -> str:
    """
    Calls Groq's vision model with the user's photo.

    - groq_client   : shared instance passed from app.py
    - image_b64     : base64-encoded image string from frontend
    - image_mime    : "image/jpeg" or "image/png"
    - gender        : "Male" or "Female"
    - navy_estimate : optional float — used as a cross-reference anchor
    - vision_model  : Groq vision model name, pulled from env var in app.py
    """

    # Build measurement context string injected into the user message
    if navy_estimate is not None:
        measurement_context = (
            f"Additionally, based on the user's body measurements, "
            f"the U.S. Navy Body Fat Formula estimates their body fat at "
            f"{navy_estimate}%. Use this as a cross-reference anchor — "
            f"your visual estimate should be in a similar range unless you "
            f"have strong visual evidence to differ."
        )
    else:
        measurement_context = (
            "No body measurements were provided. "
            "Base your estimate purely on visual cues, but apply all bias "
            "corrections listed in your instructions."
        )

    # System prompt with bias correction rules
    # These rules compensate for lighting, angles, and flexing artifacts
    system_prompt = """You are a professional fitness and body composition analyst.
Your job is to estimate a person's body fat percentage from a photo using visual cues
such as muscle definition, vascularity, fat distribution around the abdomen, face, and limbs.

CRITICAL ESTIMATION RULES — read these before forming any estimate:
- Strong lighting, shadows, and contrast create an illusion of lower body fat by
  enhancing muscle definition. Always adjust your estimate UPWARD by 2-4% to
  compensate for this effect.
- Overhead or downward angles exaggerate leanness and abdominal definition.
  If the photo appears to be taken from above, adjust UPWARD by an additional 1-3%.
- Flexed or tensed muscles appear more defined than at rest. Account for this.
- Skin tone, tan, and body hair can affect the appearance of definition.
- A single photo cannot capture the full picture — always give a WIDE range of
  at least 4-6 percentage points to reflect this uncertainty honestly.
- When in doubt, estimate HIGHER not lower. It is better to be conservative
  than to underestimate body fat due to flattering photo conditions.

Always:
- Give a body fat RANGE spanning at least 4-6% (e.g. "13-18%"), never a narrow range
- Explain which visual cues AND which bias corrections influenced your estimate
- State the ACE body fat category (Essential Fat / Athlete / Fitness / Average / Obese)
- Include a clear disclaimer about the +/-3-5% margin of error inherent to photo-based estimation
- Be respectful and clinical in tone — no judgmental language

Format your response clearly with these sections:
1. Estimated Body Fat Range
2. Category
3. Visual Observations & Bias Corrections Applied
4. Accuracy Disclaimer"""

    # Build the multimodal user message — image + text combined
    user_message = {
        "role": "user",
        "content": [
            {
                # Image sent as a base64 data URL
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_mime};base64,{image_b64}"
                }
            },
            {
                "type": "text",
                "text": (
                    f"Please analyze this {gender.lower()}'s body composition "
                    f"and estimate their body fat percentage. {measurement_context}"
                )
            }
        ]
    }

    # Vision model call — model name comes from app.py env var
    response = groq_client.chat.completions.create(
        model=vision_model,
        messages=[
            {"role": "system", "content": system_prompt},
            user_message,
        ],
        max_tokens=600,
        temperature=0.3,  # low temp = consistent, less hallucination-prone
    )

    return response.choices[0].message.content