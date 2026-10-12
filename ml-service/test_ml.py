import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.model import pipeline_instance

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "Random Forest" in data["models_available"]

def test_model_info():
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["active_model"] == "Random Forest"
    assert len(data["comparison_table"]) == 3
    # Ensure all 3 models are evaluated
    model_names = [m["model_name"] for m in data["comparison_table"]]
    assert "Logistic Regression" in model_names
    assert "Decision Tree" in model_names
    assert "Random Forest" in model_names
    # Check that accuracy and ROC-AUC are valid numbers > 0.5
    for m in data["comparison_table"]:
        assert m["accuracy"] > 0.5
        assert m["roc_auc"] > 0.5

def test_predict_low_risk_student():
    payload = {
        "students": [
            {
                "student_id": "22221A0501",
                "attendance_percentage": 92.5,
                "internal_test_avg": 88.0,
                "assignment_completion_rate": 95.0,
                "previous_cgpa": 8.75,
                "backlog_count": 0,
                "trend_score": 10.0
            }
        ]
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["predictions"]) == 1
    pred = data["predictions"][0]
    assert pred["student_id"] == "22221A0501"
    assert pred["risk_category"] == "Low"
    assert pred["risk_score"] < 0.4
    assert len(pred["factors"]) > 0

def test_predict_high_risk_student():
    payload = {
        "students": [
            {
                "student_id": "22221A0555",
                "attendance_percentage": 48.0,
                "internal_test_avg": 32.0,
                "assignment_completion_rate": 40.0,
                "previous_cgpa": 4.8,
                "backlog_count": 3,
                "trend_score": -22.0
            }
        ]
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    pred = data["predictions"][0]
    assert pred["student_id"] == "22221A0555"
    assert pred["risk_category"] == "High"
    assert pred["risk_score"] > 0.5
    # Factors should explain attendance shortage and mid-term marks
    explanation_text = " ".join(pred["factors"]).lower()
    assert "attendance" in explanation_text or "mid-term" in explanation_text

def test_validation_rejects_empty_students():
    response = client.post("/predict", json={"students": []})
    assert response.status_code == 400
