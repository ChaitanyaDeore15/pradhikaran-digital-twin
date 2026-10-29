import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app, text_classifier_pipeline, predict_risk, RiskPredictionRequest

def test_ai_pipeline():
    print("Testing text classification pipeline...")
    sample = "Deep pothole on Krantisinha Nana Patil road near Gate 2"
    pred = text_classifier_pipeline.predict([sample])[0]
    print(f"Sample: '{sample}'")
    print(f"Predicted Category: {pred}")
    assert pred == "pothole", f"Expected pothole, got {pred}"

    print("\nTesting risk prediction model...")
    risk_req = RiskPredictionRequest(
        asset_id="asset-rd-krantisinha-patil",
        asset_type="road",
        road_class="secondary",
        age_years=4.0,
        complaint_count=3,
        recent_severity_sum=6.0,
        condition_rating="DEGRADED"
    )
    risk_res = predict_risk(risk_req)
    print(f"Risk Score: {risk_res.risk_score}, Category: {risk_res.risk_category}")
    print(f"Suggested Action: {risk_res.suggested_action}")
    assert risk_res.risk_score > 60.0, "Expected elevated risk score for degraded road"
    print("\nALL AI TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_ai_pipeline()
