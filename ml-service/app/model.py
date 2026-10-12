import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score
)

FEATURE_NAMES = [
    "attendance_percentage",
    "internal_test_avg",
    "assignment_completion_rate",
    "previous_cgpa",
    "backlog_count",
    "trend_score"
]

RISK_CLASSES = ["Low", "Moderate", "High"]

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "campus_risk_model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "evaluation_metrics.joblib")


def generate_synthetic_dataset(n_samples: int = 1200, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset reflecting Indian engineering college (BVC CSE)
    student academic behavior, attendance habits, internal scores, backlogs, and outcomes.
    """
    np.random.seed(random_seed)

    # 1. Attendance (typically beta-distributed centered around 78% with variance)
    att_raw = np.random.beta(a=6, b=2, size=n_samples) * 100
    attendance = np.clip(att_raw, 35.0, 99.5)

    # 2. Previous CGPA (normally distributed ~7.3, min 4.0, max 9.9)
    cgpa_raw = np.random.normal(loc=7.2, scale=1.3, size=n_samples)
    previous_cgpa = np.clip(cgpa_raw, 4.0, 9.9)

    # 3. Internal test avg (correlated with attendance & CGPA + noise)
    internal_noise = np.random.normal(0, 10, n_samples)
    internal_avg = 0.45 * attendance + 4.5 * previous_cgpa + internal_noise
    internal_test_avg = np.clip(internal_avg, 20.0, 98.0)

    # 4. Assignment completion (correlated with attendance)
    assign_noise = np.random.normal(0, 12, n_samples)
    assignment_rate = 0.7 * attendance + 20 + assign_noise
    assignment_completion_rate = np.clip(assignment_rate, 25.0, 100.0)

    # 5. Backlog count (Poisson distributed, higher for lower CGPA)
    backlog_lambda = np.clip(2.5 - (previous_cgpa - 4.0) * 0.45, 0.05, 4.0)
    backlog_count = np.random.poisson(lam=backlog_lambda)
    backlog_count = np.clip(backlog_count, 0, 6)

    # 6. Trend score (-35% to +35% change in recent performance)
    trend_score = np.random.normal(loc=0.5, scale=12.0, size=n_samples)
    trend_score = np.clip(trend_score, -40.0, 40.0)

    # 7. Construct Academic Risk Label (0: Low, 1: Moderate, 2: High)
    # Risk points formula grounded in educational benchmarks:
    # - Attendance < 75 is JNTUK statutory condition
    # - Internal < 40 is pass threshold failure risk
    risk_points = np.zeros(n_samples)

    risk_points += np.where(attendance < 65.0, 3.5, np.where(attendance < 75.0, 1.8, 0.0))
    risk_points += np.where(internal_test_avg < 40.0, 4.0, np.where(internal_test_avg < 55.0, 1.8, 0.0))
    risk_points += np.where(assignment_completion_rate < 60.0, 1.8, np.where(assignment_completion_rate < 75.0, 0.8, 0.0))
    risk_points += np.where(previous_cgpa < 5.5, 3.0, np.where(previous_cgpa < 6.5, 1.5, 0.0))
    risk_points += backlog_count * 1.5
    risk_points += np.where(trend_score < -15.0, 2.5, np.where(trend_score < -5.0, 1.2, 0.0))

    # Add realistic stochastic variation
    noise = np.random.normal(0, 0.8, n_samples)
    total_risk = risk_points + noise

    labels = np.zeros(n_samples, dtype=int)
    labels[total_risk >= 5.5] = 2  # High Risk
    labels[(total_risk >= 2.5) & (total_risk < 5.5)] = 1  # Moderate Risk
    labels[total_risk < 2.5] = 0  # Low Risk

    df = pd.DataFrame({
        "attendance_percentage": np.round(attendance, 1),
        "internal_test_avg": np.round(internal_test_avg, 1),
        "assignment_completion_rate": np.round(assignment_completion_rate, 1),
        "previous_cgpa": np.round(previous_cgpa, 2),
        "backlog_count": backlog_count,
        "trend_score": np.round(trend_score, 1),
        "academic_risk": labels
    })

    return df


class CampusRiskPipeline:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.active_model_name: str = "Random Forest"
        self.metrics: Dict[str, Any] = {}
        self.trained_at: str = ""
        self.sample_size: int = 0
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.load_or_train()

    def train_and_evaluate(self, n_samples: int = 1200) -> Dict[str, Any]:
        """
        Trains and compares 3 models:
        1. Logistic Regression (Baseline linear classifier with calibrated probabilities)
        2. Decision Tree (Interpretable rule-based classifier)
        3. Random Forest (Ensemble classifier with high generalizability)
        """
        df = generate_synthetic_dataset(n_samples=n_samples)
        self.sample_size = len(df)
        X = df[FEATURE_NAMES]
        y = df["academic_risk"]

        # Stratified train/test split (80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        candidates = {
            "Logistic Regression": Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=1000, random_state=42))
            ]),
            "Decision Tree": Pipeline([
                ("clf", DecisionTreeClassifier(max_depth=5, min_samples_leaf=10, random_state=42))
            ]),
            "Random Forest": Pipeline([
                ("clf", RandomForestClassifier(n_estimators=120, max_depth=6, min_samples_leaf=5, random_state=42))
            ])
        }

        results = {}
        fitted_models = {}

        for name, pipeline in candidates.items():
            pipeline.fit(X_train, y_train)
            fitted_models[name] = pipeline

            y_pred = pipeline.predict(X_test)
            y_prob = pipeline.predict_proba(X_test)

            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
            rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
            f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
            cm = confusion_matrix(y_test, y_pred).tolist()

            try:
                auc = float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted"))
            except Exception:
                auc = 0.0

            # Extract feature importances if available
            feat_imp = {}
            if hasattr(pipeline.named_steps["clf"], "feature_importances_"):
                importances = pipeline.named_steps["clf"].feature_importances_
                feat_imp = {feat: float(np.round(imp, 4)) for feat, imp in zip(FEATURE_NAMES, importances)}
            elif hasattr(pipeline.named_steps["clf"], "coef_"):
                coefs = np.mean(np.abs(pipeline.named_steps["clf"].coef_), axis=0)
                feat_imp = {feat: float(np.round(c, 4)) for feat, c in zip(FEATURE_NAMES, coefs)}

            results[name] = {
                "model_name": name,
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(auc, 4),
                "confusion_matrix": cm,
                "feature_importances": feat_imp
            }

        self.models = fitted_models
        self.metrics = results
        self.trained_at = datetime.utcnow().isoformat() + "Z"
        self.active_model_name = "Random Forest"

        # Persist artifacts
        joblib.dump({
            "models": self.models,
            "active_model_name": self.active_model_name,
            "metrics": self.metrics,
            "trained_at": self.trained_at,
            "sample_size": self.sample_size
        }, MODEL_PATH)

        return results

    def load_or_train(self):
        """Loads cached models if available, otherwise trains afresh."""
        if os.path.exists(MODEL_PATH):
            try:
                data = joblib.load(MODEL_PATH)
                self.models = data["models"]
                self.active_model_name = data.get("active_model_name", "Random Forest")
                self.metrics = data["metrics"]
                self.trained_at = data.get("trained_at", datetime.utcnow().isoformat() + "Z")
                self.sample_size = data.get("sample_size", 1200)
                return
            except Exception as e:
                print(f"[CampusRiskPipeline] Warning: Failed to load existing model: {e}. Retraining...")

        self.train_and_evaluate()

    def explain_factors(self, student_dict: Dict[str, Any]) -> List[str]:
        """
        Generates explainable, verifiable factors for why this student was classified
        with their given risk level. Grounded strictly in student's academic record.
        """
        factors = []
        att = student_dict.get("attendance_percentage", 100.0)
        internal = student_dict.get("internal_test_avg", 100.0)
        backlogs = student_dict.get("backlog_count", 0)
        cgpa = student_dict.get("previous_cgpa", 8.0)
        assign = student_dict.get("assignment_completion_rate", 100.0)
        trend = student_dict.get("trend_score", 0.0)

        if att < 65.0:
            factors.append(f"Severe attendance shortage at {att:.1f}% (critical: university condonation threshold is 75%)")
        elif att < 75.0:
            factors.append(f"Attendance is {att:.1f}%, which is below the mandatory 75% cutoff")

        if internal < 40.0:
            factors.append(f"Mid-term examination average ({internal:.1f}%) is below minimum passing threshold (40%)")
        elif internal < 55.0:
            factors.append(f"Internal assessment marks ({internal:.1f}%) fall in the borderline range (<55%)")

        if backlogs >= 2:
            factors.append(f"Student has {backlogs} active backlogs requiring remedial faculty support")
        elif backlogs == 1:
            factors.append("Student has 1 active backlog from previous semester")

        if assign < 65.0:
            factors.append(f"Assignment completion rate is low ({assign:.1f}%), indicating low continuous engagement")

        if trend <= -15.0:
            factors.append(f"Recent assessment performance declined sharply by {abs(trend):.1f}%")
        elif trend < -5.0:
            factors.append(f"Gradual downward performance trajectory ({trend:.1f}%) observed")

        if cgpa < 5.5:
            factors.append(f"Cumulative GPA ({cgpa:.2f}) indicates prolonged academic vulnerability")

        if not factors:
            factors.append("Consistent attendance, satisfactory mid-term marks, and no active backlogs.")

        return factors

    def predict_one(self, student_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs inference for a single student features dictionary.
        Returns risk score, category, predicted label, confidence, raw probabilities, and factors.
        """
        active_pipeline = self.models.get(self.active_model_name)
        if not active_pipeline:
            raise RuntimeError(f"Active model '{self.active_model_name}' is not loaded.")

        row = [
            student_dict.get("attendance_percentage", 75.0),
            student_dict.get("internal_test_avg", 65.0),
            student_dict.get("assignment_completion_rate", 80.0),
            student_dict.get("previous_cgpa", 7.0),
            student_dict.get("backlog_count", 0),
            student_dict.get("trend_score", 0.0)
        ]

        X_input = pd.DataFrame([row], columns=FEATURE_NAMES)
        probs = active_pipeline.predict_proba(X_input)[0]
        pred_label = int(np.argmax(probs))
        confidence = float(np.max(probs))

        # Risk score calculation: weighted probability of moderate (1) and high (2) risk
        # 0.0 -> lowest possible risk, 1.0 -> highest possible risk
        risk_score = float(round(probs[1] * 0.45 + probs[2] * 1.0, 4))

        category = RISK_CLASSES[pred_label]
        factors = self.explain_factors(student_dict)

        raw_probs = {
            "Low": float(round(probs[0], 4)),
            "Moderate": float(round(probs[1], 4)),
            "High": float(round(probs[2], 4))
        }

        return {
            "student_id": student_dict.get("student_id"),
            "risk_score": risk_score,
            "risk_category": category,
            "predicted_label": pred_label,
            "confidence": round(confidence, 4),
            "factors": factors,
            "raw_probabilities": raw_probs
        }


# Global singleton instance
pipeline_instance = CampusRiskPipeline()
