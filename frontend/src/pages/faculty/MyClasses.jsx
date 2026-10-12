import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Eye,
  Edit3,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Filter,
  BookOpen,
  Clock,
  FileText,
  Save,
  Award,
  Calendar,
  GraduationCap
} from 'lucide-react';

export function MyClasses() {
  const { showToast } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'ALL';

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Selected student for Academic Profile Modal
  const [profileStudentId, setProfileStudentId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Selected student for Edit Details Modal
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editYear, setEditYear] = useState('3rd Year');
  const [editStatus, setEditStatus] = useState('Active');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    async function fetchRoster() {
      setLoading(true);
      try {
        const params = {
          search: searchQuery
        };
        if (riskFilter !== 'ALL') {
          params.academicRisk = riskFilter;
        }
        const res = await api.getSectionStudents(activeSection, params);
        setStudents(res.students || []);
        setTotalCount(res.total || 0);
      } catch (err) {
        console.error('Failed to load roster:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoster();
  }, [activeSection, searchQuery, riskFilter]);

  // Load individual student profile
  const handleOpenProfile = async (studentId) => {
    setProfileStudentId(studentId);
    setProfileLoading(true);
    setProfileData(null);
    try {
      const res = await api.getFacultyStudentProfile(studentId);
      setProfileData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load student profile', 'error');
      setProfileStudentId(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setEditName(student.name);
    setEditSection(student.section);
    setEditYear(student.academicYear || '3rd Year');
    setEditStatus(student.enrollmentStatus || 'Active');
  };

  // Submit edit details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    setEditSaving(true);
    try {
      await api.updateStudent(editStudent.id, {
        name: editName.trim(),
        section: editSection,
        academicYear: editYear,
        enrollmentStatus: editStatus
      });
      showToast(`Student record for ${editName} updated successfully.`, 'success');
      setEditStudent(null);
      // Refresh roster
      const res = await api.getSectionStudents(activeSection, { search: searchQuery });
      setStudents(res.students || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      showToast(err.message || 'Failed to update student details', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const sections = [
    { id: 'ALL', label: 'All CSE Students' },
    { id: '3rd Year Section A', label: 'Section A' },
    { id: '3rd Year Section B', label: 'Section B' },
    { id: '3rd Year Section C', label: 'Section C' }
  ];

  const getRiskBadge = (category) => {
    switch (category) {
      case 'COMBINED_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px]">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Combined Risk
          </span>
        );
      case 'ACADEMICALLY_AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Academic Risk
          </span>
        );
      case 'ATTENDANCE_AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 font-bold text-[11px]">
            <Clock className="w-3 h-3 text-orange-600" /> Low Attendance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Department Student Management</h1>
          <p className="text-xs text-cc-muted">Computer Science and Engineering &bull; Student Directory &amp; Academic Profiles ({totalCount} Enrolled)</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/faculty/students/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cc-dark hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-cc-surface shadow-xs">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setSearchParams({ section: sec.id });
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSection === sec.id
                ? 'bg-cc-dark text-white shadow-xs'
                : 'text-cc-navy hover:bg-cc-surface/70'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cc-surface shadow-soft space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cc-muted absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or registration number (e.g. 24221A0501)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-cc-hover focus:border-cc-teal outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cc-muted shrink-0" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-cc-hover bg-white font-medium text-cc-navy outline-none"
            >
              <option value="ALL">All Academic Statuses</option>
              <option value="HEALTHY">Healthy Status</option>
              <option value="ACADEMICALLY_AT_RISK">Academically at Risk</option>
              <option value="ATTENDANCE_AT_RISK">Attendance at Risk (&lt;75%)</option>
              <option value="COMBINED_RISK">Combined Dual Risk</option>
            </select>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs font-semibold text-cc-dark hover:bg-cc-surface rounded-xl transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-cc-muted pt-2 border-t border-cc-bg">
          <span>
            Displaying <strong className="text-cc-navy font-bold">{students.length}</strong> of{' '}
            <strong className="text-cc-navy font-bold">{totalCount}</strong> students in{' '}
            <strong className="text-cc-navy font-bold">{activeSection === 'ALL' ? 'All Sections' : activeSection}</strong>
          </span>
          <span className="font-medium text-cc-slate">CSE Department &bull; Academic Year 2026-27</span>
        </div>
      </div>

      {/* Authoritative Roster Table */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-cc-dark font-medium animate-pulse">
            Querying authoritative department roster...
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-cc-surface/50 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                  <th className="py-3 px-3 w-12 text-center">S.No</th>
                  <th className="py-3 px-4 w-36">Reg. Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3 text-center">Year</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-3 text-center">Internal Avg</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Risk Status</th>
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-surface/60">
                {students.map((student, idx) => {
                  const regNo = student.registrationNumber || student.rollNumber;
                  const att = student.attendancePercentage ?? 85;
                  const internal = student.internalAvg ?? 75;

                  return (
                    <tr key={regNo || idx} className="hover:bg-cc-bg/30 transition">
                      <td className="py-3 px-3 text-center font-mono text-xs text-cc-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cc-navy tracking-wide">
                        {regNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cc-navy">
                        {student.name}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-cc-slate font-medium">
                        {student.academicYear || '3rd Year'}
                      </td>
                      <td className="py-3 px-3 font-medium text-xs text-cc-dark">
                        <span className="px-2 py-0.5 rounded-md bg-cc-surface font-semibold text-cc-dark">
                          {student.section}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-xs ${att < 75 ? 'bg-rose-50 text-rose-700 font-extrabold' : 'text-emerald-700'}`}>
                          {att.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-cc-navy font-semibold">
                        {internal.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${student.enrollmentStatus === 'Active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                          {student.enrollmentStatus || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getRiskBadge(student.academicRiskStatus)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenProfile(student.id || regNo)}
                            className="p-1.5 rounded-lg bg-cc-surface hover:bg-cc-hover text-cc-dark transition cursor-pointer"
                            title="View Academic Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Edit Student Information"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-cc-muted">
            No students found matching current filters in {activeSection === 'ALL' ? 'CSE Department' : activeSection}.
          </div>
        )}
      </div>

      {/* Edit Student Details Modal */}
      <Modal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title={`Edit Student: ${editStudent?.name} (${editStudent?.rollNumber})`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Full Student Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover focus:border-cc-teal outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Assigned Section</label>
            <select
              value={editSection}
              onChange={(e) => setEditSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="3rd Year Section A">3rd Year Section A</option>
              <option value="3rd Year Section B">3rd Year Section B</option>
              <option value="3rd Year Section C">3rd Year Section C</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cc-slate mb-1">Academic Year</label>
              <input
                type="text"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cc-slate mb-1">Enrollment Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Detained">Detained</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-cc-surface">
            <button
              type="button"
              onClick={() => setEditStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-cc-dark hover:bg-teal-900 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Academic Profile Modal */}
      <Modal
        isOpen={!!profileStudentId}
        onClose={() => setProfileStudentId(null)}
        title="Comprehensive Academic Profile"
      >
        {profileLoading ? (
          <div className="py-12 text-center text-xs text-cc-dark font-medium animate-pulse">
            Querying academic records, marks ledger, and attendance history...
          </div>
        ) : profileData ? (
          <div className="space-y-5 text-xs">
            {/* Header Identity Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cc-surface/70 to-white border border-cc-surface flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cc-navy bg-cc-surface px-2.5 py-0.5 rounded-lg">
                    {profileData.student?.rollNumber}
                  </span>
                  <span className="text-xs text-cc-muted">&bull; {profileData.student?.section}</span>
                </div>
                <h3 className="text-base font-extrabold text-cc-navy mt-1">{profileData.student?.name}</h3>
                <p className="text-cc-slate text-xs mt-0.5">{profileData.student?.department} Department &bull; {profileData.student?.academicYear}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-cc-muted font-bold uppercase tracking-wider block">Cumulative Attendance</span>
                <span className={`text-lg font-black font-mono ${profileData.student?.attendancePercentage < 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {profileData.student?.attendancePercentage?.toFixed(1)}%
                </span>
                <span className="text-[10px] text-cc-muted block mt-0.5">
                  ({profileData.student?.presentSessions || 0} / {profileData.student?.totalSessions || 0} Sessions)
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-cc-bg/30 border border-cc-surface text-center">
                <span className="text-[10px] text-cc-muted font-bold uppercase block">Current CGPA</span>
                <span className="text-sm font-extrabold text-cc-navy font-mono">
                  {profileData.student?.cgpa?.toFixed(2) || '7.50'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-cc-bg/30 border border-cc-surface text-center">
                <span className="text-[10px] text-cc-muted font-bold uppercase block">Internal Avg</span>
                <span className="text-sm font-extrabold text-cc-navy font-mono">
                  {profileData.student?.internalAvg?.toFixed(1) || '75.0'}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-cc-bg/30 border border-cc-surface text-center">
                <span className="text-[10px] text-cc-muted font-bold uppercase block">Fee Status</span>
                <span className={`text-xs font-bold ${profileData.feeAccount?.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {profileData.feeAccount?.status || 'PAID'}
                </span>
              </div>
            </div>

            {/* Attendance Session Ledger */}
            <div>
              <h4 className="font-bold text-cc-navy mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cc-dark" />
                <span>Class Attendance Sessions ({profileData.sessionHistory?.length || 0})</span>
              </h4>
              {profileData.sessionHistory && profileData.sessionHistory.length > 0 ? (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-cc-surface divide-y divide-cc-surface/60">
                  {profileData.sessionHistory.map((s, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between hover:bg-cc-bg/20">
                      <div>
                        <span className="font-mono text-cc-navy font-bold">{s.sessionDate}</span>
                        <span className="text-cc-muted ml-2">{s.subjectName} ({s.timeSlot})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${s.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cc-muted italic">No individual session records logged yet.</p>
              )}
            </div>

            {/* Continuous Assessment Marks */}
            <div>
              <h4 className="font-bold text-cc-navy mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cc-dark" />
                <span>Assessment Marks Records ({profileData.marksHistory?.length || 0})</span>
              </h4>
              {profileData.marksHistory && profileData.marksHistory.length > 0 ? (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-cc-surface divide-y divide-cc-surface/60">
                  {profileData.marksHistory.map((m, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between hover:bg-cc-bg/20">
                      <div>
                        <span className="font-semibold text-cc-navy">{m.subjectName}</span>
                        <span className="text-cc-muted ml-2">({m.assessmentType})</span>
                      </div>
                      <span className="font-mono font-bold text-cc-navy">
                        {m.scoreObtained} / {m.maxMarks} Marks
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-cc-muted italic">No assessment marks logged yet for this student.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
