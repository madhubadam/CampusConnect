from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StudentFeatures(BaseModel):
    student_id: Optional[str] = Field(None, description="Unique roll number or student ID")
    attendance_percentage: float = Field(..., ge=0.0, le=100.0, description="Overall attendance percentage")
    internal_test_avg: float = Field(..., ge=0.0, le=100.0, description="Average marks in mid/internal exams (0-100)")
    assignment_completion_rate: float = Field(..., ge=0.0, le=100.0, description="Rate of assignment completion (0-100)")
    previous_cgpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative Grade Point Average (0-10)")
    backlog_count: int = Field(0, ge=0, description="Number of currently active backlogs")
    trend_score: float = Field(0.0, ge=-100.0, le=100.0, description="Performance trajectory percentage delta (-100 to +100)")

class PredictRequest(BaseModel):
    students: List[StudentFeatures]

class PredictionResult(BaseModel):
    student_id: Optional[str]
    risk_score: float
    risk_category: str  # "Low", "Moderate", "High"
    predicted_label: int  # 0: Low, 1: Moderate, 2: High
    confidence: float
    factors: List[str]
    raw_probabilities: Dict[str, float]

class PredictResponse(BaseModel):
    success: bool
    model_used: str
    count: int
    predictions: List[PredictionResult]

class ModelMetric(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    feature_importances: Optional[Dict[str, float]] = None

class ModelInfoResponse(BaseModel):
    status: str
    active_model: str
    trained_at: str
    feature_names: List[str]
    risk_classes: List[str]
    comparison_table: List[ModelMetric]
    sample_size: int

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    models_available: List[str]
