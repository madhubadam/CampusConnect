import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Search, Users, Eye, GraduationCap, Calendar, BookOpen, AlertTriangle, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function StudentDirectory() {
  const [section, setSection] = useState('ALL');
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Profile modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const targets = section === 'ALL' ? ['Section A', 'Section B', 'Section C'] : [section];
        const promises = targets.map(s => api.getSectionStudents(s, {
          search,
          risk: riskFilter,
          limit: 100
        }));

        const results = await Promise.all(promises);
        const combined = results.flatMap(r => r.students || []);
        setStudents(combined);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [section, search, riskFilter]);

  const handleOpenStudent = async (s) => {
    setSelectedStudent(s);
    setProfileDetails(null);
    setLoadingProfile(true);
    try {
      const res = await api.getHodStudentProfile(s.id || s.rollNumber);
      setProfileDetails(res);
    } catch (err) {
      console.error('Failed to fetch detailed student profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setProfileDetails(null);
    setLoadingProfile(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Department Student Directory</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Computer Science & Engineering</p>
        </div>

        {/* Section Picker */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-cc-surface border border-cc-teal/30">
          {['ALL', 'Section A', 'Section B', 'Section C'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSection(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                section === sec
                  ? 'bg-cc-dark text-white shadow-xs'
                  : 'text-cc-navy hover:bg-white/60'
              }`}
            >
              {sec === 'ALL' ? 'All Sections' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters (Gender filter removed) */}
      <div className="bg-white p-4 rounded-2xl border border-cc-surface shadow-soft flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cc-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number (e.g. 24221A0501)..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-cc-hover focus:border-cc-teal outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between text-xs font-bold text-cc-navy">
          <span>Enrolled Records Found: {students.length}</span>
          <span className="text-cc-muted">Official Department Enrolled Students</span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 bg-white shadow-xs z-10">
              <tr className="bg-cc-surface/50 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3 text-center">Section</th>
                <th className="py-3 px-3 text-center">Attendance %</th>
                <th className="py-3 px-3 text-center">Internal Avg</th>
                <th className="py-3 px-3 text-center">CGPA</th>
                <th className="py-3 px-3 text-center">AI Risk</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cc-surface/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-cc-slate font-medium">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-cc-slate font-medium">
                    No students match the selected criteria.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.rollNumber || s.id} className="hover:bg-cc-bg/30 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-cc-navy">{s.rollNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-cc-navy">
                      {s.name}
                      {s.email && <span className="block text-[11px] text-cc-muted font-normal font-mono">{s.email}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-cc-dark">{s.section}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={s.attendancePercentage < 75 ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                        {s.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-cc-navy">{s.internalAvg}%</td>
                    <td className="py-2.5 px-3 text-center font-mono text-cc-slate">{s.cgpa?.toFixed(2) || '7.50'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {s.riskCategory === 'High' ? (
                        <Badge type="risk-high" label="High" size="xs" />
                      ) : s.riskCategory === 'Moderate' ? (
                        <Badge type="risk-moderate" label="Moderate" size="xs" />
                      ) : (
                        <Badge type="risk-low" label="Low" size="xs" />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenStudent(s)}
                        className="px-2.5 py-1 rounded-lg bg-cc-surface hover:bg-cc-hover text-cc-dark font-semibold text-xs transition inline-flex items-center gap-1"
                        title="View Full Student Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Student Profile Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={handleCloseModal}
        title={`Student Dossier: ${selectedStudent?.name || ''}`}
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Identity Card */}
            <div className="p-4 rounded-xl bg-cc-bg/60 border border-cc-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-base text-cc-navy block">{selectedStudent.name}</span>
                <span className="font-mono text-xs text-cc-slate">
                  Roll No: <strong className="text-cc-navy">{selectedStudent.rollNumber}</strong> &bull; {selectedStudent.email || `${selectedStudent.rollNumber.toLowerCase()}@bvcgroup.in`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-white border border-cc-teal/40 font-bold text-xs text-cc-dark shadow-xs">
                  {selectedStudent.section}
                </span>
                <span className="px-3 py-1 rounded-lg bg-white border border-cc-surface font-semibold text-xs text-cc-navy shadow-xs">
                  CSE Department
                </span>
              </div>
            </div>

            {loadingProfile ? (
              <div className="py-12 text-center text-xs text-cc-dark font-medium animate-pulse">
                Fetching comprehensive student academic, attendance, and fee dossier...
              </div>
            ) : (
              <>
                {/* Academic & Attendance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-cc-surface bg-white shadow-xs">
                    <span className="text-cc-muted block text-[11px]">Attendance Rate</span>
                    <span className={`text-base font-extrabold ${((profileDetails?.student?.attendancePercentage ?? selectedStudent.attendancePercentage) < 75) ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {profileDetails?.student?.attendancePercentage ?? selectedStudent.attendancePercentage}%
                    </span>
                    <span className="text-[10px] text-cc-muted block mt-0.5">
                      {profileDetails?.student?.presentSessions !== undefined
                        ? `${profileDetails.student.presentSessions} / ${profileDetails.student.totalSessions} Sessions`
                        : 'Overall Semester'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-cc-surface bg-white shadow-xs">
                    <span className="text-cc-muted block text-[11px]">Internal Marks Avg</span>
                    <span className="text-base font-extrabold text-cc-navy">
                      {profileDetails?.student?.internalAvg ?? selectedStudent.internalAvg}%
                    </span>
                    <span className="text-[10px] text-cc-muted block mt-0.5">Continuous Evaluation</span>
                  </div>

                  <div className="p-3 rounded-xl border border-cc-surface bg-white shadow-xs">
                    <span className="text-cc-muted block text-[11px]">AI Risk Level</span>
                    <div className="mt-1">
                      {(profileDetails?.riskAssessment?.riskCategory || selectedStudent.riskCategory) === 'High' ? (
                        <Badge type="risk-high" label="High Risk" size="xs" />
                      ) : (profileDetails?.riskAssessment?.riskCategory || selectedStudent.riskCategory) === 'Moderate' ? (
                        <Badge type="risk-moderate" label="Moderate Risk" size="xs" />
                      ) : (
                        <Badge type="risk-low" label="Low Risk" size="xs" />
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-cc-surface bg-white shadow-xs">
                    <span className="text-cc-muted block text-[11px]">Fee Account Status</span>
                    <span className={`text-sm font-bold block mt-0.5 ${(profileDetails?.feeAccount?.balanceAmount || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {(profileDetails?.feeAccount?.balanceAmount || 0) > 0 ? `Due: ₹${profileDetails.feeAccount.balanceAmount}` : 'Paid in Full'}
                    </span>
                    <span className="text-[10px] text-cc-muted block">Tuition & Exam Fees</span>
                  </div>
                </div>

                {/* AI Risk Analysis & Explainability */}
                <div className="p-3.5 rounded-xl bg-cc-bg/30 border border-cc-surface">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-cc-navy">AI Risk Diagnostic & Recommendations:</span>
                  </div>
                  <ul className="space-y-1 text-cc-slate pl-1">
                    {(profileDetails?.riskAssessment?.riskFactors || selectedStudent.riskFactors || ['Good academic record; attendance and marks within expected parameters.']).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cc-dark shrink-0 mt-1.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Internal Marks History */}
                <div>
                  <h4 className="font-bold text-cc-navy mb-2 flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-cc-dark" /> Internal Assessment Records
                  </h4>
                  {profileDetails?.marksHistory && profileDetails.marksHistory.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-cc-surface">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-cc-surface/50 text-cc-navy font-semibold">
                          <tr>
                            <th className="py-2 px-3">Subject</th>
                            <th className="py-2 px-2 text-center">Type</th>
                            <th className="py-2 px-2 text-center">Score</th>
                            <th className="py-2 px-2 text-center">Max</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cc-surface/60">
                          {profileDetails.marksHistory.map((m, idx) => (
                            <tr key={idx} className="hover:bg-cc-bg/30">
                              <td className="py-2 px-3 font-medium text-cc-navy">{m.subjectName}</td>
                              <td className="py-2 px-2 text-center font-mono text-cc-slate">{m.assessmentType}</td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-cc-navy">{m.scoreObtained}</td>
                              <td className="py-2 px-2 text-center font-mono text-cc-slate">{m.maxMarks}</td>
                              <td className="py-2 px-3 text-center">
                                {m.isPassing ? (
                                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Pass
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-semibold inline-flex items-center gap-0.5">
                                    <XCircle className="w-3 h-3" /> Needs Improvement
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-cc-muted italic py-2">No historical exam mark entries recorded for this student.</p>
                  )}
                </div>

                {/* Attendance Session History */}
                <div>
                  <h4 className="font-bold text-cc-navy mb-2 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-cc-dark" /> Recent Classroom Attendance Sessions
                  </h4>
                  {profileDetails?.sessionHistory && profileDetails.sessionHistory.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-cc-surface max-h-44">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-cc-surface/50 text-cc-navy font-semibold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-2">Slot</th>
                            <th className="py-2 px-3">Subject</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cc-surface/60">
                          {profileDetails.sessionHistory.slice(0, 10).map((sess, idx) => (
                            <tr key={idx} className="hover:bg-cc-bg/30">
                              <td className="py-2 px-3 font-mono text-cc-navy">{sess.sessionDate}</td>
                              <td className="py-2 px-2 font-mono text-cc-slate">{sess.sessionSlot}</td>
                              <td className="py-2 px-3 text-cc-navy">{sess.subjectName}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sess.status === 'PRESENT'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}>
                                  {sess.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-cc-muted italic py-2">No individual session records logged yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
