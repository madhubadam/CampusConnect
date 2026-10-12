import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  BarChart3,
  List
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AttendanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1); // default to Week 2 or current

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await api.getStudentAttendance();
        setData(res);
        if (res.weeklyBreakdown && res.weeklyBreakdown.length > 0) {
          setSelectedWeekIndex(res.weeklyBreakdown.length - 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Attendance Ledger...</div>;
  }

  const isWarning = data?.isBelowWarning;
  const sessions = data?.recentSessions || [];
  const weeks = data?.weeklyBreakdown || [];
  const activeWeek = weeks[selectedWeekIndex] || weeks[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Attendance Analytics &amp; Session Ledger</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Academic Regulations (75% Statutory Cutoff)</p>
        </div>

        <div className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 ${
          isWarning
            ? 'bg-rose-50 border-rose-300 text-rose-800'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <CalendarCheck className="w-4 h-4" />
          <span>Cumulative Attendance: {data?.attendancePercentage}%</span>
        </div>
      </div>

      {/* Statutory warning */}
      {isWarning && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Attendance Condonation Notice</h4>
            <p className="text-xs text-rose-800 mt-0.5">
              Your attendance ({data?.attendancePercentage}%) is currently below the JNTUK university statutory minimum requirement of 75.0%. You may be liable for condonation fees or barred from end-semester practical/theory examinations if attendance does not improve.
            </p>
          </div>
        </div>
      )}

      {/* 3-View Switcher Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-cc-surface shadow-xs">
        <button
          onClick={() => setViewMode('day')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'day'
              ? 'bg-cc-dark text-white shadow-xs'
              : 'text-cc-navy hover:bg-cc-surface/70'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Day-wise Ledger</span>
        </button>

        <button
          onClick={() => setViewMode('week')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'week'
              ? 'bg-cc-dark text-white shadow-xs'
              : 'text-cc-navy hover:bg-cc-surface/70'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Week-wise Attendance</span>
        </button>

        <button
          onClick={() => setViewMode('month')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'month'
              ? 'bg-cc-dark text-white shadow-xs'
              : 'text-cc-navy hover:bg-cc-surface/70'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Month-wise Trend</span>
        </button>
      </div>

      {/* VIEW 1: WEEK-WISE ATTENDANCE */}
      {viewMode === 'week' && (
        <div className="space-y-5">
          {/* Week Navigation Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cc-surface shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                disabled={selectedWeekIndex <= 0}
                onClick={() => setSelectedWeekIndex(prev => Math.max(0, prev - 1))}
                className="p-2 rounded-xl border border-cc-surface bg-white text-cc-navy hover:bg-cc-surface disabled:opacity-40 transition cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[10px] text-cc-muted font-bold uppercase tracking-wider block">Selected Week Period</span>
                <h3 className="text-sm font-extrabold text-cc-navy">
                  {activeWeek?.label}
                </h3>
              </div>

              <button
                disabled={selectedWeekIndex >= weeks.length - 1}
                onClick={() => setSelectedWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                className="p-2 rounded-xl border border-cc-surface bg-white text-cc-navy hover:bg-cc-surface disabled:opacity-40 transition cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekly Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-cc-bg/30 px-3 py-1.5 rounded-xl border border-cc-surface text-center">
                <span className="text-[10px] text-cc-muted block">Eligible Sessions</span>
                <span className="font-bold text-cc-navy font-mono">{activeWeek?.eligibleSessions || 0}</span>
              </div>
              <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 block">Attended</span>
                <span className="font-bold text-emerald-700 font-mono">{activeWeek?.presentSessions || 0}</span>
              </div>
              <div className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-center">
                <span className="text-[10px] text-rose-800 block">Absent</span>
                <span className="font-bold text-rose-700 font-mono">{activeWeek?.absentSessions || 0}</span>
              </div>
              <div className="bg-white px-3.5 py-1.5 rounded-xl border border-cc-surface text-center shadow-xs">
                <span className="text-[10px] text-cc-muted block">Weekly %</span>
                <span className={`font-extrabold font-mono text-sm ${activeWeek?.weeklyPercentage < 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {activeWeek?.weeklyPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Week Sessions Table */}
          <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cc-dark" />
                <h3 className="text-sm font-bold text-cc-navy">Sessions Conducted in Selected Week</h3>
              </div>
              <span className="text-xs text-cc-muted">
                {activeWeek?.startDate} to {activeWeek?.endDate}
              </span>
            </div>

            {activeWeek?.sessions && activeWeek.sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                      <th className="py-3 px-4">Session Date</th>
                      <th className="py-3 px-4">Time Slot</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cc-surface/60">
                    {activeWeek.sessions.map((sess, idx) => (
                      <tr key={idx} className="hover:bg-cc-bg/30 transition">
                        <td className="py-3 px-4 font-mono font-medium text-cc-navy">{sess.date}</td>
                        <td className="py-3 px-4 text-cc-slate">{sess.timeSlot}</td>
                        <td className="py-3 px-4 font-semibold text-cc-navy">{sess.subjectName}</td>
                        <td className="py-3 px-4 text-cc-slate">{sess.facultyName}</td>
                        <td className="py-3 px-4 text-center">
                          {sess.status === 'PRESENT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                              <XCircle className="w-3.5 h-3.5" /> Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-cc-muted">
                No academic sessions were scheduled or conducted during this weekly window (e.g. holidays or mid-term study period).
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DAY-WISE ATTENDANCE */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cc-dark" />
              <h3 className="text-sm font-bold text-cc-navy">Chronological Day-wise Attendance Ledger</h3>
            </div>
            <span className="text-xs text-cc-muted">{sessions.length} Recorded Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface/60">
                {sessions.map((sess, idx) => (
                  <tr key={idx} className="hover:bg-cc-bg/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-cc-navy">{sess.date}</td>
                    <td className="py-3 px-4 text-cc-slate">{sess.timeSlot}</td>
                    <td className="py-3 px-4 font-semibold text-cc-navy">{sess.subjectName}</td>
                    <td className="py-3 px-4 text-cc-slate">{sess.facultyName}</td>
                    <td className="py-3 px-4 text-center">
                      {sess.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTH-WISE ATTENDANCE */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-cc-surface shadow-soft">
            <h3 className="text-base font-bold text-cc-navy mb-1">Monthly Attendance Trend</h3>
            <p className="text-xs text-cc-muted mb-4">Percentage presence across enrolled subjects</p>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3FDFD" />
                  <XAxis dataKey="month" tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #A6E3E9' }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="#71C9CE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-cc-surface shadow-soft flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-cc-navy mb-3">Academic Guidelines</h3>
              <div className="space-y-3 text-xs text-cc-slate">
                <div className="p-3 rounded-xl bg-cc-bg/40 border border-cc-surface">
                  <span className="font-bold text-cc-navy block">&ge; 75.0% - Regular Eligibility</span>
                  <span className="text-cc-muted">Full clearance for university laboratory and theory examinations.</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="font-bold text-amber-900 block">65.0% - 74.9% - Condonation Range</span>
                  <span className="text-amber-800">Requires medical/institutional proof and Principal sanction.</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="font-bold text-rose-900 block">&lt; 65.0% - Detention Risk</span>
                  <span className="text-rose-800">Ineligible for end examinations; requires semester re-admission.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
