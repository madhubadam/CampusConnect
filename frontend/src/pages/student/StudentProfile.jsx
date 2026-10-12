import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Hash, Building2, Calendar, Layers, ShieldCheck, Edit2, Send } from 'lucide-react';

export function StudentProfile() {
  const { showToast } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Correction form
  const [field, setField] = useState('Personal Name');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.getStudentProfile();
        setStudent(res.student);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.requestCorrection({ field, proposedValue, reason });
      showToast('Correction request submitted to the department office.', 'success');
      setIsModalOpen(false);
      setProposedValue('');
      setReason('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Official Profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Official Academic Profile</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Student Information System</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-cc-surface hover:bg-cc-hover text-cc-dark font-semibold text-xs flex items-center gap-1.5 transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Request Correction
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-cc-surface">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cc-teal to-cc-dark text-white flex items-center justify-center text-3xl font-extrabold shadow-md shadow-cc-teal/30">
            {student?.name?.charAt(0)}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-extrabold text-cc-navy">{student?.name}</h2>
            <p className="text-sm font-mono text-cc-slate mt-0.5">{student?.rollNumber}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-cc-dark border border-teal-200 font-semibold">
                Status: {student?.enrollmentStatus}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                CSE Department
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                {student?.section}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-start gap-3">
            <Hash className="w-5 h-5 text-cc-dark shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Roll / Hall Ticket No</span>
              <p className="text-sm font-bold text-cc-navy font-mono">{student?.rollNumber}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-start gap-3">
            <Mail className="w-5 h-5 text-cc-dark shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Official College Email</span>
              <p className="text-sm font-bold text-cc-navy font-mono break-all">{student?.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-start gap-3">
            <Building2 className="w-5 h-5 text-cc-dark shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Department &amp; Specialization</span>
              <p className="text-sm font-bold text-cc-navy">Computer Science and Engineering</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-start gap-3">
            <Calendar className="w-5 h-5 text-cc-dark shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Academic Year &amp; Semester</span>
              <p className="text-sm font-bold text-cc-navy">{student?.academicYear} &bull; {student?.semester}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-start gap-3">
            <Layers className="w-5 h-5 text-cc-dark shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Section Assignment</span>
              <p className="text-sm font-bold text-cc-navy">{student?.section} (Room 304, CSE Block)</p>
            </div>
          </div>


        </div>

        <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Read-Only Authoritative Protection:</strong> Official student credentials and academic records can only be amended by authorized BVC faculty or the Department Head. Use the "Request Correction" feature to submit administrative change requests.
          </span>
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Official Record Correction"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <p className="text-xs text-cc-slate">
            Submit a formal discrepancy report to the CSE Academic Office. Corrections require administrative verification.
          </p>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Field to Correct</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-cc-hover outline-none"
            >
              <option value="Personal Name Spelling">Personal Name Spelling</option>
              <option value="Contact Information">Contact Information</option>
              <option value="Section Assignment">Section Assignment</option>
              <option value="Attendance Discrepancy">Attendance Record Discrepancy</option>
              <option value="Marks Entry Discrepancy">Internal Marks Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Proposed Value</label>
            <input
              type="text"
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder="e.g. Correct name spelling"
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-cc-hover outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Reason / Supporting Documentation</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief explanation for the request..."
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-cc-hover outline-none resize-none"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-cc-dark hover:bg-teal-900 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
