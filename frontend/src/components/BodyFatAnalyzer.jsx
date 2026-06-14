import { useRef, useState } from "react";

import useScrollReveal from "../hooks/useScrollReveal";
import "./BodyFatAnalyzer.css";

/*
  Local development uses FastAPI on port 8000.
  Production requests are routed to the Vercel backend.
*/
const API_BASE = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/__backend";

/*
  Extracts the percentage, explanation, and disclaimer
  from the formatted response returned by the AI model.
*/
function parseAiResult(aiResult = "") {
  const estimateMatch =
    aiResult.match(/ESTIMATE:\s*(\d+(?:\.\d+)?)\s*%/i) ||
    aiResult.match(/(\d+(?:\.\d+)?)\s*%/);

  const whyMatch = aiResult.match(
    /WHY:\s*(.*?)(?=\nDISCLAIMER:|$)/is
  );

  const disclaimerMatch = aiResult.match(
    /DISCLAIMER:\s*(.*)$/is
  );

  return {
    percentage: estimateMatch?.[1] || null,

    reason:
      whyMatch?.[1]?.trim() ||
      "This estimate is based on visible muscular definition, fat distribution, and overall conditioning.",

    disclaimer:
      disclaimerMatch?.[1]?.trim() ||
      "This visual estimate may be off by around 3–5%, but it provides a useful general estimate.",
  };
}

/* Converts imperial measurements into centimeters */
const feetInchesToCm = (feet, inches) =>
  ((feet * 12) + inches) * 2.54;

const inchesToCm = (inches) => inches * 2.54;

