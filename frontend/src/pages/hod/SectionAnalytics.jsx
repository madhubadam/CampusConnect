import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, ShieldAlert, Filter, CalendarCheck, CreditCard } from 'lucide-react';

export function SectionAnalytics() {
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
        console.error('Failed to load section analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataSource]);

  if (loading && !data) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Aggregating Section Analytics...</div>;
  }

  const sections = data?.sectionStats || [];

  const comparisonChartData = sections.map(s => ({
    name: s.section.replace('3rd Year ', ''),
    Attendance: s.avgAttendance,
    Marks: s.avgMarks,
    Target: 75
  }));

  const riskChartData = sections.map(s => ({
    name: s.section.replace('3rd Year ', ''),
    NoRisk: s.noRiskCount,
    Risk: s.riskCount
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Section-Wise Comparative Analytics</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; III Year CSE (Section A, B, C)</p>
        </div>

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

      {/* Main Bar Chart: Attendance vs Marks */}
      <div className="bg-white rounded-2xl p-6 border border-cc-surface shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cc-dark" />
          <div>
            <h3 className="text-base font-bold text-cc-navy">Academic Performance &amp; Attendance Averages</h3>
            <p className="text-xs text-cc-muted">Comparative Percentage Metrics across CSE Sections</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3FDFD" />
              <XAxis dataKey="name" tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #A6E3E9' }} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Bar dataKey="Attendance" fill="#71C9CE" name="Avg Attendance %" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Marks" fill="#0C6B75" name="Avg Internal Marks %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Standing & Section Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* No Risk vs Risk Comparison Chart */}
        <div className="bg-white rounded-2xl p-6 border border-cc-surface shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-cc-dark" />
            <div>
              <h3 className="text-base font-bold text-cc-navy">Student Risk Classification by Section</h3>
              <p className="text-xs text-cc-muted">No Risk (Compliant Standing) vs Risk (Flagged Students)</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3FDFD" />
                <XAxis dataKey="name" tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
                <YAxis tick={{ fill: '#334E68', fontSize: 12 }} axisLine={{ stroke: '#CBF1F5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #A6E3E9' }} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="NoRisk" fill="#10B981" name="No Risk" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Risk" fill="#EF4444" name="Risk" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Breakdown Cards */}
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.section} className="p-4 rounded-2xl bg-white border border-cc-surface shadow-soft flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-cc-navy">{s.section}</h4>
                <p className="text-xs text-cc-muted mt-0.5">
                  Total Enrolled: <strong className="text-cc-navy font-mono">{s.totalStudents}</strong> Students
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {s.aboveThresholdCount} Above 75% ({s.aboveThresholdPercentage}%)
                  </span>
                  <span className="text-blue-700 font-semibold inline-flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {s.feesPaidCount} Paid ({s.feesPaidPercentage}%)
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 block mb-1">
                  {s.noRiskCount} No Risk
                </span>
                <span className="text-[11px] text-rose-700 font-semibold">
                  {s.riskCount} Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
