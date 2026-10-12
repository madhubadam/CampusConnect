import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function HodOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('presentation'); // 'presentation' | 'official'

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getHodOverview({
          dataSource,
          mode: dataSource === 'official' ? 'live' : 'demo'
        });
        setData(res);
      } catch (err) {
        console.error('Failed to load HOD dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataSource]);

  if (loading && !data) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Department Intelligence...</div>;
  }

  const stats = data?.stats || {};
  const sections = data?.sectionStats || [];
  const hodDisplayName = user?.name || data?.hodName || 'Head of Department';

  // Primary risk distribution using No Risk / Risk terminology
  const pieData = [
    { name: 'No Risk', value: stats.noRiskCount || 99, color: '#10B981' },
    { name: 'Attendance Risk (<75%)', value: stats.belowThresholdCount || 25, color: '#F59E0B' },
    { name: 'Academic Risk (<40%)', value: stats.highRiskCount || 8, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Institutional Header */}
      <div className="bg-gradient-to-r from-white via-cc-surface/50 to-white p-6 rounded-2xl border border-cc-surface shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cc-dark">Department Head Executive Oversight</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cc-navy mt-1">
            {data?.department || 'Computer Science & Engineering'} Portal
          </h1>
          <p className="text-xs text-cc-slate mt-1">
            {data?.institution || 'Bonam Venkata Chalamaya Engineering College'} &bull; {hodDisplayName} (HOD)
          </p>
        </div>

        {/* Executive Dataset Selection */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-cc-surface shadow-xs text-xs">
          <Filter className="w-3.5 h-3.5 text-cc-slate shrink-0" />
          <span className="font-semibold text-cc-navy">Data Source:</span>
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            className="bg-cc-surface/40 px-2.5 py-1 rounded-lg font-bold text-cc-dark border border-cc-teal/30 outline-none cursor-pointer"
          >
            <option value="presentation">Presentation Dataset (Demo Data)</option>
            <option value="official">Official Academic Records</option>
          </select>
        </div>
      </div>

      {/* Metrics Row - 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total CSE Students"
          value={stats.totalStudents || 124}
          subtitle="Sections A (49), B (42), C (33)"
          icon={GraduationCap}
          color="teal"
          trend={`No Risk: ${stats.noRiskCount || 99} • Risk: ${stats.riskCount || 25}`}
        />

        <StatCard
          title="Faculty Members"
          value={stats.totalFaculty || 4}
          subtitle="Core Theory & Lab Faculty"
          icon={Users}
          color="purple"
          trend="100% Workload Allocated"
        />

        <StatCard
          title="Attendance Standing"
          value={`${stats.aboveThresholdCount || 99} Above`}
          subtitle={`Mandatory Cutoff: ${stats.attendanceThreshold || 75.0}%`}
          icon={CalendarCheck}
          color="blue"
          trend={`${stats.belowThresholdCount || 25} Below 75% (${stats.belowThresholdPercentage || '20.2'}%)`}
        />

        <StatCard
          title="Fee Payment Status"
          value={`${stats.feesPaidCount || 99} Paid`}
          subtitle={`${stats.feesDueCount || 25} Outstanding Dues`}
          icon={CreditCard}
          color="green"
          trend={`${stats.feeCollectionRate || '79.8%'} Collection Rate`}
        />
      </div>

      {/* Section-Wise Comparisons & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Comparison Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-cc-surface shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-cc-navy">Section-Wise Performance &amp; Risk Standing</h3>
              <p className="text-xs text-cc-muted">III Year B.Tech CSE (Section A: 49, Section B: 42, Section C: 33)</p>
            </div>
            <Link to="/hod/sections" className="text-xs font-semibold text-cc-dark hover:underline flex items-center gap-1">
              Section Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-cc-surface/40 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-3 text-center">Enrolled</th>
                  <th className="py-3 px-3 text-center">Attendance (&gt;75% / &lt;75%)</th>
                  <th className="py-3 px-3 text-center">Fees (Paid / Due)</th>
                  <th className="py-3 px-4 text-center">Risk Standing (No Risk / Risk)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface/60">
                {sections.map((sec) => (
                  <tr key={sec.section} className="hover:bg-cc-bg/30 transition">
                    <td className="py-3 px-4 font-bold text-cc-navy">{sec.section}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cc-dark">{sec.totalStudents}</td>
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <span className="text-emerald-700 font-bold">{sec.aboveThresholdCount} Above</span>
                      <span className="text-cc-muted mx-1">/</span>
                      <span className="text-rose-700 font-bold">{sec.belowThresholdCount} Below</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <span className="text-emerald-700 font-bold">{sec.feesPaidCount} Paid</span>
                      <span className="text-cc-muted mx-1">/</span>
                      <span className="text-amber-700 font-bold">{sec.feesDueCount} Due</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                          {sec.noRiskCount} No Risk
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                          {sec.riskCount} Risk
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic & Attendance Risk Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-cc-surface shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-cc-dark" />
              <h3 className="text-base font-bold text-cc-navy">Student Risk Distribution</h3>
            </div>
            <p className="text-xs text-cc-muted">Evaluated Against Attendance (&gt;75%) &amp; Passing Cutoff (&gt;40%)</p>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} Students`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-cc-surface text-xs">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-cc-slate font-medium">{p.name}</span>
                </span>
                <strong className="text-cc-navy font-mono">{p.value} students</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