export default function BodyFatAnalyzer() {
  /* Reveals the section when it enters the viewport */
  const { elementRef, isVisible } = useScrollReveal();

  /* Step 1: Basic user information */
  const [gender, setGender] = useState("Male");
  const [unitSystem, setUnitSystem] = useState("metric");

  /* Step 2: Uploaded photo data */
  const [imageB64, setImageB64] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

  /* Step 3: Optional measurements */
  const [showMeasurements, setShowMeasurements] =
    useState(false);

  /* Metric values */
  const [heightCm, setHeightCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [neckCm, setNeckCm] = useState("");
  const [hipCm, setHipCm] = useState("");

  /* Imperial values */
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [waistIn, setWaistIn] = useState("");
  const [neckIn, setNeckIn] = useState("");
  const [hipIn, setHipIn] = useState("");

  /* Step 4: Request and result states */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [navyResult, setNavyResult] = useState(null);
  const [category, setCategory] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);

  /*
    Creates an image preview and converts the image to
    raw base64 so it can be sent to FastAPI.
  */
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const mime =
      file.type === "image/png"
        ? "image/png"
        : "image/jpeg";

    setImageMime(mime);

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result;

      if (typeof dataUrl !== "string") {
        setError("The selected image could not be read.");
        return;
      }

      /*
        Removes "data:image/...;base64," because the backend
        expects only the raw base64 characters.
      */
      const base64 = dataUrl.split(",")[1];

      if (!base64) {
        setError("The selected image could not be processed.");
        return;
      }

      setImageB64(base64);
      setError(null);
    };

    reader.onerror = () => {
      setError("The selected image could not be read.");
    };

    reader.readAsDataURL(file);
  };

  /* Removes only the currently uploaded photo */
  const handleRemovePhoto = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageB64("");
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* Clears the photo, measurements, and generated results */
  const handleReset = () => {
    handleRemovePhoto();

    setNavyResult(null);
    setCategory(null);
    setAiResult(null);
    setAnalyzed(false);
    setError(null);

    setHeightCm("");
    setWaistCm("");
    setNeckCm("");
    setHipCm("");

    setHeightFt("");
    setHeightIn("");
    setWaistIn("");
    setNeckIn("");
    setHipIn("");
  };

  /*
    Converts measurements when needed, sends the request
    to FastAPI, then stores the Navy and AI results.
  */
  const handleAnalyze = async () => {
    if (!imageB64 || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setAnalyzed(false);

    let finalHeightCm = null;
    let finalWaistCm = null;
    let finalNeckCm = null;
    let finalHipCm = null;

    /* Only send measurements when the section is enabled */
    if (showMeasurements) {
      if (unitSystem === "imperial") {
        const feet = parseFloat(heightFt) || 0;
        const inches = parseFloat(heightIn) || 0;

        finalHeightCm =
          feet || inches
            ? feetInchesToCm(feet, inches)
            : null;

        finalWaistCm = waistIn
          ? inchesToCm(parseFloat(waistIn))
          : null;

        finalNeckCm = neckIn
          ? inchesToCm(parseFloat(neckIn))
          : null;

        finalHipCm = hipIn
          ? inchesToCm(parseFloat(hipIn))
          : null;
      } else {
        finalHeightCm = heightCm
          ? parseFloat(heightCm)
          : null;

        finalWaistCm = waistCm
          ? parseFloat(waistCm)
          : null;

        finalNeckCm = neckCm
          ? parseFloat(neckCm)
          : null;

        finalHipCm = hipCm
          ? parseFloat(hipCm)
          : null;
      }
    }

    try {
      /* Sends the photo and optional measurements to FastAPI */
      const response = await fetch(
        `${API_BASE}/analyze-bodyfat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gender,
            image_b64: imageB64,
            image_mime: imageMime,
            height_cm: finalHeightCm,
            waist_cm: finalWaistCm,
            neck_cm: finalNeckCm,
            hip_cm: finalHipCm,
          }),
        }
      );

      if (!response.ok) {
        let message = "Analysis failed.";

        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          message = `Analysis failed with status ${response.status}.`;
        }

        throw new Error(message);
      }

      /* Saves the backend response for display */
      const data = await response.json();

      setNavyResult(data.navy_result ?? null);
      setCategory(data.category ?? null);
      setAiResult(data.ai_result ?? "");
      setAnalyzed(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* Converts the backend category color into a CSS class */
  const categoryColorClass = {
    blue: "cat-blue",
    green: "cat-green",
    lime: "cat-lime",
    orange: "cat-orange",
    red: "cat-red",
  };

  /* Prepares the AI text for the highlighted result layout */
  const aiAnalysis = aiResult
    ? parseAiResult(aiResult)
    : null;

  return (
    <section
      id="bodyfat"
      ref={elementRef}
      className={isVisible ? "is-visible" : ""}
    >
      <div className="container">
        {/* Section heading */}
        <div className="section-label">AI Tool</div>

        <h2 className="section-title">
          Body Fat <em>Analyzer</em>
        </h2>

        <p className="bf-subtitle">
          Upload a photo and let Coach E estimate your body fat
          percentage. Add your measurements for a more accurate
          result.
        </p>

        {/* Accuracy disclaimer */}
        <div className="bf-disclaimer">
          <span>
            AI-based estimate only — not a medical measurement.
            Always apply{" "}
            <strong>±3–5% margin of error</strong> to any result.
            For clinical accuracy, use DEXA or hydrostatic
            weighing.
          </span>
        </div>

        <div className="bf-layout">
          {/* Left column: user inputs */}
          <div className="bf-inputs">
            {/* Step 1: Basic information */}
            <div className="bf-card">
              <div className="bf-step-label">
                Step 1 — Basic Info
              </div>

              <div className="bf-radio-group">
                <span className="bf-field-label">
                  Biological sex
                </span>

                <div className="bf-radios">
                  {["Male", "Female"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`bf-radio-btn ${
                        gender === option ? "active" : ""
                      }`}
                      onClick={() => setGender(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bf-radio-group">
                <span className="bf-field-label">
                  Unit system
                </span>

                <div className="bf-radios">
                  <button
                    type="button"
                    className={`bf-radio-btn ${
                      unitSystem === "metric"
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setUnitSystem("metric")}
                  >
                    Metric (cm)
                  </button>

                  <button
                    type="button"
                    className={`bf-radio-btn ${
                      unitSystem === "imperial"
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setUnitSystem("imperial")}
                  >
                    Imperial (ft/in)
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Photo upload */}
            <div className="bf-card">
              <div className="bf-step-label">
                Step 2 — Upload Photo
              </div>

              <p className="bf-card-hint">
                A full-body photo with good lighting and minimal
                clothing provides the best estimate.
              </p>

              <div
                className={`bf-dropzone ${
                  imagePreview ? "has-image" : ""
                }`}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected body-fat analysis preview"
                    className="bf-preview"
                  />
                ) : (
                  <>
                    <div className="bf-upload-icon">📷</div>

                    <div className="bf-upload-text">
                      Click to upload photo
                    </div>

                    <div className="bf-upload-hint">
                      JPG or PNG
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />

              {imagePreview && (
                <button
                  type="button"
                  className="bf-clear-photo"
                  onClick={handleRemovePhoto}
                >
                  ✕ Remove photo
                </button>
              )}
            </div>

            {/* Step 3: Optional measurements */}
            <div className="bf-card">
              <button
                type="button"
                className="bf-collapse-toggle"
                onClick={() =>
                  setShowMeasurements(
                    (currentValue) => !currentValue
                  )
                }
                aria-expanded={showMeasurements}
              >
                <span
                  className="bf-step-label"
                  style={{ margin: 0 }}
                >
                  Step 3 — Measurements

                  <span className="bf-optional-tag">
                    optional but recommended
                  </span>
                </span>

                <span
                  className={`bf-chevron ${
                    showMeasurements ? "open" : ""
                  }`}
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>

              {showMeasurements && (
                <div className="bf-measurements">
                  <p className="bf-card-hint">
                    {unitSystem === "imperial"
                      ? "Enter height in feet and inches, and circumferences in inches."
                      : "Enter all measurements in centimeters."}
                  </p>

                  {/* Height inputs */}
                  {unitSystem === "imperial" ? (
                    <div className="bf-input-row">
                      <div className="bf-input-group">
                        <label
                          className="bf-label"
                          htmlFor="bf-height-ft"
                        >
                          Height — ft
                        </label>

                        <input
                          id="bf-height-ft"
                          className="bf-input"
                          type="number"
                          min="0"
                          max="8"
                          step="1"
                          placeholder="5"
                          value={heightFt}
                          onChange={(event) =>
                            setHeightFt(event.target.value)
                          }
                        />
                      </div>

                      <div className="bf-input-group">
                        <label
                          className="bf-label"
                          htmlFor="bf-height-in"
                        >
                          Height — in
                        </label>

                        <input
                          id="bf-height-in"
                          className="bf-input"
                          type="number"
                          min="0"
                          max="11"
                          step="0.5"
                          placeholder="10"
                          value={heightIn}
                          onChange={(event) =>
                            setHeightIn(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bf-input-group">
                      <label
                        className="bf-label"
                        htmlFor="bf-height-cm"
                      >
                        Height (cm)
                      </label>

                      <input
                        id="bf-height-cm"
                        className="bf-input"
                        type="number"
                        min="0"
                        max="250"
                        step="0.5"
                        placeholder="175"
                        value={heightCm}
                        onChange={(event) =>
                          setHeightCm(event.target.value)
                        }
                      />
                    </div>
                  )}

                  {/* Waist and neck inputs */}
                  <div className="bf-input-row">
                    <div className="bf-input-group">
                      <label
                        className="bf-label"
                        htmlFor="bf-waist"
                      >
                        Waist (
                        {unitSystem === "imperial"
                          ? "in"
                          : "cm"}
                        )
                      </label>

                      <input
                        id="bf-waist"
                        className="bf-input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder={
                          unitSystem === "imperial"
                            ? "32"
                            : "82"
                        }
                        value={
                          unitSystem === "imperial"
                            ? waistIn
                            : waistCm
                        }
                        onChange={(event) =>
                          unitSystem === "imperial"
                            ? setWaistIn(event.target.value)
                            : setWaistCm(event.target.value)
                        }
                      />
                    </div>

                    <div className="bf-input-group">
                      <label
                        className="bf-label"
                        htmlFor="bf-neck"
                      >
                        Neck (
                        {unitSystem === "imperial"
                          ? "in"
                          : "cm"}
                        )
                      </label>

                      <input
                        id="bf-neck"
                        className="bf-input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder={
                          unitSystem === "imperial"
                            ? "15"
                            : "38"
                        }
                        value={
                          unitSystem === "imperial"
                            ? neckIn
                            : neckCm
                        }
                        onChange={(event) =>
                          unitSystem === "imperial"
                            ? setNeckIn(event.target.value)
                            : setNeckCm(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Female Navy Formula also requires hip size */}
                  {gender === "Female" && (
                    <div className="bf-input-group">
                      <label
                        className="bf-label"
                        htmlFor="bf-hip"
                      >
                        Hip (
                        {unitSystem === "imperial"
                          ? "in"
                          : "cm"}
                        )

                        <span className="bf-field-note">
                          widest point
                        </span>
                      </label>

                      <input
                        id="bf-hip"
                        className="bf-input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder={
                          unitSystem === "imperial"
                            ? "38"
                            : "96"
                        }
                        value={
                          unitSystem === "imperial"
                            ? hipIn
                            : hipCm
                        }
                        onChange={(event) =>
                          unitSystem === "imperial"
                            ? setHipIn(event.target.value)
                            : setHipCm(event.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Submit analysis */}
            <div className="bf-card">
              <div className="bf-step-label">
                Step 4 — Analyze
              </div>

              <button
                type="button"
                className="bf-analyze-btn"
                onClick={handleAnalyze}
                disabled={!imageB64 || loading}
              >
                {loading ? (
                  <span className="bf-loading-text">
                    <span
                      className="bf-spinner"
                      aria-hidden="true"
                    />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze My Body Fat"
                )}
              </button>

              {!imageB64 && (
                <p
                  className="bf-card-hint"
                  style={{
                    marginTop: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  Upload a photo above to enable analysis.
                </p>
              )}

              {error && (
                <div className="bf-error">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right column: generated results */}
          <div className="bf-results-col">
            {!analyzed && !loading && (
              <div className="bf-results-placeholder">
                <div className="bf-placeholder-icon">
                  📊
                </div>

                <p>
                  Your results will appear here after analysis.
                </p>
              </div>
            )}

            {loading && (
              <div className="bf-results-placeholder">
                <div
                  className="bf-pulse-ring"
                  aria-hidden="true"
                />

                <p>
                  Analyzing your photo...
                  <br />
                  This takes a few seconds.
                </p>
              </div>
            )}

            {analyzed && !loading && (
              <div className="bf-results">
                {/* Measurement-based Navy Formula result */}
                {navyResult !== null && category && (
                  <div className="bf-result-card">
                    <div className="bf-result-card-label">
                      Navy Formula Estimate
                    </div>

                    <div className="bf-metrics-row">
                      <div className="bf-metric">
                        <div className="bf-metric-value">
                          {navyResult}%
                        </div>

                        <div className="bf-metric-label">
                          Body Fat
                        </div>
                      </div>

                      <div className="bf-metric">
                        <div
                          className={`bf-metric-value ${
                            categoryColorClass[
                              category.color
                            ] || ""
                          }`}
                        >
                          {category.label}
                        </div>

                        <div className="bf-metric-label">
                          ACE Category
                        </div>
                      </div>
                    </div>

                    <p className="bf-result-note">
                      Math-based estimate calculated from your
                      measurements.
                    </p>
                  </div>
                )}

                {/* AI visual estimate with highlighted percentage */}
                {aiAnalysis && (
                  <div className="bf-result-card">
                    <div className="bf-result-card-label">
                      AI Visual Analysis
                    </div>

                    <div className="bf-ai-summary">
                      <div className="bf-ai-percentage">
                        {aiAnalysis.percentage ? (
                          <>
                            {aiAnalysis.percentage}
                            <span>%</span>
                          </>
                        ) : (
                          "Estimate"
                        )}
                      </div>

                      <div className="bf-ai-details">
                        <p className="bf-ai-reason">
                          {aiAnalysis.reason}
                        </p>

                        <p className="bf-ai-disclaimer">
                          {aiAnalysis.disclaimer}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results stay only in the current browser session */}
                <div className="bf-save-warning">
                  Results are not saved. Take a screenshot if
                  you want to keep them.
                </div>

                <button
                  type="button"
                  className="bf-reset-btn"
                  onClick={handleReset}
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Separates Body Fat Analyzer from the Contact section */}
      <div
        className="bf-bottom-divider"
        aria-hidden="true"
      />
    </section>
  );
}