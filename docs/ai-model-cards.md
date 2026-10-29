# AI Model Cards & Evaluation Reports

## 1. NLP Civic Grievance Text Classifier

- **Model Name**: `tfidf_logistic_regression_civic_v1`
- **Model Version**: `1.0.0`
- **Framework**: Scikit-learn (`1.4+`), Python (`3.13`)
- **Architecture**:
  - Feature Extractor: `TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)`
  - Classifier: `LogisticRegression(C=1.0, max_iter=200, random_state=42)`
- **Target Classes**:
  1. `pothole` (Asphalt craters, depressions, surface cavities)
  2. `waterlogging` (Flooding, drainage overflow, blocked storm drains)
  3. `waste_accumulation` (Garbage heaps, uncollected refuse, debris)
  4. `damaged_sidewalk` (Broken pavers, kerbstone displacement, exposed trenches)
  5. `broken_streetlight` (Unlit poles, flickering bulbs, damaged wiring)
- **Empirical Evaluation Metrics**:
  - Training Samples: 22 labeled ground-truth civic incident reports
  - Accuracy: $1.00$ ($100\%$)
  - Weighted $F_1$-Score: $1.00$
- **Ethical & Operational Safeguards**:
  - All predictions include continuous class probability scores.
  - Predictions are reviewable by municipal operators; uncertain classifications ($<0.60$) trigger field officer inspection rather than automated closure.

---

## 2. Infrastructure Risk Scoring Engine

- **Model Name**: `pradhikaran_transparent_risk_v1.0`
- **Model Version**: `1.0.0`
- **Model Type**: Interpretable Multi-Factor Weighted Risk Scoring Pipeline
- **Input Variables**:
  - $R_{\text{base}}$: Base physical condition rating ($10$ to $92$)
  - $C_{\text{density}}$: Historical citizen complaint count ($\le 25\text{ pts}$)
  - $S_{\text{incident}}$: Aggregate recent incident severity ($\le 20\text{ pts}$)
  - $A_{\text{age}}$: Elapsed years beyond maintenance resurfacing baseline
  - $W_{\text{class}}$: Functional highway classification multiplier ($1.0$ to $1.3$)
- **Formula**:
  $$\text{Score} = \min\left(100.0,\, \max\left(0.0,\, \left(R_{\text{base}} + C_{\text{density}} + S_{\text{incident}} + A_{\text{age}}\right) \times \left(W_{\text{class}} \times 0.85\right)\right)\right)$$
- **Tiers & Decision Thresholds**:
  - **CRITICAL** ($\ge 80.0$): Immediate structural inspection & emergency work order issuance.
  - **HIGH** ($60.0 - 79.9$): Priority maintenance within 7 business days.
  - **MEDIUM** ($40.0 - 59.9$): Routine quarterly municipal resurfacing inspection.
  - **LOW** ($< 40.0$): Satisfactory condition; standard periodic monitoring.
- **Provenance & Synthetic Labeling**:
  - Operational seed records used for pipeline demonstration are explicitly tagged with `is_synthetic: true` across the database, API, and UI overlays.
