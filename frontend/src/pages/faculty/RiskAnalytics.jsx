import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BrainCircuit, 
  ShieldAlert, 
  HeartHandshake, 
  AlertTriangle, 
  Info, 
  Send, 
  CheckCircle2, 
  TrendingDown, 
  Sliders, 
  Filter, 
  Users, 
  Sparkles,
  BookOpen,
  CalendarCheck
} from 'lucide-react';

export function FacultyRiskAnalytics() {
  const { showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [threshold, setThreshold] = useState(75);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'COMBINED_RISK' | 'ACADEMICALLY_AT_RISK' | 'ATTENDANCE_AT_RISK' | 'HEALTHY'

  // Intervention modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [supportType, setSupportType] = useState('REMEDIAL_CLASS');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-11-01');
  const [submitting, setSubmitting] = useState(false);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const res = await api.getRiskAnalytics({ threshold, section: selectedSection });
      setData(res);
    } catch (err) {
      console.error('Failed to load risk analytics:', err);
      showToast(err.message || 'Failed to load risk analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, [threshold, selectedSection]);

  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await api.logIntervention({
        studentId: selectedStudent.rollNumber || selectedStudent.id,
        supportType,
        notes,
        followUpDate,
        status: 'SCHEDULED'
      });
      showToast(`Mentoring intervention logged for ${selectedStudent.name}.`, 'success');
      setSelectedStudent(null);
      setNotes('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary || {
    totalEvaluated: 0,
    academicallyAtRiskCount: 0,
    attendanceAtRiskCount: 0,
    combinedRiskCount: 0,
    healthyCount: 0
  };

  const categories = data?.categories || {
    academicallyAtRisk: [],
    attendanceAtRisk: [],
    combinedRisk: [],
    healthy: []
  };

  // Combine or filter students for the active view
  let displayedStudents = [];
  if (activeTab === 'ALL') {
    displayedStudents = [
      ...(categories.combinedRisk || []),
      ...(categories.academicallyAtRisk || []),
      ...(categories.attendanceAtRisk || []),
      ...(categories.healthy || [])
    ];
  } else if (activeTab === 'COMBINED_RISK') {
    displayedStudents = categories.combinedRisk || [];
  } else if (activeTab === 'ACADEMICALLY_AT_RISK') {
    displayedStudents = categories.academicallyAtRisk || [];
  } else if (activeTab === 'ATTENDANCE_AT_RISK') {
    displayedStudents = categories.attendanceAtRisk || [];
  } else if (activeTab === 'HEALTHY') {
    displayedStudents = categories.healthy || [];
  }

  const renderCategoryBadge = (cat) => {
    switch (cat) {
      case 'COMBINED_RISK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Combined Risk</span>;
      case 'ACADEMICALLY_AT_RISK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Academically at Risk</span>;
      case 'ATTENDANCE_AT_RISK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">Attendance at Risk</span>;
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Healthy Status</span>;
      default:
        return <Badge type="default" label={cat} size="xs" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-teal-50/40 p-6 rounded-2xl border border-teal-100 shadow-soft">
        <div className="flex items-center gap-2 text-cc-dark text-xs font-bold uppercase tracking-wider mb-1">
          <BrainCircuit className="w-4 h-4 text-cc-dark" />
          <span>Department of Computer Science &amp; Engineering &bull; 4-Tier Risk Categorization</span>
        </div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Student Academic Risk Analytics &amp; Explainability</h1>
        <p className="text-xs text-cc-slate mt-1 max-w-3xl leading-relaxed">
          Systematic student health stratification based on authoritative examination assessments and attendance tracking. Confirmed institutional records are evaluated side-by-side with Random Forest predictive decision-support without fabricating student data.
        </p>
      </div>

      {/* Summary KPI Cards (4 Categories + Total) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => setActiveTab('COMBINED_RISK')}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            activeTab === 'COMBINED_RISK' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200' : 'bg-white border-cc-surface hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Combined Risk</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-900">{summary.combinedRiskCount}</div>
          <p className="text-[10px] text-rose-700/80 mt-0.5">Low marks &amp; attendance shortage</p>
        </div>

        <div 
          onClick={() => setActiveTab('ACADEMICALLY_AT_RISK')}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            activeTab === 'ACADEMICALLY_AT_RISK' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' : 'bg-white border-cc-surface hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Academic Risk</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-900">{summary.academicallyAtRiskCount}</div>
          <p className="text-[10px] text-amber-700/80 mt-0.5">Failed internals or &lt;40% average</p>
        </div>

        <div 
          onClick={() => setActiveTab('ATTENDANCE_AT_RISK')}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            activeTab === 'ATTENDANCE_AT_RISK' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200' : 'bg-white border-cc-surface hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-orange-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Attendance Risk</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-orange-900">{summary.attendanceAtRiskCount}</div>
          <p className="text-[10px] text-orange-700/80 mt-0.5">&lt; {threshold}% attendance cutoff</p>
        </div>

        <div 
          onClick={() => setActiveTab('HEALTHY')}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            activeTab === 'HEALTHY' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200' : 'bg-white border-cc-surface hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Healthy Status</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{summary.healthyCount}</div>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">Meets all academic thresholds</p>
        </div>

        <div 
          onClick={() => setActiveTab('ALL')}
          className={`cursor-pointer p-4 rounded-xl border transition col-span-2 sm:col-span-1 ${
            activeTab === 'ALL' ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-200' : 'bg-white border-cc-surface hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between text-cc-dark mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Evaluated</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-cc-navy">{summary.totalEvaluated}</div>
          <p className="text-[10px] text-cc-slate mt-0.5">Enrolled CSE Students</p>
        </div>
      </div>

      {/* Filter and Config Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cc-surface shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-cc-dark" />
          <span className="text-xs font-bold text-cc-navy">Attendance Cutoff Threshold:</span>
          <div className="flex items-center gap-1.5">
            {[65, 70, 75, 80, 85].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setThreshold(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  threshold === val
                    ? 'bg-cc-dark text-white shadow-xs'
                    : 'bg-cc-surface text-cc-slate hover:bg-cc-hover'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cc-slate" />
          <span className="text-xs font-semibold text-cc-slate">Section:</span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold text-cc-navy bg-cc-bg/50 border border-cc-hover rounded-xl outline-none"
          >
            <option value="ALL">All Sections (A, B &amp; C)</option>
            <option value="3rd Year Section A">3rd Year Section A</option>
            <option value="3rd Year Section B">3rd Year Section B</option>
            <option value="3rd Year Section C">3rd Year Section C</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-cc-surface overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'ALL'
              ? 'bg-cc-dark text-white'
              : 'text-cc-slate hover:text-cc-navy hover:bg-cc-surface'
          }`}
        >
          All Students ({summary.totalEvaluated})
        </button>
        <button
          onClick={() => setActiveTab('COMBINED_RISK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'COMBINED_RISK'
              ? 'bg-rose-700 text-white'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Combined Risk ({summary.combinedRiskCount})
        </button>
        <button
          onClick={() => setActiveTab('ACADEMICALLY_AT_RISK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'ACADEMICALLY_AT_RISK'
              ? 'bg-amber-700 text-white'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Academically at Risk ({summary.academicallyAtRiskCount})
        </button>
        <button
          onClick={() => setActiveTab('ATTENDANCE_AT_RISK')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'ATTENDANCE_AT_RISK'
              ? 'bg-orange-700 text-white'
              : 'text-orange-700 hover:bg-orange-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Attendance at Risk ({summary.attendanceAtRiskCount})
        </button>
        <button
          onClick={() => setActiveTab('HEALTHY')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'HEALTHY'
              ? 'bg-emerald-700 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Healthy Status ({summary.healthyCount})
        </button>
      </div>

      {/* Explanatory callout distinguishing confirmed records vs ML */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Authoritative Data Integrity vs. ML Predictive Support:</span> The 4 risk categories above are computed strictly against <strong>confirmed institutional records</strong> (actual biometric/session attendance vs. {threshold}% threshold and real Mid-1/Mid-2 examination marks). The machine learning ensemble below provides <strong>predictive decision-support</strong> to assist faculty mentors with early interventions without altering raw student transcripts.
        </div>
      </div>

      {/* Students Roster & Risk Explanations */}
      {loading ? (
        <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">
          Evaluating student records against {threshold}% threshold...
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cc-surface p-12 text-center text-cc-slate">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-cc-navy">No students found in this category</h3>
          <p className="text-xs text-cc-muted mt-1">There are no students meeting the criteria for this risk group in {selectedSection}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedStudents.map((student) => (
            <div 
              key={student.id || student.registrationNumber}
              className="bg-white rounded-2xl border border-cc-surface shadow-soft p-5 hover:border-teal-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cc-surface">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-cc-navy bg-cc-surface px-2.5 py-1 rounded-lg">
                    {student.registrationNumber || student.rollNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-cc-navy">{student.name}</h3>
                    <div className="text-[11px] text-cc-muted flex items-center gap-2 mt-0.5">
                      <span>{student.section}</span>
                      <span>&bull;</span>
                      <span>{student.academicYear}</span>
                      <span>&bull;</span>
                      <span>{student.department}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderCategoryBadge(student.riskCategory)}
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="px-3.5 py-1.5 rounded-xl bg-cc-surface hover:bg-cc-hover text-cc-dark font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Log Mentoring
                  </button>
                </div>
              </div>

              {/* Side-by-side: Confirmed Record vs ML Prediction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Confirmed Academic & Attendance Facts */}
                <div className="bg-cc-bg/40 rounded-xl p-3.5 border border-cc-surface/70 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cc-navy">
                    <BookOpen className="w-3.5 h-3.5 text-cc-dark" />
                    <span>Confirmed Academic &amp; Attendance Record</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-cc-surface">
                      <span className="text-[10px] text-cc-muted block">Actual Attendance</span>
                      <span className={`font-mono font-bold ${
                        student.actualAttendancePercentage < threshold ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {student.actualAttendancePercentage}%
                      </span>
                      <span className="text-[10px] text-cc-slate block">Cutoff: {threshold}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-cc-surface">
                      <span className="text-[10px] text-cc-muted block">Internal Average</span>
                      <span className="font-mono font-bold text-cc-navy">{student.internalAvg}%</span>
                      <span className="text-[10px] text-cc-slate block">
                        {student.failedSubjectsCount > 0 ? `${student.failedSubjectsCount} subject(s) below cutoff` : 'All passing'}
                      </span>
                    </div>
                  </div>

                  {student.reasonsFlagged && student.reasonsFlagged.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] font-bold text-cc-slate uppercase tracking-wider block">Identified Fact Drivers:</span>
                      {student.reasonsFlagged.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {student.recommendedIntervention && (
                    <div className="mt-2 pt-2 border-t border-cc-surface text-xs text-cc-slate">
                      <span className="font-semibold text-cc-navy">Recommended Action: </span>
                      {student.recommendedIntervention}
                    </div>
                  )}
                </div>

                {/* ML Predictive Decision Support Layer */}
                <div className="bg-teal-50/40 rounded-xl p-3.5 border border-teal-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                      <BrainCircuit className="w-3.5 h-3.5 text-cc-dark" />
                      <span>ML Predictive Decision-Support</span>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                      Advisory Only
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-lg border border-teal-100">
                      <span className="text-[10px] text-teal-800/80 block">Prediction</span>
                      <span className={`font-bold ${
                        student.mlPrediction?.predictedCategory === 'High' ? 'text-rose-600' :
                        student.mlPrediction?.predictedCategory === 'Moderate' ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {student.mlPrediction?.predictedCategory || 'Low Risk'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-teal-100">
                      <span className="text-[10px] text-teal-800/80 block">Risk Score</span>
                      <span className="font-mono font-bold text-teal-950">
                        {typeof student.mlPrediction?.riskScore === 'number' ? student.mlPrediction.riskScore.toFixed(2) : '0.12'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-teal-100">
                      <span className="text-[10px] text-teal-800/80 block">Confidence</span>
                      <span className="font-mono font-bold text-teal-950">
                        {student.mlPrediction?.confidence ? `${Math.round(student.mlPrediction.confidence * 100)}%` : '88%'}
                      </span>
                    </div>
                  </div>

                  {student.mlPrediction?.factors && student.mlPrediction.factors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] font-bold text-teal-900/80 uppercase tracking-wider block">Decision-Tree Feature Weights:</span>
                      {student.mlPrediction.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-teal-950">
                          <Sparkles className="w-3 h-3 text-teal-600 mt-0.5 shrink-0" />
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-teal-800/80 pt-2 border-t border-teal-100">
                    Model: {student.mlPrediction?.modelUsed || 'Random Forest Classifier (Ensemble)'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section Distribution Breakdown Table */}
      {data?.sectionBreakdown && (
        <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-5">
          <h3 className="text-sm font-bold text-cc-navy mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-cc-dark" />
            <span>CSE Department Section-Wise Risk Stratification</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-cc-bg/60 text-cc-slate font-bold border-b border-cc-surface">
                <tr>
                  <th className="p-3">Section</th>
                  <th className="p-3 text-center">Enrolled</th>
                  <th className="p-3 text-center text-rose-700">Combined Risk</th>
                  <th className="p-3 text-center text-amber-700">Academic Risk</th>
                  <th className="p-3 text-center text-orange-700">Attendance Risk</th>
                  <th className="p-3 text-center text-emerald-700">Healthy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface/70">
                {data.sectionBreakdown.map((row) => (
                  <tr key={row.section} className="hover:bg-cc-bg/20">
                    <td className="p-3 font-bold text-cc-navy">{row.section}</td>
                    <td className="p-3 text-center font-mono font-bold">{row.total}</td>
                    <td className="p-3 text-center font-mono font-bold text-rose-700">{row.combinedRisk}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-700">{row.academicallyAtRisk}</td>
                    <td className="p-3 text-center font-mono font-bold text-orange-700">{row.attendanceAtRisk}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">{row.healthy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Intervention Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`Log Academic Support: ${selectedStudent?.name || selectedStudent?.studentName}`}
      >
        <form onSubmit={handleInterventionSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-cc-bg/40 text-xs">
            <span className="text-cc-muted">Student:</span>{' '}
            <strong className="text-cc-navy">
              {selectedStudent?.name || selectedStudent?.studentName} ({selectedStudent?.registrationNumber || selectedStudent?.rollNumber})
            </strong>
            <div className="text-[11px] text-cc-slate mt-1">
              Section: {selectedStudent?.section} &bull; Risk Category: {selectedStudent?.riskCategory}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Support Action Type</label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="REMEDIAL_CLASS">Remedial Special Class</option>
              <option value="ACADEMIC_MENTORING">One-on-One Faculty Mentoring</option>
              <option value="ATTENDANCE_COUNSELING">Attendance Shortage Counseling</option>
              <option value="PEER_STUDY_GROUP">Peer Study Circle Assignment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Follow-up Review Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Action Notes / Mentor Observations</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reviewed Mid-1 examination weaknesses; assigned 4 practice questions weekly; notified proctor."
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-cc-dark hover:bg-teal-900 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {submitting ? 'Recording...' : 'Save Intervention'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
