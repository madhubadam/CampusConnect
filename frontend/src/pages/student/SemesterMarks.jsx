import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Layers, 
  BookOpen, 
  Info,
  Clock
} from 'lucide-react';

export function SemesterMarks() {
  const [selectedSemester, setSelectedSemester] = useState('3-1');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarks() {
      setLoading(true);
      try {
        const res = await api.getStudentMarks({ semester: selectedSemester });
        setData(res);
      } catch (err) {
        console.error('Error loading student marks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMarks();
  }, [selectedSemester]);

  const semestersList = [
    { code: 'ALL', label: 'All Semesters', year: 'Overview' },
    { code: '1-1', label: '1-1', year: 'I Year I Sem' },
    { code: '1-2', label: '1-2', year: 'I Year II Sem' },
    { code: '2-1', label: '2-1', year: 'II Year I Sem' },
    { code: '2-2', label: '2-2', year: 'II Year II Sem' },
    { code: '3-1', label: '3-1 (Active)', year: 'III Year I Sem' }
  ];

  const getGradeBadge = (grade) => {
    if (grade === 'O' || grade === 'A') {
      return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">{grade}</span>;
    } else if (grade === 'B' || grade === 'C') {
      return <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs">{grade}</span>;
    } else if (grade === 'D') {
      return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">{grade}</span>;
    } else if (grade === '—' || !grade) {
      return <span className="px-2 py-0.5 rounded-md bg-cc-bg text-cc-muted font-bold text-xs">—</span>;
    } else {
      return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">{grade}</span>;
    }
  };

  // Table for published active continuous assessment marks (Semester 3-1)
  const renderActiveMarksTable = (subjects, title = "Continuous Internal Evaluation & Assessment Breakdown") => (
    <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cc-dark" />
          <h3 className="text-sm font-bold text-cc-navy">{title}</h3>
        </div>
        <span className="text-xs text-cc-muted">Internal Max: 70 Marks (Mid 1: 30, Mid 2: 30, Assignment: 10)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold text-xs">
              <th className="py-3 px-4">Subject Code</th>
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-3 text-center">Credits</th>
              <th className="py-3 px-3 text-center">Mid-1 (30)</th>
              <th className="py-3 px-3 text-center">Mid-2 (30)</th>
              <th className="py-3 px-3 text-center">Assign (10)</th>
              <th className="py-3 px-3 text-center font-bold">Total (70)</th>
              <th className="py-3 px-3 text-center">Grade</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cc-surface/60">
            {subjects.map((sub) => (
              <tr key={sub.subjectId || sub.code} className="hover:bg-cc-bg/30 transition">
                <td className="py-3 px-4 font-mono font-semibold text-cc-dark">{sub.code}</td>
                <td className="py-3 px-4 font-semibold text-cc-navy">{sub.name}</td>
                <td className="py-3 px-3 text-center text-cc-slate font-mono">{sub.credits}</td>
                <td className="py-3 px-3 text-center font-mono">{sub.mid1Marks}</td>
                <td className="py-3 px-3 text-center font-mono">{sub.mid2Marks}</td>
                <td className="py-3 px-3 text-center font-mono">{sub.assignmentMarks}</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-cc-navy bg-cc-bg/20">
                  {sub.totalInternalMarks} <span className="text-[11px] text-cc-muted font-normal">({sub.percentage}%)</span>
                </td>
                <td className="py-3 px-3 text-center">{getGradeBadge(sub.grade)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    sub.status === 'CLEARED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {sub.status === 'CLEARED' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Cleared</>
                    ) : (
                      <><AlertCircle className="w-3.5 h-3.5" /> Retest Req.</>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Table for previous semesters with official curriculum but unpublished marks
  const renderCurriculumSubjectsTable = (subjects, semTitle) => (
    <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cc-dark" />
          <h3 className="text-sm font-bold text-cc-navy">
            Official Course Curriculum: {semTitle}
          </h3>
        </div>
        <span className="text-xs text-cc-slate font-medium">JNTUK R20 Computer Science &amp; Engineering</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold text-xs">
              <th className="py-3 px-4">Subject Code</th>
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-3 text-center">Credits</th>
              <th className="py-3 px-3 text-center">Category</th>
              <th className="py-3 px-3 text-center">Internal Marks</th>
              <th className="py-3 px-3 text-center">External Exam</th>
              <th className="py-3 px-4 text-center">Publication Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cc-surface/60">
            {subjects.map((sub) => (
              <tr key={sub.code} className="hover:bg-cc-bg/30 transition">
                <td className="py-3 px-4 font-mono font-semibold text-cc-dark">{sub.code}</td>
                <td className="py-3 px-4 font-semibold text-cc-navy">{sub.name}</td>
                <td className="py-3 px-3 text-center text-cc-slate font-mono">{sub.credits}</td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded-md bg-cc-bg text-cc-navy text-[11px] font-mono border border-cc-surface">
                    {sub.type || 'PC'}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-cc-muted italic">Unpublished</td>
                <td className="py-3 px-3 text-center text-cc-muted italic">Unpublished</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Results Not Published
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-amber-50/60 border-t border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Examination Branch Notice:</strong> Verified curriculum subjects are loaded from official JNTUK R20 regulations. Historical semester grade cards have not been published to this portal by the examination branch yet. Scores will be displayed once the official ledger is synced.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Semester Examination &amp; Academic Results</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Official JNTUK R20 Ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-cc-surface shadow-xs text-right">
            <span className="text-[10px] text-cc-muted font-bold uppercase tracking-wider block">Cumulative CGPA</span>
            <span className="text-xl font-extrabold text-cc-navy font-mono">{data?.cgpa != null ? Number(data.cgpa).toFixed(2) : '7.50'}</span>
          </div>
          {data?.sgpa && (
            <div className="bg-white px-4 py-2 rounded-xl border border-cc-surface shadow-xs text-right">
              <span className="text-[10px] text-cc-muted font-bold uppercase tracking-wider block">Semester SGPA</span>
              <span className="text-xl font-extrabold text-cc-teal font-mono">{Number(data.sgpa).toFixed(2)}</span>
            </div>
          )}
          {data?.totalCredits && (
            <div className="bg-white px-4 py-2 rounded-xl border border-cc-surface shadow-xs text-right">
              <span className="text-[10px] text-cc-muted font-bold uppercase tracking-wider block">Total Credits</span>
              <span className="text-xl font-extrabold text-cc-dark font-mono">{data.totalCredits}</span>
            </div>
          )}
        </div>
      </div>

      {/* Semester Selector Navigation & Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-cc-surface shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-cc-navy mr-2">Semester:</span>
          {semestersList.map((sem) => (
            <button
              key={sem.code}
              onClick={() => setSelectedSemester(sem.code)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSemester === sem.code
                  ? 'bg-cc-dark text-white shadow-xs'
                  : 'text-cc-navy hover:bg-cc-surface/70'
              }`}
            >
              <span>{sem.label}</span>
              <span className="text-[10px] opacity-75 font-normal">({sem.year})</span>
            </button>
          ))}
        </div>

        {/* Dropdown for quick switching */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-cc-muted">Select View:</span>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-cc-surface font-bold text-cc-navy bg-white focus:outline-none cursor-pointer"
          >
            {semestersList.map((sem) => (
              <option key={sem.code} value={sem.code}>
                {sem.label} - {sem.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-cc-dark font-medium animate-pulse flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-cc-surface border-t-cc-dark rounded-full animate-spin" />
          <span>Querying Official Semester Marksheets...</span>
        </div>
      ) : selectedSemester === 'ALL' ? (
        /* All Semesters View */
        <div className="space-y-8">
          {(data?.semesters || []).map((sem) => (
            <div key={sem.code} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-cc-surface/80">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cc-dark" />
                  <h2 className="text-base font-extrabold text-cc-navy">{sem.title}</h2>
                  {sem.isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-300">
                      Active Semester
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-cc-bg text-cc-slate text-[10px] font-semibold border border-cc-surface">
                      Previous Semester
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-cc-muted">Regulation: <strong className="text-cc-navy">{sem.regulation || 'R20'}</strong></span>
                  <span className="text-cc-muted">Credits: <strong className="text-cc-navy">{sem.totalCredits}</strong></span>
                  {sem.available && sem.sgpa && (
                    <span className="text-cc-muted">SGPA: <strong className="text-cc-teal font-mono">{sem.sgpa}</strong></span>
                  )}
                </div>
              </div>

              {sem.available ? (
                renderActiveMarksTable(sem.subjectWise, `Continuous Assessment: ${sem.title}`)
              ) : (
                renderCurriculumSubjectsTable(sem.curriculumSubjects || [], sem.title)
              )}
            </div>
          ))}
        </div>
      ) : data?.available ? (
        /* Single Semester: Active 3-1 Results View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-cc-muted bg-white p-3.5 rounded-xl border border-cc-surface gap-2">
            <div>
              <span>Displaying Results for: <strong className="text-cc-navy font-bold">{data?.title}</strong></span>
              <span className="ml-2 font-mono text-[11px] bg-teal-50 text-cc-dark px-2 py-0.5 rounded border border-teal-200">
                Regulation: {data?.regulation || 'R20'}
              </span>
            </div>
            <span>Cleared: <strong className="text-emerald-700 font-bold">{data?.passedCount}</strong> | Retest Req: <strong className="text-rose-600 font-bold">{data?.failedCount}</strong></span>
          </div>
          {renderActiveMarksTable(data?.subjectWise || [])}
        </div>
      ) : (
        /* Single Semester: Unpublished Previous Semester View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-cc-muted bg-white p-3.5 rounded-xl border border-cc-surface gap-2">
            <div>
              <span>Displaying Syllabus for: <strong className="text-cc-navy font-bold">{data?.title || selectedSemester}</strong></span>
              <span className="ml-2 font-mono text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Regulation: {data?.regulation || 'R20'} &bull; Total Credits: {data?.totalCredits || 19.5}
              </span>
            </div>
            <span className="text-amber-800 font-semibold">Results Not Published</span>
          </div>

          {data?.curriculumSubjects?.length > 0 && (
            renderCurriculumSubjectsTable(data.curriculumSubjects, data?.title || selectedSemester)
          )}
        </div>
      )}
    </div>
  );
}
