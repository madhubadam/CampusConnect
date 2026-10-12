"""
CampusConnect ML Standalone Training CLI
Trains and validates 3 machine learning models (Logistic Regression, Decision Tree, Random Forest)
on synthetic BVC CSE engineering academic records.
"""
import sys
import os

# Add ml-service root to pythonpath
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.model import CampusRiskPipeline

def main():
    print("=" * 65)
    print(" CampusConnect: Training Academic Risk Prediction Pipeline ")
    print("=" * 65)
    pipeline = CampusRiskPipeline()
    print("[1/3] Generating synthetic engineering student dataset (1200 records)...")
    results = pipeline.train_and_evaluate(n_samples=1200)

    print("\n[2/3] Model Comparison Evaluation Table:")
    print("-" * 75)
    header = f"{'Model':<22} | {'Accuracy':<9} | {'Precision':<9} | {'Recall':<8} | {'F1':<8} | {'ROC-AUC':<8}"
    print(header)
    print("-" * 75)
    for model_name, m in results.items():
        print(f"{model_name:<22} | {m['accuracy']:<9.4f} | {m['precision']:<9.4f} | {m['recall']:<8.4f} | {m['f1_score']:<8.4f} | {m['roc_auc']:<8.4f}")
    print("-" * 75)

    print("\n[3/3] Feature Importances (Random Forest):")
    rf_metrics = results.get("Random Forest", {})
    for feat, imp in rf_metrics.get("feature_importances", {}).items():
        print(f"  * {feat:<28}: {imp:.4f} ({imp*100:.1f}%)")

    print("\n[SUCCESS] Pipeline trained, models persisted to models/campus_risk_model.joblib successfully!")

if __name__ == "__main__":
    main()
