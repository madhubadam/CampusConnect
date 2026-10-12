import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Layers, PlusCircle, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function TeachingAssignments() {
  const { showToast } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('CS301');
  const [sectionId, setSectionId] = useState('Section A');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [hodRes, facRes] = await Promise.all([
          api.getHodOverview(),
          api.getFacultyList()
        ]);
        setAssignments(hodRes.teachingAssignments || []);
        const facList = facRes.faculty || [];
        setFaculty(facList);
        if (facList.length > 0) setFacultyId(facList[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.assignTeachingClass({
        facultyId,
        subjectId,
        sectionId,
        academicYear: 'III Year',
        semester: 'Semester 1'
      });
      showToast(res.message, 'success');
      setIsModalOpen(false);

      // Refresh data
      const updated = await api.getHodOverview();
      setAssignments(updated.teachingAssignments || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteTeachingAssignment(assignmentToDelete.id);
      showToast(res.message || 'Teaching assignment deleted successfully', 'success');
      setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete.id));
      setAssignmentToDelete(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete teaching assignment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Teaching Matrix...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Teaching Assignments &amp; Workload Matrix</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; III Year CSE Teaching Faculty</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" /> Assign Subject to Faculty
        </button>
      </div>

      {/* Teaching Assignments Table */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cc-dark" />
            <h3 className="text-sm font-bold text-cc-navy">Authoritative Course Allocation Matrix ({assignments.length})</h3>
          </div>
          <span className="text-xs text-cc-muted">Semester 1 &bull; III B.Tech CSE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-cc-surface/50 text-cc-navy border-b border-cc-surface font-semibold text-xs">
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-3 text-center">Section</th>
                <th className="py-3 px-4">Assigned Instructor</th>
                <th className="py-3 px-3 text-center">Academic Year</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cc-surface/60">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-cc-slate font-medium">
                    No active teaching assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-cc-bg/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cc-dark">{a.subjectId}</td>
                    <td className="py-3 px-4 font-semibold text-cc-navy">{a.subjectName}</td>
                    <td className="py-3 px-3 text-center font-bold text-cc-navy bg-cc-bg/30">{a.section}</td>
                    <td className="py-3 px-4 font-medium text-cc-navy">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-cc-surface flex items-center justify-center font-bold text-[10px] text-cc-dark">
                          {a.facultyName?.charAt(0)}
                        </div>
                        <span>{a.facultyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-cc-slate">{a.academicYear}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Allocated
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setAssignmentToDelete(a)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition"
                        title="Delete Course Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Faculty to Course &amp; Section"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Select Faculty Member</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Subject Course</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium"
            >
              <option value="CS301">CS301 - Compiler Design</option>
              <option value="CS302">CS302 - Operating Systems</option>
              <option value="CS303">CS303 - Computer Networks</option>
              <option value="CS304">CS304 - Database Management Systems</option>
              <option value="CS305">CS305 - Machine Learning Foundations</option>
              <option value="CS306">CS306 - Web Technologies Lab</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Target Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white font-medium"
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-cc-dark hover:bg-teal-900 rounded-xl shadow-sm transition"
            >
              {submitting ? 'Allocating...' : 'Confirm Teaching Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        title="Delete Teaching Assignment"
      >
        {assignmentToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">
                  Remove assignment for {assignmentToDelete.facultyName}?
                </p>
                <p className="mt-1 leading-relaxed">
                  Are you sure you want to delete the teaching assignment of <strong>{assignmentToDelete.subjectName} ({assignmentToDelete.section})</strong>?
                </p>
              </div>
            </div>

            <p className="text-cc-slate leading-relaxed">
              This will remove the course from the faculty's active teaching schedule and workload matrix. Existing attendance and marks records created for students remain safely stored.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignmentToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
              >
                {deleting ? 'Deleting...' : 'Delete Assignment'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
