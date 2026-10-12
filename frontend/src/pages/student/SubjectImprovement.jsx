import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Sparkles, BookOpen, User, CheckCircle2, AlertCircle, Clock, 
  Calendar, Plus, Trash2, ListTodo, Target, ChevronRight, CheckSquare, Square,
  ShieldCheck, AlertTriangle, ArrowUpRight
} from 'lucide-react';

export function SubjectImprovement() {
  const [recommendations, setRecommendations] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Form state for creating study goal
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [activityNote, setActivityNote] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.getStudentImprovement();
      const recs = res.recommendations || [];
      setRecommendations(recs);
      setStudyGoals(res.studyGoals || []);
      if (recs.length > 0 && !selectedSubject) {
        setSelectedSubject(recs[0].subjectCode);
        setSelectedTopic(recs[0].syllabusTopics?.[0] || '');
      }
    } catch (err) {
      console.error('Failed to load subject improvement data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle subject dropdown change in goal form
  const handleSubjectChange = (code) => {
    setSelectedSubject(code);
    const sub = recommendations.find(r => r.subjectCode === code);
    if (sub && sub.syllabusTopics?.length > 0) {
      setSelectedTopic(sub.syllabusTopics[0]);
    } else {
      setSelectedTopic('');
    }
    setCustomTopic('');
  };

  const handlePreselectSubject = (code) => {
    handleSubjectChange(code);
    const formEl = document.getElementById('study-planner-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setActionError(null);
    const topicToSave = selectedTopic === '__custom__' ? customTopic.trim() : selectedTopic;
    if (!selectedSubject || !topicToSave) {
      setActionError('Please select both a subject and a topic/unit.');
      return;
    }

    try {
      setSavingGoal(true);
      const res = await api.createStudentStudyGoal({
        subjectCode: selectedSubject,
        topic: topicToSave,
        targetDate,
        activity: activityNote.trim() || 'Review unit concepts & practice university problem sets'
      });

      if (res.success && res.goal) {
        setStudyGoals(prev => [res.goal, ...prev]);
        setActivityNote('');
        if (selectedTopic === '__custom__') {
          setCustomTopic('');
        }
      }
    } catch (err) {
      console.error('Failed to create study goal:', err);
      setActionError(err.message || 'Failed to save study goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoal = async (goalId) => {
    try {
      const res = await api.toggleStudentStudyGoal(goalId);
      if (res.success && res.goal) {
        setStudyGoals(prev => prev.map(g => g.id === goalId ? res.goal : g));
      }
    } catch (err) {
      console.error('Failed to toggle goal status:', err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await api.deleteStudentStudyGoal(goalId);
      if (res.success) {
        setStudyGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-10 h-10 border-4 border-cc-teal/30 border-t-cc-teal rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-cc-navy">Analyzing Subject Performance &amp; Syllabus Progress...</p>
        <p className="text-xs text-cc-slate mt-1">Cross-referencing continuous evaluation scores and attendance benchmarks.</p>
      </div>
    );
  }

  const filteredRecs = recommendations.filter(item => {
    if (filterPriority === 'ALL') return true;
    return item.improvementPriority === filterPriority;
  });

  const highPriorityCount = recommendations.filter(r => r.improvementPriority === 'HIGH').length;
  const mediumPriorityCount = recommendations.filter(r => r.improvementPriority === 'MEDIUM').length;
  const onTrackCount = recommendations.filter(r => r.improvementPriority === 'LOW').length;

  const completedGoalsCount = studyGoals.filter(g => g.completed).length;
  const goalProgressPct = studyGoals.length > 0 ? Math.round((completedGoalsCount / studyGoals.length) * 100) : 0;

  const currentSelectedSub = recommendations.find(r => r.subjectCode === selectedSubject);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-cc-surface/80 via-white to-cc-surface/40 p-6 md:p-8 rounded-2xl border border-cc-surface shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cc-dark text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-cc-dark" />
              <span>Academic Diagnostic &amp; Pedagogical Support</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-cc-navy tracking-tight">
              Subject Improvement &amp; Remedial Action Plans
            </h1>
            <p className="text-xs md:text-sm text-cc-slate mt-1.5 max-w-2xl leading-relaxed">
              Curriculum-aligned diagnostics comparing active coursework against university 75% attendance thresholds and minimum passing marks.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-3 rounded-xl border border-cc-surface shadow-xs text-center min-w-[100px]">
              <span className="block text-2xl font-black text-rose-600">{highPriorityCount}</span>
              <span className="text-[11px] font-bold text-cc-slate uppercase tracking-wider">High Priority</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-xl border border-cc-surface shadow-xs text-center min-w-[100px]">
              <span className="block text-2xl font-black text-amber-600">{mediumPriorityCount}</span>
              <span className="text-[11px] font-bold text-cc-slate uppercase tracking-wider">Review Needed</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-xl border border-cc-surface shadow-xs text-center min-w-[100px]">
              <span className="block text-2xl font-black text-emerald-600">{onTrackCount}</span>
              <span className="text-[11px] font-bold text-cc-slate uppercase tracking-wider">On Track</span>
            </div>
          </div>
        </div>

        {/* Methodological Safety Notice */}
        <div className="mt-5 p-3.5 rounded-xl bg-cc-teal/5 border border-cc-teal/20 flex items-start gap-2.5 text-xs text-cc-slate">
          <ShieldCheck className="w-4 h-4 text-cc-teal shrink-0 mt-0.5" />
          <p>
            <strong className="text-cc-navy font-semibold">Institutional Assessment Standard:</strong> Recommendations are calculated dynamically using official department benchmarks. Creating study goals provides student-guided revision tracking and does not alter official grade sheets or verified marks records.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-cc-surface pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPriority('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPriority === 'ALL'
                ? 'bg-cc-navy text-white shadow-xs'
                : 'bg-white text-cc-slate hover:bg-cc-surface/60 border border-cc-surface'
            }`}
          >
            All Courses ({recommendations.length})
          </button>
          <button
            onClick={() => setFilterPriority('HIGH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterPriority === 'HIGH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            High Priority ({highPriorityCount})
          </button>
          <button
            onClick={() => setFilterPriority('MEDIUM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterPriority === 'MEDIUM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            Review Recommended ({mediumPriorityCount})
          </button>
          <button
            onClick={() => setFilterPriority('LOW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterPriority === 'LOW'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            On Track ({onTrackCount})
          </button>
        </div>
      </div>

      {/* Subject Diagnostic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecs.map((item) => {
          const isHigh = item.improvementPriority === 'HIGH';
          const isMedium = item.improvementPriority === 'MEDIUM';

          return (
            <div
              key={item.subjectCode}
              className={`bg-white rounded-2xl border p-6 shadow-soft flex flex-col justify-between transition hover:shadow-md ${
                isHigh
                  ? 'border-rose-300 ring-1 ring-rose-200/50'
                  : isMedium
                  ? 'border-amber-300 ring-1 ring-amber-200/50'
                  : 'border-cc-surface'
              }`}
            >
              <div>
                {/* Header: Subject Code & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cc-dark px-2 py-0.5 rounded bg-cc-surface/60">
                        {item.subjectCode}
                      </span>
                      {item.credits && (
                        <span className="text-[11px] font-semibold text-cc-muted">
                          {item.credits} Credits
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-cc-navy mt-1">{item.subjectName}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 flex items-center gap-1 ${
                    isHigh
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isMedium
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isHigh && <AlertCircle className="w-3.5 h-3.5" />}
                    {isMedium && <Clock className="w-3.5 h-3.5" />}
                    {!isHigh && !isMedium && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isHigh ? 'High Priority' : isMedium ? 'Review Needed' : 'On Track'}</span>
                  </span>
                </div>

                {/* Priority Reason / Diagnostic Note */}
                <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  isHigh 
                    ? 'bg-rose-50/70 border border-rose-200 text-rose-900' 
                    : isMedium
                    ? 'bg-amber-50/70 border border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    {isHigh ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> : null}
                    <span>Diagnostic Finding:</span>
                  </div>
                  <p>{item.priorityReason}</p>
                </div>

                {/* Subject Attendance Indicator */}
                <div className="p-3 rounded-xl bg-cc-bg/50 border border-cc-surface mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-cc-slate">Course Attendance:</span>
                    <span className={`font-bold ${
                      item.attendancePercentage < 75 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.attendancePercentage}% {item.attendancePercentage < 75 ? '(Below 75% Requirement)' : '(Eligible)'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-cc-surface overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.attendancePercentage < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, item.attendancePercentage)}%` }}
                    />
                  </div>
                </div>

                {/* JNTUK Syllabus Modules */}
                {item.syllabusTopics && item.syllabusTopics.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-cc-slate mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cc-dark" />
                      <span>JNTUK R20 Syllabus Units:</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {item.syllabusTopics.map((topic, i) => (
                        <span 
                          key={i} 
                          className="text-[11px] bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Practice Activities */}
                {item.recommendedPractice && item.recommendedPractice.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-cc-slate mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cc-dark" />
                      <span>Actionable Remedial Strategy:</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-cc-slate">
                      {item.recommendedPractice.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-cc-teal mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer: Faculty contact & Plan Goal shortcut */}
              <div className="mt-5 pt-4 border-t border-cc-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cc-muted">
                  <User className="w-3.5 h-3.5 text-cc-dark shrink-0" />
                  <span className="truncate">{item.facultyContact || item.facultyName}</span>
                </span>

                <button
                  onClick={() => handlePreselectSubject(item.subjectCode)}
                  className="inline-flex items-center gap-1.5 font-bold text-cc-dark hover:text-cc-navy bg-cc-surface/40 hover:bg-cc-surface px-3 py-1.5 rounded-lg border border-cc-surface transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-cc-teal" />
                  <span>Set Revision Goal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Study Goals & Remedial Planner Section */}
      <div id="study-planner-section" className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cc-surface">
          <div>
            <div className="flex items-center gap-2 text-cc-dark text-xs font-bold uppercase tracking-wider mb-1">
              <ListTodo className="w-4 h-4 text-cc-dark" />
              <span>Personal Study Planner</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-cc-navy">
              Remedial Practice Goals &amp; Topic Milestones
            </h2>
            <p className="text-xs text-cc-slate mt-1">
              Schedule structured revision targets for specific curriculum units. Goals are saved to your profile and track completion independently of faculty marks entry.
            </p>
          </div>

          {/* Goal Progress Summary */}
          <div className="bg-cc-bg/60 p-4 rounded-xl border border-cc-surface flex items-center gap-4 min-w-[240px]">
            <div className="w-10 h-10 rounded-full bg-cc-teal/10 flex items-center justify-center text-cc-teal shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-cc-navy">Goal Completion</span>
                <span className="text-cc-teal">{goalProgressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-cc-surface overflow-hidden">
                <div
                  className="h-full bg-cc-teal rounded-full transition-all duration-500"
                  style={{ width: `${goalProgressPct}%` }}
                />
              </div>
              <span className="text-[11px] text-cc-slate mt-1 block">
                {completedGoalsCount} of {studyGoals.length} milestones completed
              </span>
            </div>
          </div>
        </div>

        {/* Goal Creation Form */}
        <form onSubmit={handleCreateGoal} className="my-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cc-navy mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cc-teal" />
            <span>Schedule New Remedial Goal</span>
          </h3>

          {actionError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-[11px] font-bold text-cc-slate uppercase tracking-wider mb-1.5">
                Target Course
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-cc-navy focus:outline-hidden focus:border-cc-teal"
              >
                {recommendations.map(r => (
                  <option key={r.subjectCode} value={r.subjectCode}>
                    {r.subjectCode} - {r.subjectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Syllabus Topic Selector */}
            <div>
              <label className="block text-[11px] font-bold text-cc-slate uppercase tracking-wider mb-1.5">
                Syllabus Unit / Topic
              </label>
              {currentSelectedSub && currentSelectedSub.syllabusTopics?.length > 0 ? (
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-cc-navy focus:outline-hidden focus:border-cc-teal"
                >
                  {currentSelectedSub.syllabusTopics.map((top, idx) => (
                    <option key={idx} value={top}>
                      {top}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Topic...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Unit 2: Storage Architecture"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-cc-navy focus:outline-hidden focus:border-cc-teal"
                />
              )}
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-[11px] font-bold text-cc-slate uppercase tracking-wider mb-1.5">
                Target Milestone Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-cc-navy focus:outline-hidden focus:border-cc-teal"
                />
              </div>
            </div>
          </div>

          {/* Custom Topic Input if selected */}
          {selectedTopic === '__custom__' && (
            <div className="mt-3">
              <label className="block text-[11px] font-bold text-cc-slate uppercase tracking-wider mb-1">
                Custom Topic Name
              </label>
              <input
                type="text"
                placeholder="Enter specific concept or chapter name..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-cc-navy focus:outline-hidden focus:border-cc-teal"
              />
            </div>
          )}

          {/* Activity Notes & Submit */}
          <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Planned activity (e.g., Solve 5 years university exam questions, complete lab program)"
              value={activityNote}
              onChange={(e) => setActivityNote(e.target.value)}
              className="flex-1 w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-cc-navy focus:outline-hidden focus:border-cc-teal"
            />
            <button
              type="submit"
              disabled={savingGoal}
              className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-cc-teal text-white text-xs font-bold hover:bg-cc-teal/90 transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {savingGoal ? (
                <span>Adding Goal...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Study Goal</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Existing Study Goals List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-cc-slate uppercase tracking-wider px-2">
            <span>Scheduled Goals ({studyGoals.length})</span>
            <span>Status</span>
          </div>

          {studyGoals.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Target className="w-8 h-8 text-cc-slate/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-cc-navy">No Study Goals Scheduled Yet</p>
              <p className="text-[11px] text-cc-slate mt-1 max-w-md mx-auto">
                Select a course and syllabus unit above to set your first remedial practice milestone.
              </p>
            </div>
          ) : (
            studyGoals.map((goal) => {
              const subObj = recommendations.find(r => r.subjectCode === goal.subjectCode);
              const isPastDue = !goal.completed && goal.targetDate && new Date(goal.targetDate) < new Date(new Date().setHours(0,0,0,0));

              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                    goal.completed
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : isPastDue
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-cc-surface hover:border-cc-teal/50'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleGoal(goal.id)}
                      className="mt-0.5 text-cc-teal hover:text-cc-navy transition shrink-0"
                      title={goal.completed ? "Mark as pending" : "Mark as completed"}
                    >
                      {goal.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 hover:text-cc-teal" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-mono font-bold bg-cc-surface/70 text-cc-dark px-2 py-0.5 rounded">
                          {goal.subjectCode}
                        </span>
                        {subObj && (
                          <span className="text-xs font-semibold text-cc-slate truncate">
                            {subObj.subjectName}
                          </span>
                        )}
                        {goal.completed && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {isPastDue && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Target Date Passed
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold text-cc-navy ${goal.completed ? 'line-through text-slate-400' : ''}`}>
                        {goal.topic}
                      </h4>

                      {goal.activity && (
                        <p className={`text-xs mt-0.5 ${goal.completed ? 'text-slate-400' : 'text-cc-slate'}`}>
                          {goal.activity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Target Date & Delete Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-cc-slate">
                        <Calendar className="w-3.5 h-3.5 text-cc-dark" />
                        <span>Target: {goal.targetDate || 'Flexible'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
