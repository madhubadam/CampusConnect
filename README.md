# CampusConnect: Smart College Management and Student Risk Analytics System

> **Institution**: Bonam Venkata Chalamaya Engineering College (BVC)  
> **Department**: Computer Science and Engineering (CSE)  
> **Academic Structure**: III Year CSE (Section A, Section B, Section C — 60 Students per Section &bull; 30 Boys, 30 Girls &bull; 180 Total)  
> **All initial records**: Explicitly marked as synthetic demonstration data (`DEMONSTRATION_SYNTHETIC_DATA`).

---

## 1. Project Overview & Architecture

CampusConnect is a production-style college management web platform engineered for engineering institutions. It features role-based access control (Student, Faculty, Department HOD), strict college email registration (`@bvcgroup.in`) with Brevo transactional OTP verification, attendance tracking, internal marks management, fee accounting, academic improvement recommendations, and a dedicated Python FastAPI machine learning microservice for student academic risk prediction and factor explainability.

```
campusconnect/
├── backend/          # Node.js + Express REST API (RBAC, Zod, Firebase Admin, Brevo OTP, Audit Logs)
├── ml-service/       # Python FastAPI service (Scikit-learn, Pandas, Joblib, SHAP/explanations)
└── frontend/         # React + Vite + Tailwind CSS + Lucide React + Recharts + Framer Motion
```

---

## 2. Visual Design System & Palette

CampusConnect strictly adheres to the specified four-color palette with high-contrast navy text and crisp surfaces:

| Color Role | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Primary Background** | `#E3FDFD` | Page background, soft aqua undertone |
| **Secondary Background** | `#CBF1F5` | Surface cards, border dividers, sub-panels |
| **Highlight & Hover** | `#A6E3E9` | Interactive hover states, active tags |
| **Primary Teal Accent** | `#71C9CE` | Primary buttons, active tabs, metric charts |
| **Text Primary** | `#102A43` | Deep navy for high-contrast legibility |
| **Text Secondary** | `#334E68` | Slate gray for secondary descriptions |
| **Surface Cards** | `#FFFFFF` | Crisp white cards with soft drop shadows |

---

## 3. Quick Start & Local Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Step 1: Start the Python Machine Learning Service
```powershell
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Health Check: `http://localhost:8000/health`
- Model Info: `http://localhost:8000/model-info`

### Step 2: Start the Node.js Express Backend
```powershell
cd backend
npm install
npm start
```
- REST API Base: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/api/health`

### Step 3: Start the React Frontend Application
```powershell
cd frontend
npm install
npm run dev
```
- Web Application Portal: `http://localhost:5173`

---

## 4. Built-in Demonstration Accounts

The top header of the application includes a **Persistent Demo Mode Banner** with **One-Click Role Switching**:

| Role | Name & Details | Email Address | Default Password |
| :--- | :--- | :--- | :--- |
| **Student (Normal)** | Sai Teja (Sec A, 92.5% Att, CGPA 8.75) | `22221a0501@bvcgroup.in` | `Bvc@2026` |
| **Student (At-Risk)** | Tarun Kumar (Sec A, 54% Att, At Risk) | `22221a0509@bvcgroup.in` | `Bvc@2026` |
| **Faculty Member** | Dr. K. Srinivasa Rao (Associate Professor) | `srinivasarao.k@bvcgroup.in` | `Bvc@2026` |
| **Department HOD** | Dr. V. Rama Krishna (Professor & HOD) | `hod.cse@bvcgroup.in` | `Bvc@2026` |

---

## 5. Machine Learning Pipeline & Evaluation

The ML microservice trains and compares three separate supervised algorithms on historical engineering student profiles:

### Model Comparison Table (Test Set Evaluation)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Random Forest (Selected)** | **77.50%** | **77.01%** | **77.50%** | **77.02%** | **0.9256** |
| **Logistic Regression** | 75.00% | 74.26% | 75.00% | 74.43% | 0.9132 |
| **Decision Tree** | 75.00% | 74.46% | 75.00% | 74.42% | 0.8765 |

### Input Features & Importance
1. `attendance_percentage` (25.7% importance)
2. `backlog_count` (22.2% importance)
3. `previous_cgpa` (16.2% importance)
4. `internal_test_avg` (15.4% importance)
5. `assignment_completion_rate` (10.9% importance)
6. `trend_score` (9.7% importance)

### Factor Explainability
For every flagged student, the model returns human-readable contributing factors (e.g. *Attendance at 54.0% is below the statutory 75% condonation threshold*, *Internal test score (34.5%) indicates high failure risk*).

---

## 6. Security & Authorization Guards

- **Strict Email Domain Enforcement**: Validates that all incoming registration and OTP requests strictly use `@bvcgroup.in`. Non-college emails (`@gmail.com`, etc.) are rejected with HTTP 400.
- **Brevo OTP Security**: 6-digit numeric OTPs are hashed using SHA-256 at rest, expire after 5 minutes, enforce a 60-second resend cooldown, and allow a maximum of 5 attempts before invalidation.
- **Role Escalation Protection**: Public registration defaults to `STUDENT`. Provisioning `FACULTY` or `HOD` accounts requires server-side administrative keys.
- **Class-Level Section Authorization**: Faculty members are restricted to modifying and viewing only their assigned sections and subjects.
- **Score Limit Validation**: Scores entered by faculty cannot exceed the assessment maximum marks or fall below zero.
- **Dual-Engine Architecture**: Operates with live Firebase Firestore and Brevo API credentials if configured in `.env`, or seamlessly with an in-memory/JSON-persisted development engine with console OTP preview if credentials are not yet supplied.

---

## 7. Testing Suite

Run backend and ML automated tests:
```powershell
# Run backend integration tests (8 suites testing RBAC, domain restriction, OTP, calculations)
cd backend
npm test

# Run ML test suite (5 suites testing endpoints, predictions, schema validations)
cd ml-service
python -m pytest test_ml.py -v
```

---

## 8. Institutional Verification & Signoff

- **Institution**: Bonam Venkata Chalamaya Engineering College (BVC)
- **Autonomous Status**: Approved by AICTE, Accredited by NBA & NAAC, Affiliated to JNTUK Kakinada
- **Data Notice**: All student records, attendance logs, and marks are synthetic demonstration data.
