import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  BookOpen,
  Search,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export function AttendanceMarking() {
  const { showToast } = useAuth();

  const [section, setSection] = useState('3rd Year Section A');
  const [subjectId, setSubjectId] = useState('CS301');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionSlot, setSessionSlot] = useState('09:30 AM - 10:30 AM');

  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load students for active section
  useEffect(() => {
    async function fetchRoster() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getSectionStudents(section, { limit: 100 });
        const list = res.students || [];
        setStudents(list);

        // Default all to PRESENT
        const initial = {};
        list.forEach(s => {
          initial[s.rollNumber] = 'PRESENT';
        });
        setRecords(initial);
      } catch (err) {
        setError(err.message || 'Failed to fetch section roster');
      } finally {
        setLoading(false);
      }
    }
    fetchRoster();
  }, [section]);

  const handleToggle = (rollNumber, status) => {
    setRecords(prev => ({
      ...prev,
      [rollNumber]: status
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.rollNumber] = status;
    });
    setRecords(updated);
  };

  const presentCount = Object.values(records).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(records).filter(s => s === 'ABSENT').length;
  const unmarkedCount = students.length - (presentCount + absentCount);

  const handleSaveAttendance = async () => {
    setError('');
    if (unmarkedCount > 0) {
      setError(`Warning: ${unmarkedCount} student(s) remain unmarked.`);
      return;
    }

    const payloadRecords = students.map(s => ({
      studentId: s.rollNumber,
      status: records[s.rollNumber] || 'ABSENT'
    }));

    setSaving(true);
    try {
      const res = await api.markAttendance({
        sectionId: section,
        subjectId,
        sessionDate,
        sessionSlot,
        records: payloadRecords
      });

      showToast(res.message, 'success');
    } catch (err) {
      setError(err.message || 'Failed to save attendance session.');
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Class Session Attendance Marking</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; CSE Department</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Session Configuration Card */}
      <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cc-dark mb-3">1. Session Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Assigned Section</label>
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
            <label className="block text-xs font-semibold text-cc-slate mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Time Slot</label>
            <select
              value={sessionSlot}
              onChange={(e) => setSessionSlot(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM (Period 1)</option>
              <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM (Period 2)</option>
              <option value="11:45 AM - 12:45 PM">11:45 AM - 12:45 PM (Period 3)</option>
              <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM (Period 4)</option>
              <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM (Period 5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster & Marking Controls */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cc-navy">
              2. Student Roster ({students.length} Total)
            </span>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                Present: {presentCount}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
                Absent: {absentCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-cc-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roll or name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-cc-hover outline-none w-48"
              />
            </div>
            <button
              type="button"
              onClick={() => markAll('PRESENT')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('ABSENT')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student items grid */}
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-cc-dark font-medium animate-pulse">
              Loading enrolled students...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredStudents.map((s) => {
                const currentStatus = records[s.rollNumber] || 'PRESENT';
                const isPresent = currentStatus === 'PRESENT';

                return (
                  <div
                    key={s.rollNumber}
                    onClick={() => handleToggle(s.rollNumber, isPresent ? 'ABSENT' : 'PRESENT')}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition flex items-center justify-between ${
                      isPresent
                        ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                        : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-cc-navy block">{s.rollNumber}</span>
                      <span className="text-xs font-medium text-cc-slate truncate block max-w-[160px]">{s.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {isPresent ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Confirmation Bar */}
        <div className="p-4 sm:p-5 bg-cc-bg/30 border-t border-cc-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-cc-slate">
            Summary: <strong className="text-emerald-700">{presentCount} Present</strong>,{' '}
            <strong className="text-rose-700">{absentCount} Absent</strong> ({students.length} total enrolled in {section})
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || students.length === 0}
            className="px-6 py-2.5 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'Recording Session...' : 'Review & Confirm Attendance Save'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
