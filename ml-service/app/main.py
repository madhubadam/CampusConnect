from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from .schemas import (
    PredictRequest,
    PredictResponse,
    PredictionResult,
    ModelInfoResponse,
    HealthResponse,
    ModelMetric
)
from .model import pipeline_instance, FEATURE_NAMES, RISK_CLASSES

app = FastAPI(
    title="CampusConnect ML Service",
    description="Explainable Machine Learning Student Academic Risk Prediction Service for BVC Engineering College",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="CampusConnect Risk Analytics Engine",
        version="1.0.0",
        model_loaded=bool(pipeline_instance.models),
        models_available=list(pipeline_instance.models.keys())
    )

@app.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    comparison_table = [
        ModelMetric(**metric_dict)
        for metric_dict in pipeline_instance.metrics.values()
    ]
    return ModelInfoResponse(
        status="active",
        active_model=pipeline_instance.active_model_name,
        trained_at=pipeline_instance.trained_at,
        feature_names=FEATURE_NAMES,
        risk_classes=RISK_CLASSES,
        comparison_table=comparison_table,
        sample_size=pipeline_instance.sample_size
    )

@app.post("/predict", response_model=PredictResponse)
def predict_risk(request: PredictRequest):
    if not request.students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student list cannot be empty for prediction."
        )

    predictions: List[PredictionResult] = []
    for student in request.students:
        res = pipeline_instance.predict_one(student.model_dump())
        predictions.append(PredictionResult(**res))

    return PredictResponse(
        success=True,
        model_used=pipeline_instance.active_model_name,
        count=len(predictions),
        predictions=predictions
    )

@app.post("/evaluate", response_model=ModelInfoResponse)
def retrain_and_evaluate():
    """
    Authorized training endpoint that runs reproducible training pipeline,
    computes test metrics, and updates persistent model state.
    """
    pipeline_instance.train_and_evaluate(n_samples=1200)
    return get_model_info()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
