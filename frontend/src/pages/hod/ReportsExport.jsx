import React, { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users,
  Filter
} from 'lucide-react';

export function ReportsExport() {
  const { user, showToast } = useAuth();

  const [reportType, setReportType] = useState('ATTENDANCE');
  const [section, setSection] = useState('ALL');
  const [subFilter, setSubFilter] = useState('ALL');
  const [dataSource, setDataSource] = useState('presentation'); // 'presentation' | 'official'
  const [threshold, setThreshold] = useState(75);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // When report type changes, reset subFilter to 'ALL'
  const handleReportTypeChange = (newType) => {
    setReportType(newType);
    setSubFilter('ALL');
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    try {
      const res = await api.exportReport({
        reportType,
        section,
        subFilter,
        dataSource,
        threshold
      });
      setPreviewData(res);
      showToast('Official report generated successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!previewData?.csvContent) return;
    const blob = new Blob([previewData.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (previewData.reportTitle || 'Institutional_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${cleanTitle}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded successfully.', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Institutional Academic Reports Generator</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; CSE Department</p>
        </div>

        {previewData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl bg-cc-surface hover:bg-cc-hover text-cc-dark font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-cc-dark hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
          </div>
        )}
      </div>

      {/* Control Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft space-y-4 no-print">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cc-dark flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Select Report Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Section Picker */}
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Target Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="ALL">All Sections Combined (124 Students)</option>
              <option value="3rd Year Section A">3rd Year Section A (49 Students)</option>
              <option value="3rd Year Section B">3rd Year Section B (42 Students)</option>
              <option value="3rd Year Section C">3rd Year Section C (33 Students)</option>
            </select>
          </div>

          {/* Report Category */}
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="ATTENDANCE">Attendance Report</option>
              <option value="FEES">Fee Status Report</option>
              <option value="ACADEMIC_RISK">Academic Risk Report</option>
              <option value="DIRECTORY">Complete Student Roster</option>
            </select>
          </div>

          {/* Sub-filter depending on category */}
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Category Filter</label>
            {reportType === 'ATTENDANCE' && (
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
              >
                <option value="ALL">All Attendance Categories</option>
                <option value="ABOVE_75">Attendance Above 75% (&gt; 75%)</option>
                <option value="BELOW_75">Attendance Below 75% (&lt; 75%)</option>
                <option value="EXACT_75">Attendance Exactly 75%</option>
              </select>
            )}

            {reportType === 'FEES' && (
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
              >
                <option value="ALL">All Fee Categories</option>
                <option value="PAID">Fully Paid</option>
                <option value="OUTSTANDING">Unpaid / Outstanding Dues</option>
              </select>
            )}

            {reportType === 'ACADEMIC_RISK' && (
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
              >
                <option value="ALL">All Risk Categories</option>
                <option value="NO_RISK">No Risk (Compliant Standing)</option>
                <option value="RISK">Risk (Academic / Attendance / Fee Deficit)</option>
              </select>
            )}

            {reportType === 'DIRECTORY' && (
              <select
                value={subFilter}
                disabled
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-gray-50 text-cc-muted"
              >
                <option value="ALL">All Enrolled Records</option>
              </select>
            )}
          </div>

          {/* Data Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Data Source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="presentation">Presentation Dataset (Demo Data)</option>
              <option value="official">Official Academic Records</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGeneratePreview}
            disabled={loading}
            className="py-2.5 px-6 rounded-xl bg-cc-teal hover:bg-teal-500 active:scale-95 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Generating...' : 'Generate Official Report'}
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Preview & Printable Output */}
      {previewData ? (
        <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 sm:p-8 print-card">
          {/* Institutional Letterhead */}
          <div className="text-center pb-6 border-b-2 border-cc-navy/80 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-cc-navy uppercase tracking-wide">
              Bonam Venkata Chalamaya Engineering College
            </h2>
            <p className="text-xs font-semibold text-cc-slate mt-0.5">
              An Autonomous Institution &bull; Accredited by NBA &amp; NAAC &bull; Affiliated to JNTUK Kakinada
            </p>
            <p className="text-xs text-cc-dark font-bold mt-1">
              DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
            </p>
            <div className="mt-4 pt-3 border-t border-cc-surface flex flex-wrap items-center justify-between text-xs text-cc-slate font-medium gap-2">
              <span>Report: <strong className="text-cc-navy">{previewData.reportTitle}</strong></span>
              <span>Section: <strong className="text-cc-navy">{previewData.section}</strong></span>
              <span>Filter: <strong className="text-cc-navy">{previewData.appliedFilter}</strong></span>
              <span>Generated On: <strong className="text-cc-navy">{previewData.generationDate}</strong></span>
              <span>Records Count: <strong className="text-cc-navy">{previewData.totalRecords} Students</strong></span>
              {previewData.isDemoData && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                  Demo Presentation Dataset
                </span>
              )}
            </div>
          </div>

          {/* Table View */}
          {previewData.students && previewData.students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cc-surface/60 text-cc-navy border-b border-cc-surface font-bold text-xs">
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-2 text-center">Section</th>

                    {reportType === 'ATTENDANCE' && (
                      <>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                        <th className="py-2.5 px-3 text-center">Category</th>
                      </>
                    )}

                    {reportType === 'FEES' && (
                      <>
                        <th className="py-2.5 px-3 text-center">Total Fee</th>
                        <th className="py-2.5 px-3 text-center">Paid Amount</th>
                        <th className="py-2.5 px-3 text-center">Outstanding</th>
                        <th className="py-2.5 px-3 text-center">Payment Status</th>
                      </>
                    )}

                    {reportType === 'ACADEMIC_RISK' && (
                      <>
                        <th className="py-2.5 px-2 text-center">Attendance</th>
                        <th className="py-2.5 px-2 text-center">Academics</th>
                        <th className="py-2.5 px-2 text-center">Fee Status</th>
                        <th className="py-2.5 px-3 text-center">Risk Standing</th>
                        <th className="py-2.5 px-4">Primary Reason</th>
                      </>
                    )}

                    {reportType === 'DIRECTORY' && (
                      <>
                        <th className="py-2.5 px-3 text-center">Internal Avg</th>
                        <th className="py-2.5 px-3 text-center">Attendance %</th>
                        <th className="py-2.5 px-3 text-center">Risk Category</th>
                        <th className="py-2.5 px-3 text-center">Fee Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cc-surface/50 font-mono text-xs">
                  {previewData.students.map((s) => (
                    <tr key={s.rollNumber} className="hover:bg-cc-bg/30">
                      <td className="py-2 px-3 font-bold text-cc-navy">{s.rollNumber}</td>
                      <td className="py-2 px-3 font-sans font-medium text-cc-navy">{s.name}</td>
                      <td className="py-2 px-2 text-center text-cc-dark">{s.section.replace('3rd Year ', '')}</td>

                      {reportType === 'ATTENDANCE' && (
                        <>
                          <td className="py-2 px-3 text-center font-bold">
                            <span className={s.attendancePercentage < 75 ? 'text-rose-700' : 'text-emerald-700'}>
                              {s.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.attendancePercentage < 75
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {s.attendancePercentage < 75 ? 'Below 75%' : (s.attendancePercentage === 75 ? 'Exactly 75%' : 'Above 75%')}
                            </span>
                          </td>
                        </>
                      )}

                      {reportType === 'FEES' && (
                        <>
                          <td className="py-2 px-3 text-center text-cc-slate">₹{s.totalSemesterFee.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-center text-emerald-700 font-semibold">₹{s.amountPaid.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-center font-bold text-rose-700">₹{s.outstandingBalance.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.feeStatus === 'Fully Paid'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {s.feeStatus}
                            </span>
                          </td>
                        </>
                      )}

                      {reportType === 'ACADEMIC_RISK' && (
                        <>
                          <td className="py-2 px-2 text-center">
                            <span className={s.attendancePercentage < 75 ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                              {s.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-cc-slate">{s.academicStatus}</td>
                          <td className="py-2 px-2 text-center text-cc-slate">{s.feeStatus}</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.riskCategory === 'No Risk'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {s.riskCategory}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-sans text-cc-slate text-[11px]">
                            {s.primaryRiskReason}
                          </td>
                        </>
                      )}

                      {reportType === 'DIRECTORY' && (
                        <>
                          <td className="py-2 px-3 text-center font-bold text-cc-navy">{s.internalAvg}%</td>
                          <td className="py-2 px-3 text-center text-emerald-700 font-bold">{s.attendancePercentage}%</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.riskCategory === 'No Risk' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {s.riskCategory}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-sans text-cc-slate">{s.feeStatus}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-cc-muted text-xs">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-cc-navy">No students match the selected filter criteria.</p>
              <p className="text-[11px] mt-1">Try modifying the section, category filter, or attendance threshold above.</p>
            </div>
          )}

          {/* Signoff stamp */}
          <div className="mt-12 pt-6 border-t border-cc-surface flex items-center justify-between text-xs font-semibold text-cc-navy">
            <div>
              <span>Verified by: Department Academic Cell</span>
              <p className="text-[11px] text-cc-muted font-normal mt-0.5">CampusConnect Academic Records Module</p>
            </div>
            <div className="text-right">
              <span>{previewData.authorName || user?.name || 'Head of Department'}</span>
              <p className="text-[11px] text-cc-muted font-normal mt-0.5">Head of the Department, CSE</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-cc-hover p-12 text-center text-xs text-cc-muted">
          Select section, category, and filter options above, then click "Generate Official Report" to preview and export.
        </div>
      )}
    </div>
  );
}
