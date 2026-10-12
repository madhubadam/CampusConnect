import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/common/Modal';
import { UserPlus, Power, Send, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

export function FacultyManagement() {
  const { user, showToast } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyToRemove, setFacultyToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // New faculty form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [phone, setPhone] = useState('+91 9');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFaculty() {
      try {
        const res = await api.getFacultyList();
        setFaculty(res.faculty || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFaculty();
  }, []);

  const handleToggleStatus = async (facultyId) => {
    try {
      const res = await api.toggleFacultyStatus(facultyId);
      setFaculty(prev =>
        prev.map(f => f.id === facultyId ? { ...f, isActive: res.isActive } : f)
      );
      showToast(res.message, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!email.toLowerCase().endsWith('@bvcgroup.in')) {
      showToast('Faculty email must belong to @bvcgroup.in domain', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.addFaculty({
        name,
        email: email.toLowerCase().trim(),
        designation,
        phone
      });
      setFaculty(prev => [...prev, res.faculty]);
      showToast(res.message, 'success');
      setIsModalOpen(false);
      setName('');
      setEmail('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!facultyToRemove) return;
    setRemoving(true);
    try {
      const res = await api.removeFaculty(facultyToRemove.id);
      showToast(res.message || 'Faculty member removed successfully', 'success');
      setFaculty(prev => prev.filter(f => f.id !== facultyToRemove.id));
      setFacultyToRemove(null);
    } catch (err) {
      showToast(err.message || 'Failed to remove faculty member', 'error');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Faculty Directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cc-navy">Faculty &amp; Teaching Staff Management</h1>
          <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; CSE Department</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" /> Add Faculty Member
        </button>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faculty.map((f) => {
          const isCurrentUserHOD = f.email?.toLowerCase() === user?.email?.toLowerCase() || f.role === 'HOD';

          return (
            <div key={f.id} className="bg-white rounded-2xl border border-cc-surface shadow-soft p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-cc-surface">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-cc-navy">{f.name}</h3>
                      {f.role === 'HOD' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          HOD
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-cc-dark font-semibold block">{f.designation}</span>
                    <p className="text-xs font-mono text-cc-slate mt-0.5">{f.email}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(f.id)}
                      title={f.isActive ? 'Deactivate Account' : 'Activate Account'}
                      className={`p-1.5 px-2.5 rounded-xl border transition flex items-center gap-1 text-xs font-bold ${
                        f.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{f.isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    {!isCurrentUserHOD && (
                      <button
                        onClick={() => setFacultyToRemove(f)}
                        title="Remove Faculty Member"
                        className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cc-slate block mb-1.5">
                    Teaching Workload &amp; Assignments:
                  </span>
                  <div className="space-y-1.5">
                    {(f.assignedClasses || []).map((ac, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-cc-bg/40 text-xs text-cc-slate flex items-center justify-between">
                        <span className="font-semibold text-cc-navy">{ac.subjectName}</span>
                        <span className="font-mono text-cc-dark font-bold">{ac.section}</span>
                      </div>
                    ))}
                    {(!f.assignedClasses || f.assignedClasses.length === 0) && (
                      <span className="text-xs text-cc-muted italic">No active classroom assignments.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-cc-surface text-xs text-cc-muted flex items-center justify-between">
                <span>Contact: <strong className="text-cc-navy font-mono">{f.phone || 'N/A'}</strong></span>
                <span className="font-semibold text-cc-dark">CSE Department</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Faculty Account"
      >
        <form onSubmit={handleAddFaculty} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">Faculty Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. K. Srinivasa Rao"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cc-slate mb-1">College Email (@bvcgroup.in)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="srinivasarao.k@bvcgroup.in"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cc-slate mb-1">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none bg-white"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cc-slate mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 94401 23456"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-cc-hover outline-none font-mono"
              />
            </div>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-cc-dark hover:bg-teal-900 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              {submitting ? 'Provisioning...' : 'Provision Account'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Faculty Confirmation Modal */}
      <Modal
        isOpen={!!facultyToRemove}
        onClose={() => setFacultyToRemove(null)}
        title="Confirm Faculty Removal"
      >
        {facultyToRemove && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">
                  Remove {facultyToRemove.name} from Department?
                </p>
                <p className="mt-1 leading-relaxed">
                  Removing this faculty member will deactivate portal access and unassign their current teaching workload.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cc-bg/40 border border-cc-surface text-cc-slate space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Historical Academic Records Preserved:</span>
              </div>
              <p className="text-[11px] text-cc-muted pl-5">
                Past attendance logs, student internal assessment marks entered, and audit history recorded by this instructor will remain permanently intact in the authoritative database.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFacultyToRemove(null)}
                disabled={removing}
                className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {removing ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
