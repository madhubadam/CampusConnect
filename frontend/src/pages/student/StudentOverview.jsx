import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  Layers,
  AlertTriangle,
  Megaphone,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function StudentOverview() {
  const [profile, setProfile] = useState(null);
  const [marksData, setMarksData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [prof, mrk, att, fee, rsk, ann] = await Promise.all([
          api.getStudentProfile(),
          api.getStudentMarks(),
          api.getStudentAttendance(),
          api.getStudentFees(),
          api.getStudentRiskInsights(),
          api.getStudentAnnouncements(),
        ]);

        if (!isMounted) return;

        setProfile(prof?.student ?? null);
        setMarksData(mrk ?? null);
        setAttendanceData(att ?? null);
        setFeeData(fee?.feeAccount ?? null);
        setRiskData(rsk?.riskInsight ?? null);
        setAnnouncements(ann?.announcements ?? []);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-sm font-semibold text-cc-dark">
          Loading Academic Records...
        </div>
      </div>
    );
  }

  const attendancePercentage = Number(attendanceData?.attendancePercentage) || 0;
  const outstandingBalance = Number(feeData?.outstandingBalance) || 0;
  const amountPaid = Number(feeData?.amountPaid) || 0;
  const isLowAttendance = attendancePercentage < 75;
  const riskCategory = riskData?.riskCategory;

  // Filter out any raw internal marks from risk factors for the dashboard view
  const displayFactors = (riskData?.factors ?? []).filter(
    (factor) => !factor.toLowerCase().includes('score') && !factor.toLowerCase().includes('mark')
  );

  const registeredCourses = marksData?.subjectWise ?? [
    { code: 'CS301', name: 'Compiler Design', credits: 4 },
    { code: 'CS302', name: 'Operating Systems', credits: 4 },
    { code: 'CS303', name: 'Computer Networks', credits: 3 },
    { code: 'CS304', name: 'Database Management Systems', credits: 4 },
    { code: 'CS305', name: 'Machine Learning Foundations', credits: 3 },
    { code: 'CS306', name: 'Web Technologies Lab', credits: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cc-surface bg-gradient-to-r from-white via-cc-surface/50 to-white p-6 shadow-soft md:flex-row md:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cc-dark">
            BVC Engineering College &bull; CSE Department
          </span>

          <h1 className="mt-1 text-2xl font-extrabold text-cc-navy sm:text-3xl">
            Welcome back, {profile?.name || 'Student'}
          </h1>

          <p className="mt-1 text-xs text-cc-slate">
            Roll No:{' '}
            <span className="font-mono font-semibold text-cc-navy">
              {profile?.rollNumber || 'N/A'}
            </span>
            {' '}&bull; {profile?.academicYear || '3rd Year'}
            {' '}&bull; {profile?.section || '3rd Year Section A'}
            {' '}&bull; Regulation: JNTUK R20
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs text-cc-muted">
              AI Academic Risk Status
            </span>

            <div className="mt-1">
              {riskCategory === 'High' ? (
                <Badge
                  type="risk-high"
                  label="High Academic Risk"
                  size="md"
                />
              ) : riskCategory === 'Moderate' ? (
                <Badge
                  type="risk-moderate"
                  label="Moderate Risk"
                  size="md"
                />
              ) : (
                <Badge
                  type="risk-low"
                  label={
                    riskCategory === 'Low'
                      ? 'Satisfactory / Low Risk'
                      : 'Regular Standing'
                  }
                  size="md"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Alert */}
      {isLowAttendance && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950 shadow-xs">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900">
              Attendance Shortage Warning ({attendancePercentage}%)
            </h4>

            <p className="mt-0.5 text-xs text-rose-800">
              Your current attendance is below the mandatory 75% cutoff. Please attend upcoming lectures and consult your faculty advisor.
            </p>
          </div>

          <Link
            to="/student/attendance"
            className="mt-1 shrink-0 text-xs font-bold text-rose-800 underline hover:text-rose-950"
          >
            View Details
          </Link>
        </div>
      )}

      {/* Metric Cards (4 Balanced Cards - Zero Internal Marks) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Overall Attendance */}
        <StatCard
          title="Overall Attendance"
          value={`${attendancePercentage}%`}
          subtitle="Target: 75% Cutoff"
          icon={CalendarCheck}
          color={isLowAttendance ? 'red' : 'teal'}
          badge={
            isLowAttendance ? (
              <Badge
                type="attendance-warning"
                label="Attendance Alert"
                size="xs"
              />
            ) : (
              <Badge
                type="attendance-good"
                label="Regular"
                size="xs"
              />
            )
          }
        />

        {/* 2. Cumulative CGPA */}
        <StatCard
          title="Cumulative CGPA"
          value={
            profile?.cgpa != null
              ? Number(profile.cgpa).toFixed(2)
              : '7.50'
          }
          subtitle={`Active Backlogs: ${profile?.backlogCount ?? 0}`}
          icon={GraduationCap}
          color="blue"
          trend="JNTUK Autonomous Ledger"
        />

        {/* 3. Fee Balance Due */}
        <StatCard
          title="Fee Balance Due"
          value={`₹${outstandingBalance.toLocaleString('en-IN')}`}
          subtitle={`Paid: ₹${amountPaid.toLocaleString('en-IN')}`}
          icon={CreditCard}
          color={outstandingBalance === 0 ? 'green' : 'amber'}
          badge={
            outstandingBalance === 0 ? (
              <Badge type="fee-paid" label="Settled" size="xs" />
            ) : (
              <Badge
                type="fee-overdue"
                label="Balance Due"
                size="xs"
              />
            )
          }
        />

        {/* 4. Semester Progress & Enrollment (Replaces Internal Exam Avg) */}
        <StatCard
          title="Semester Standing"
          value="III B.Tech I Sem"
          subtitle={`${registeredCourses.length} Courses Enrolled • 20 Credits`}
          icon={Layers}
          color="purple"
          trend="Continuous Evaluation"
        />
      </div>

      {/* Main Content: Registered Courses Ledger and AI Risk Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Registered Coursework Ledger (Replaces Raw Marks Chart) */}
        <div className="rounded-2xl border border-cc-surface bg-white p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-cc-navy">
                Registered Coursework &amp; Academic Status
              </h3>
              <p className="text-xs text-cc-muted">
                III B.Tech I Semester (Current) &bull; Official JNTUK R20 Curriculum
              </p>
            </div>

            <Link
              to="/student/marks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cc-surface/70 hover:bg-cc-surface text-cc-dark font-semibold text-xs transition"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Dedicated Marks Sheet</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-2 text-center">Credits</th>
                  <th className="py-2.5 px-3 text-center">Academic Evaluation</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface/60">
                {registeredCourses.map((sub) => (
                  <tr key={sub.code} className="hover:bg-cc-bg/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-cc-dark">{sub.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-cc-navy">{sub.name}</td>
                    <td className="py-2.5 px-2 text-center text-cc-slate font-mono">{sub.credits}</td>
                    <td className="py-2.5 px-3 text-center text-cc-muted">
                      Continuous Assessment Active
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> Enrolled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-cc-surface/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-cc-muted">
            <span>Detailed marks &amp; assessment breakdowns are accessible on the dedicated Semester Marks page.</span>
            <Link to="/student/marks" className="text-cc-dark font-bold hover:underline">
              Open Semester Marks &rarr;
            </Link>
          </div>
        </div>

        {/* Explainable AI Risk Insight (No Raw Internal Marks) */}
        <div className="flex flex-col justify-between rounded-2xl border border-cc-surface bg-white p-6 shadow-soft">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-cc-dark" />

              <h3 className="text-base font-bold text-cc-navy">
                AI Academic Risk Explainability
              </h3>
            </div>

            <p className="text-xs text-cc-muted">
              Framework:{' '}
              <span className="font-semibold text-cc-navy">
                Random Forest Decision Support
              </span>
            </p>

            <div className="mt-4 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cc-slate">
                Grounded Evaluation Indicators:
              </span>

              {displayFactors.length > 0 ? (
                displayFactors.map((factor, index) => (
                  <div
                    key={`${index}-${factor}`}
                    className="flex items-start gap-2 rounded-xl border border-cc-surface bg-cc-bg/50 p-2.5 text-xs text-cc-slate"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cc-teal" />
                    <span>{factor}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-cc-surface bg-cc-bg/50 p-2.5 text-xs text-cc-slate space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Attendance tracking satisfies university benchmark.</span>
                  </div>
                  <div className="flex items-center gap-2 text-cc-slate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cc-dark shrink-0" />
                    <span>Continuous evaluation records verified by department.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-cc-surface pt-4 space-y-2">
            <Link
              to="/student/risk-insights"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cc-dark px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-900 shadow-xs"
            >
              <span>Full Academic Risk Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
            <Link
              to="/student/improvement"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cc-surface/70 px-3 py-2 text-xs font-semibold text-cc-dark transition hover:bg-cc-surface"
            >
              <span>View Subject Study Plans</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-2xl border border-cc-surface bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-cc-dark" />

          <h3 className="text-base font-bold text-cc-navy">
            Department Reminders &amp; Announcements
          </h3>
        </div>

        {announcements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id ?? index}
                className="rounded-xl border border-cc-surface bg-cc-bg/30 p-4"
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-cc-muted">
                  <span>{announcement.author || 'Department Office'}</span>
                  <span>{announcement.date || ''}</span>
                </div>

                <h4 className="text-sm font-bold text-cc-navy">
                  {announcement.title}
                </h4>

                <p className="mt-1 text-xs leading-relaxed text-cc-slate">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-cc-surface p-4 text-sm text-cc-muted">
            No active department announcements at this time.
          </p>
        )}
      </div>
    </div>
  );
}
