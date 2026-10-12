import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Edit3, CheckCircle2, AlertCircle, PlusCircle, Search, Save } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function MarksManagement() {
  const { showToast } = useAuth();

  const [section, setSection] = useState('3rd Year Section A');
  const [subjectId, setSubjectId] = useState('CS301');
  const [assessmentType, setAssessmentType] = useState('MID_1');
  const [maxMarks, setMaxMarks] = useState(30);

  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({}); // { studentId: number }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load students for section
  useEffect(() => {
    async function fetchRoster() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getSectionStudents(section, { limit: 100 });
        const list = res.students || [];
        setStudents(list);

        // Pre-fill reasonable scores based on internalAvg
        const initial = {};
        list.forEach(s => {
          const est = Math.min(maxMarks, Math.max(5, Math.round((s.internalAvg / 100) * maxMarks)));
          initial[s.rollNumber] = est;
        });
        setScores(initial);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRoster();
  }, [section, maxMarks]);

  const handleScoreChange = (rollNumber, value) => {
    const num = Number(value);
    setScores(prev => ({
      ...prev,
      [rollNumber]: num
    }));
  };

  const handleSaveMarks = async () => {
    setError('');

    // Client-side score limits check
    for (const [roll, val] of Object.entries(scores)) {
      if (val > maxMarks || val < 0) {
        setError(`Score for ${roll} (${val}) violates valid range [0, ${maxMarks}].`);
        return;
      }
    }

    const marksPayload = students.map(s => ({
      studentId: s.rollNumber,
      scoreObtained: scores[s.rollNumber] ?? 0
    }));

    setSaving(true);
    try {
      const assessmentId = `ASM_${assessmentType}_${subjectId}_${section.replace(/\s+/g, '')}`;
      const res = await api.enterMarks({
        assessmentId,
        subjectId,
        sectionId: section,
        marks: marksPayload
      });

      showToast(res.message, 'success');
    } catch (err) {
      setError(err.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Continuous Assessment &amp; Marks Entry</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Autonomous Evaluation Portal</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Configuration Bar */}
      <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cc-dark mb-3">Assessment Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="3rd Year Section A">3rd Year Section A (49 Students)</option>
              <option value="3rd Year Section B">3rd Year Section B (42 Students)</option>
              <option value="3rd Year Section C">3rd Year Section C (33 Students)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="CS301">CS301 - Compiler Design</option>
              <option value="CS302">CS302 - Operating Systems</option>
              <option value="CS303">CS303 - Computer Networks</option>
              <option value="CS304">CS304 - Database Management Systems</option>
              <option value="CS305">CS305 - Machine Learning Foundations</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Assessment Type</label>
            <select
              value={assessmentType}
              onChange={(e) => {
                setAssessmentType(e.target.value);
                setMaxMarks(e.target.value.includes('ASSIGN') ? 10 : 30);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="MID_1">Mid-Term Examination I (Max: 30)</option>
              <option value="MID_2">Mid-Term Examination II (Max: 30)</option>
              <option value="ASSIGNMENT_1">Assignment I (Max: 10)</option>
              <option value="ASSIGNMENT_2">Assignment II (Max: 10)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Maximum Marks Limit</label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-cc-dark" />
            <h3 className="text-sm font-bold text-cc-navy">
              Score Entry: {subjectId} &bull; {assessmentType} (Max: {maxMarks} Marks)
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cc-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-cc-hover outline-none w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 bg-white shadow-xs z-10">
              <tr className="bg-cc-surface/50 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3 text-center">Historical Avg</th>
                <th className="py-3 px-4 text-center">Score Obtained (0 - {maxMarks})</th>
                <th className="py-3 px-3 text-center">Pass Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cc-surface/60">
              {filteredStudents.map((s) => {
                const val = scores[s.rollNumber] ?? 0;
                const isOver = val > maxMarks || val < 0;
                const isPass = val >= Math.round(maxMarks * 0.4);

                return (
                  <tr key={s.rollNumber} className="hover:bg-cc-bg/30 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-cc-navy">{s.rollNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-cc-navy">{s.name}</td>
                    <td className="py-2.5 px-3 text-center text-cc-slate font-mono">{s.internalAvg}%</td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={val}
                        onChange={(e) => handleScoreChange(s.rollNumber, e.target.value)}
                        className={`w-24 text-center py-1 rounded-lg border text-sm font-mono font-bold outline-none transition ${
                          isOver
                            ? 'border-rose-500 bg-rose-50 text-rose-800'
                            : 'border-cc-hover focus:border-cc-teal bg-white text-cc-navy'
                        }`}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {isPass ? (
                        <span className="text-emerald-700 text-xs font-semibold">Passing</span>
                      ) : (
                        <span className="text-rose-700 text-xs font-semibold">Below 40%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-5 bg-cc-bg/30 border-t border-cc-surface flex items-center justify-between">
          <span className="text-xs text-cc-slate">
            Scored {filteredStudents.length} student records for {assessmentType}.
          </span>

          <button
            onClick={handleSaveMarks}
            disabled={saving || loading || students.length === 0}
            className="px-6 py-2.5 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Validating & Saving...' : 'Save Assessment Marks'}
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
