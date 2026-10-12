import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  ShieldAlert, 
  GraduationCap, 
  Layers, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  TrendingDown,
  Sliders
} from 'lucide-react';

export function FacultyOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configured attendance threshold cutoff
  const [threshold, setThreshold] = useState(75);

  // Active ledger tab and search
  const [activeLedgerTab, setActiveLedgerTab] = useState('all'); // 'all' | 'attendance' | 'risk' | 'failing'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network request timed out. Please check backend connection.')), 8000)
    );

    try {
      const res = await Promise.race([
        api.getFacultyOverview({ threshold }),
        timeoutPromise
      ]);
      if (res && res.success !== false) {
        setData(res);
      } else {
        throw new Error(res?.message || 'Failed to load faculty overview workspace.');
      }
    } catch (err) {
      console.error('[FacultyOverview Load Error]:', err);
      setError(err.message || 'An unexpected error occurred while loading your workspace.');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Loading State
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-cc-surface border-t-cc-dark rounded-full animate-spin" />
        <div className="text-sm text-cc-dark font-bold animate-pulse">Loading Faculty Workspace...</div>
        <p className="text-xs text-cc-muted">Retrieving authoritative student rosters, attendance tracking, and risk analytics</p>
      </div>
    );
  }

  // Error State with Retry
  if (error && !data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-soft max-w-xl mx-auto my-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-cc-navy">Unable to Load Faculty Workspace</h2>
        <p className="text-xs text-rose-700 leading-relaxed max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <button
            onClick={loadOverview}
            className="px-5 py-2.5 rounded-xl bg-cc-dark hover:bg-teal-900 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" /> Retry Workspace Load
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const faculty = data?.faculty || {};
  const sectionBreakdown = data?.sectionBreakdown || [];
  const allStudents = data?.allMonitoredStudents || [];
  const lowAttendanceStudents = data?.lowAttendanceStudents || [];
  const failingStudents = data?.failingStudents || [];
  const atRiskStudents = data?.atRiskStudents || [];

  // Filter students for the monitoring ledger
  const displayedStudents = (allStudents || []).filter((s) => {
    // Section filter
    if (selectedSectionFilter !== 'ALL' && s.section !== selectedSectionFilter) {
      return false;
    }

    // Ledger tab filter
    if (activeLedgerTab === 'attendance' && s.attendancePercentage >= threshold) {
      return false;
    }
    if (activeLedgerTab === 'risk' && s.riskCategory !== 'Risk') {
      return false;
    }
    if (activeLedgerTab === 'failing' && s.internalAvg >= 40.0 && s.academicStatus !== 'Failing') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const rollMatch = (s.rollNumber || s.registrationNumber || '').toLowerCase().includes(q);
      return nameMatch || rollMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Faculty Metadata, Demo Badge, and Controls */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-teal-50/40 p-6 rounded-3xl border border-teal-100 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-cc-dark text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-cc-dark" />
            <span>Bonam Venkata Chalamaya Engineering College &bull; {faculty.department || 'CSE'} Department</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cc-navy tracking-tight">
            Faculty Overview: {faculty.name || 'Faculty Member'}
          </h1>
          <div className="text-xs text-cc-slate mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-cc-navy bg-teal-50 text-cc-dark px-2.5 py-0.5 rounded-full border border-teal-200">
              {faculty.designation || 'Faculty Member'}
            </span>
            <span>&bull;</span>
            <span className="font-mono text-cc-dark">{faculty.email}</span>
            {faculty.employeeId && (
              <>
                <span>&bull;</span>
                <span className="font-mono text-cc-muted">Employee ID: {faculty.employeeId}</span>
              </>
            )}
          </div>
        </div>

        {/* Workspace Controls (Threshold Cutoff & Refresh) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Attendance Threshold Selector */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-cc-surface text-xs shadow-xs">
            <Sliders className="w-3.5 h-3.5 text-cc-dark" />
            <span className="text-cc-muted font-medium">Cutoff:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-transparent font-bold text-cc-navy focus:outline-none cursor-pointer"
            >
              <option value={70}>70%</option>
              <option value={75}>75% (Standard)</option>
              <option value={80}>80%</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadOverview}
            disabled={loading}
            className="px-3.5 py-2 rounded-2xl bg-white border border-cc-surface hover:border-cc-dark text-cc-dark hover:bg-cc-bg shadow-xs transition disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
            title="Refresh Overview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Informative Summary Cards (2 Rows of 3 Spacious Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Accessible Students */}
        <StatCard
          title="Accessible Students"
          value={stats.totalStudents || 0}
          subtitle={`Dept Total: ${stats.departmentTotal || 124}`}
          icon={Users}
          color="teal"
          trend="Authoritative Roster"
        />

        {/* 2. Authorized Sections */}
        <StatCard
          title="Authorized Sections"
          value={`${stats.assignedSections?.length || 3} Classes`}
          subtitle="3rd Year Sections A, B & C"
          icon={Layers}
          color="blue"
          trend="CSE III Year"
        />

        {/* 3. Attendance Summary (>75% vs <75%) */}
        <StatCard
          title="Attendance Standing"
          value={`${stats.aboveAttendanceCount || 0} / ${stats.totalStudents || 0}`}
          subtitle={`${stats.aboveAttendanceCount || 0} Above ${threshold}% • ${stats.belowAttendanceCount || 0} Below ${threshold}%${stats.exactAttendanceCount > 0 ? ` • ${stats.exactAttendanceCount} Exactly ${threshold}%` : ''}`}
          icon={CalendarCheck}
          color={stats.belowAttendanceCount > 0 ? 'amber' : 'green'}
          trend={`${stats.averageAttendance || 0}% Class Average`}
        />

        {/* 4. Fee Payment Summary */}
        <StatCard
          title="Fee Collection"
          value={`${stats.feePaidCount || 0} Paid`}
          subtitle={`${stats.feeDueCount || 0} Outstanding (${stats.totalStudents > 0 ? Math.round((stats.feePaidCount / stats.totalStudents) * 100) : 80}% Clear)`}
          icon={CreditCard}
          color="green"
          trend={`₹${((stats.totalFeesCollected || 0) / 100000).toFixed(1)}L Collected`}
        />

        {/* 5. Student Risk Profile (No Risk vs Risk) */}
        <StatCard
          title="Student Risk Profile"
          value={`${stats.noRiskCount || 0} No Risk`}
          subtitle={`${stats.riskCount || 0} Flagged at Risk (${stats.noRiskPercentage || '79.8'}% Healthy)`}
          icon={ShieldAlert}
          color={stats.riskCount > 0 ? 'red' : 'green'}
          trend="Institutional Risk Model"
        />

        {/* 6. Academic Performance Summary */}
        <StatCard
          title="Academic Marks"
          value={`${stats.averageMarks || 0}%`}
          subtitle={`${stats.failingCount || 0} Below 40% Pass Standard`}
          icon={GraduationCap}
          color={stats.failingCount > 0 ? 'amber' : 'purple'}
          trend="Internal Assessments"
        />
      </div>

      {/* Section-by-Section Breakdown (Authorized Sections) */}
      <div className="bg-white rounded-3xl p-6 border border-cc-surface shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-cc-navy">Authorized Section Breakdown</h3>
            <p className="text-xs text-cc-muted">
              Student distribution across attendance thresholds, fee status, and No Risk vs Risk classifications
            </p>
          </div>
        </div>

        {sectionBreakdown.length === 0 ? (
          <div className="p-8 text-center bg-cc-bg/30 rounded-2xl border border-cc-surface text-cc-slate text-xs">
            No sections currently assigned to your faculty profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sectionBreakdown.map((sec) => {
              const attAbovePct = sec.totalStudents > 0 ? Math.round((sec.aboveThresholdCount / sec.totalStudents) * 100) : 0;
              const feePaidPct = sec.totalStudents > 0 ? Math.round((sec.feePaidCount / sec.totalStudents) * 100) : 0;
              const noRiskPct = sec.totalStudents > 0 ? Math.round((sec.noRiskCount / sec.totalStudents) * 100) : 0;

              return (
                <div 
                  key={sec.section}
                  className="p-5 rounded-2xl bg-gradient-to-b from-white to-cc-bg/30 border border-cc-surface hover:border-teal-300 transition shadow-xs flex flex-col justify-between space-y-4"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-cc-navy tracking-tight">{sec.section}</span>
                      <span className="font-mono text-xs font-bold bg-teal-50 text-cc-dark border border-teal-200 px-2.5 py-0.5 rounded-lg">
                        {sec.totalStudents} Students
                      </span>
                    </div>
                    <p className="text-[11px] text-cc-muted">
                      Avg Attendance: <span className="font-bold text-cc-navy">{sec.averageAttendance}%</span> &bull; Internal Avg: <span className="font-bold text-cc-navy">{sec.avgMarks}%</span>
                    </p>
                  </div>

                  {/* 3 Metric Progress Bars (Attendance, Fees, Risk) */}
                  <div className="space-y-3 text-xs bg-white p-3.5 rounded-xl border border-cc-surface">
                    {/* Attendance Row */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-cc-slate font-medium">Attendance &gt;{threshold}%</span>
                        <span className="font-mono font-bold text-cc-navy">
                          {sec.aboveThresholdCount} / {sec.totalStudents} ({attAbovePct}%)
                        </span>
                      </div>
                      <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${attAbovePct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-cc-muted mt-0.5">
                        <span className="text-emerald-700 font-semibold">{sec.aboveThresholdCount} Above {threshold}%</span>
                        <span className="text-rose-600 font-semibold">{sec.belowThresholdCount} Below {threshold}%</span>
                      </div>
                    </div>

                    {/* Fees Row */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-cc-slate font-medium">Fee Standing</span>
                        <span className="font-mono font-bold text-cc-navy">
                          {sec.feePaidCount} / {sec.totalStudents} ({feePaidPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${feePaidPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-cc-muted mt-0.5">
                        <span className="text-teal-700 font-semibold">{sec.feePaidCount} Fully Paid</span>
                        <span className="text-amber-700 font-semibold">{sec.feeDueCount} Outstanding</span>
                      </div>
                    </div>

                    {/* Risk Row */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-cc-slate font-medium">Risk Status</span>
                        <span className="font-mono font-bold text-cc-navy">
                          {sec.noRiskCount} No Risk / {sec.riskCount} Risk
                        </span>
                      </div>
                      <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${noRiskPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-cc-muted mt-0.5">
                        <span className="text-blue-700 font-semibold">{sec.noRiskCount} No Risk ({noRiskPct}%)</span>
                        <span className="text-rose-600 font-semibold">{sec.riskCount} Risk ({100 - noRiskPct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Monitoring Ledger */}
      <div className="bg-white rounded-3xl border border-cc-surface shadow-soft overflow-hidden">
        {/* Ledger Header & Filters */}
        <div className="p-5 border-b border-cc-surface bg-cc-bg/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-cc-navy">Student Monitoring Ledger</h3>
            <p className="text-xs text-cc-slate mt-0.5">
              Authoritative roster with attendance, fee standing, and academic risk classifications
            </p>
          </div>

          {/* Tab Filter Switcher */}
          <div className="flex items-center gap-1.5 bg-cc-surface/70 p-1 rounded-2xl flex-wrap">
            <button
              onClick={() => setActiveLedgerTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeLedgerTab === 'all'
                  ? 'bg-white text-cc-navy shadow-xs'
                  : 'text-cc-slate hover:text-cc-navy'
              }`}
            >
              All Students ({allStudents.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeLedgerTab === 'attendance'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-cc-slate hover:text-cc-navy'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Low Attendance ({lowAttendanceStudents.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('risk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeLedgerTab === 'risk'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-cc-slate hover:text-cc-navy'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Flagged Risk ({atRiskStudents.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('failing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeLedgerTab === 'failing'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-cc-slate hover:text-cc-navy'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Failing Marks ({failingStudents.length})
            </button>
          </div>
        </div>

        {/* Search & Section Sub-filter Bar */}
        <div className="p-4 border-b border-cc-surface bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-cc-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-cc-surface bg-cc-bg/30 text-xs focus:bg-white focus:outline-none focus:border-cc-teal transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-cc-muted text-[11px] font-semibold">Filter Section:</span>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-cc-surface bg-cc-bg/30 text-xs font-bold text-cc-navy focus:bg-white focus:outline-none focus:border-cc-teal transition"
            >
              <option value="ALL">All Sections (A-C)</option>
              <option value="3rd Year Section A">3rd Year Section A</option>
              <option value="3rd Year Section B">3rd Year Section B</option>
              <option value="3rd Year Section C">3rd Year Section C</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          {displayedStudents.length === 0 ? (
            <div className="p-12 text-center text-xs text-cc-slate space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-cc-navy">No Students Found</h4>
              <p className="text-cc-muted">No student records match the selected filters or search query.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-cc-bg/60 text-cc-muted font-bold uppercase tracking-wider text-[10px] border-b border-cc-surface">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Section</th>
                  <th className="px-5 py-3 text-center">Attendance %</th>
                  <th className="px-5 py-3 text-center">Fee Status</th>
                  <th className="px-5 py-3 text-center">Internal Avg</th>
                  <th className="px-5 py-3 text-center">Risk Classification</th>
                  <th className="px-5 py-3">Primary Standing Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface">
                {displayedStudents.map((s) => {
                  const isAttLow = s.attendancePercentage < threshold;
                  const isAttExact = s.attendancePercentage === threshold;
                  const isFeePaid = s.feeStatus === 'Fully Paid';
                  const isNoRisk = s.riskCategory === 'No Risk';

                  return (
                    <tr key={s.id || s.rollNumber} className="hover:bg-cc-bg/30 transition">
                      {/* Roll Number */}
                      <td className="px-5 py-3 font-mono font-bold text-cc-navy whitespace-nowrap">
                        {s.rollNumber || s.registrationNumber}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3 font-bold text-cc-navy whitespace-nowrap">
                        {s.name}
                      </td>

                      {/* Section */}
                      <td className="px-5 py-3 text-cc-slate whitespace-nowrap">
                        {s.section}
                      </td>

                      {/* Attendance % */}
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                          isAttLow 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : isAttExact
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {s.attendancePercentage}%
                        </span>
                      </td>

                      {/* Fee Status */}
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isFeePaid
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {s.feeStatus || (isFeePaid ? 'Fully Paid' : 'Outstanding')}
                        </span>
                      </td>

                      {/* Internal Avg */}
                      <td className="px-5 py-3 text-center font-mono font-bold whitespace-nowrap">
                        <span className={s.internalAvg < 40 ? 'text-rose-600' : 'text-cc-navy'}>
                          {s.internalAvg}%
                        </span>
                      </td>

                      {/* Risk Classification (No Risk vs Risk) */}
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${
                          isNoRisk
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isNoRisk ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> No Risk
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3 text-rose-600" /> Risk
                            </>
                          )}
                        </span>
                      </td>

                      {/* Primary Standing Reason */}
                      <td className="px-5 py-3 text-cc-slate max-w-xs truncate text-[11px]">
                        {s.primaryRiskReason || s.riskReasons?.[0] || (isNoRisk ? 'Satisfactory academic standing' : 'Requires academic counseling')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Ledger Footer */}
        <div className="p-3.5 bg-cc-bg/30 border-t border-cc-surface flex items-center justify-between text-xs text-cc-muted">
          <span>Showing {displayedStudents.length} of {allStudents.length} monitored students</span>
          <span className="font-medium text-cc-slate">
            III Year CSE Roster &bull; Active Monitored Section Cohort
          </span>
        </div>
      </div>
    </div>
  );
}
