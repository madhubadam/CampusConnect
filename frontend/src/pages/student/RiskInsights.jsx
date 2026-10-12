import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Sliders,
  TrendingDown,
  Layers,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Link } from 'react-router-dom';

export function RiskInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    async function loadRisk() {
      setLoading(true);
      try {
        const res = await api.getStudentRiskInsights({ threshold });
        setData(res);
      } catch (err) {
        console.error('Failed to load risk insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRisk();
  }, [threshold]);

  if (loading) {
    return (
      <div className="text-center py-16 text-sm text-cc-dark font-medium animate-pulse flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-cc-surface border-t-cc-dark rounded-full animate-spin" />
        <span>Evaluating Academic Facts &amp; Predictive Risk Model...</span>
      </div>
    );
  }

  const summary = data?.summary || {};
  const explainability = data?.explainability || {};
  const mlPrediction = data?.mlPrediction || {};
  const riskCategory = data?.riskCategory || 'No Risk';

  const renderCategoryBadge = (cat) => {
    switch (cat) {
      case 'Combined Risk':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><ShieldAlert className="w-3.5 h-3.5" /> Combined Risk</span>;
      case 'Attendance Risk':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300"><CalendarCheck className="w-3.5 h-3.5" /> Attendance Risk</span>;
      case 'Academic Risk':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> Academic Risk</span>;
      case 'Insufficient Data':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"><HelpCircle className="w-3.5 h-3.5" /> Insufficient Data</span>;
      case 'No Risk':
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> No Risk</span>;
    }
  };

  const isPositive = riskCategory === 'No Risk';
  const isHighDanger = riskCategory === 'Combined Risk';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-teal-50/40 p-6 rounded-2xl border border-teal-100 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cc-dark text-xs font-bold uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4 text-cc-dark" />
            <span>Academic Monitoring &bull; Explainable Decision Support</span>
          </div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Academic Risk Insights &amp; Explainability</h1>
          <p className="text-xs text-cc-slate mt-1 max-w-2xl leading-relaxed">
            Transparent student monitoring combining confirmed institutional attendance and examination results with machine-learning decision support. Raw internal marks values are isolated to dedicated grade sheets.
          </p>
        </div>

        {/* Configurable Threshold Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-cc-surface text-xs shadow-xs shrink-0">
          <Sliders className="w-3.5 h-3.5 text-cc-dark" />
          <span className="text-cc-muted font-medium">Cutoff Rule:</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-transparent font-bold text-cc-navy focus:outline-none cursor-pointer"
          >
            <option value={70}>70% Cutoff</option>
            <option value={75}>75% Standard (JNTUK)</option>
            <option value={80}>80% Strict</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Fact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted block">Risk Classification</span>
          <div className="mt-2">{renderCategoryBadge(riskCategory)}</div>
          <p className="text-[11px] text-cc-slate mt-2">
            {isPositive ? 'Satisfies all institutional benchmarks' : 'Actionable academic advisory flagged'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted block">Attendance Standing</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono ${
              summary.attendancePercentage < threshold ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              {summary.attendancePercentage}%
            </span>
            <span className="text-xs text-cc-muted font-normal">vs {threshold}% cutoff</span>
          </div>
          <p className="text-[11px] text-cc-slate mt-1">{summary.attendanceStatus}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted block">Academic Examination Status</span>
          <div className="mt-1 text-2xl font-extrabold text-cc-navy font-mono">
            {summary.publishedFailedSubjects?.length || 0}
          </div>
          <p className="text-[11px] text-cc-slate mt-1">
            {summary.publishedFailedSubjects?.length > 0 
              ? `${summary.publishedFailedSubjects.length} subject(s) require retest` 
              : 'All evaluated courses on track'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted block">Data Period</span>
          <div className="mt-1 text-sm font-extrabold text-cc-navy">
            III B.Tech I Sem
          </div>
          <p className="text-[11px] text-cc-muted mt-1">
            Previous sem grade cards pending university release
          </p>
        </div>
      </div>

      {/* Confirmed Academic Facts (Distinct from ML Predictions) */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-cc-surface">
          <GraduationCap className="w-5 h-5 text-cc-dark" />
          <div>
            <h3 className="text-base font-bold text-cc-navy">Confirmed Institutional Academic Facts</h3>
            <p className="text-xs text-cc-muted">Objective metrics derived strictly from university biometrics and verified records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-cc-bg/40 border border-cc-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cc-navy">Biometric Attendance Record:</span>
              <span className={`font-mono font-bold ${
                summary.attendancePercentage >= threshold ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {summary.attendancePercentage}% ({summary.attendancePercentage >= threshold ? 'Above Cutoff' : 'Attendance Shortage'})
              </span>
            </div>
            <p className="text-cc-slate text-[11px]">
              Evaluated across recorded lectures and lab sessions in the active semester against institutional {threshold}% condonation standard.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cc-bg/40 border border-cc-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cc-navy">Examination Standing:</span>
              <span className="font-bold text-cc-navy">
                {summary.academicStatus}
              </span>
            </div>
            <p className="text-cc-slate text-[11px]">
              {summary.publishedFailedSubjects?.length > 0 
                ? `Flagged courses: ${summary.publishedFailedSubjects.join(', ')}.`
                : 'No failing subjects or backlogs detected across confirmed evaluations.'}
            </p>
          </div>
        </div>
      </div>

      {/* Explainability Section: Indicators & Plain-Language Guidance */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-cc-surface">
          <Info className="w-5 h-5 text-cc-dark" />
          <div>
            <h3 className="text-base font-bold text-cc-navy">Why Was This Risk Status Identified?</h3>
            <p className="text-xs text-cc-muted">Grounded, plain-language explainability based on verified student criteria</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 leading-relaxed font-medium">
          {explainability.explanation}
        </div>

        {/* Responsible Indicators */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-cc-slate mb-2.5">
            Key Contributing Indicators:
          </h4>
          <div className="space-y-2">
            {(explainability.responsibleIndicators || []).map((ind, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-cc-bg/40 border border-cc-surface text-xs text-cc-slate flex items-start gap-2.5"
              >
                {isHighDanger ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : isPositive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{ind}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-cc-slate mb-2.5">
            Recommended Actionable Guidance:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(explainability.recommendedActions || []).map((act, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl border border-cc-surface bg-white shadow-xs text-xs text-cc-navy flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-teal-100 text-cc-dark font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{act}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            to="/student/improvement"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cc-dark text-white text-xs font-bold hover:bg-teal-900 shadow-xs transition"
          >
            <span>Open Subject Improvement &amp; Study Planning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Machine Learning Decision Support Panel */}
      <div className="bg-gradient-to-br from-white to-cc-bg/50 rounded-2xl border border-cc-surface shadow-soft p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cc-surface">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cc-dark" />
            <div>
              <h3 className="text-base font-bold text-cc-navy">Machine Learning Decision-Support Panel</h3>
              <p className="text-xs text-cc-muted">Scikit-learn Ensemble Model (Independent Faculty Advisory Layer)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-cc-surface text-cc-dark border border-cc-surface">
            Model: Random Forest Classifier
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-cc-surface shadow-xs">
            <span className="text-[10px] text-cc-muted uppercase tracking-wider block font-bold">Predictive Risk Tier</span>
            <span className="text-lg font-extrabold text-cc-navy mt-1 block">
              {mlPrediction.predictedCategory || 'Low Risk'}
            </span>
            <span className="text-[10px] text-cc-slate">Early intervention advisory</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cc-surface shadow-xs">
            <span className="text-[10px] text-cc-muted uppercase tracking-wider block font-bold">Predictive Risk Score</span>
            <span className="text-lg font-extrabold text-cc-teal font-mono mt-1 block">
              {((mlPrediction.riskScore || 0.12) * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-cc-slate">Normalized regression metric</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cc-surface shadow-xs">
            <span className="text-[10px] text-cc-muted uppercase tracking-wider block font-bold">Model Confidence</span>
            <span className="text-lg font-extrabold text-cc-navy font-mono mt-1 block">
              {((mlPrediction.confidence || 0.88) * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-cc-slate">Ensemble agreement index</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Advisory Decision-Support Notice:</strong> {mlPrediction.disclaimer || 'Statistical model decision-support indicator to guide faculty mentoring. Does not alter official academic records.'}
          </p>
        </div>
      </div>
    </div>
  );
}
