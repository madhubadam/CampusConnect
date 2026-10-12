import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, CheckCircle2, AlertCircle, Hash, Mail, User } from 'lucide-react';

export function AddStudentModal() {
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('3rd Year Section A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@bvcgroup.in')) {
      setError('Student email must end in @bvcgroup.in');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addStudent({
        name,
        rollNumber: rollNumber.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        department: 'CSE',
        academicYear: 'III Year',
        section,
        semester: 'Semester 1',
        enrollmentStatus: 'Active'
      });

      showToast(res.message, 'success');
      navigate(`/faculty/classes?section=${encodeURIComponent(section)}`);
    } catch (err) {
      setError(err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Enroll Student in Assigned Section</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; CSE Department</p>
      </div>

      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cc-slate mb-1">
              Full Student Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-cc-muted absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sai Teja"
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-cc-hover focus:border-cc-teal outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cc-slate mb-1">
                Roll Number / Hall Ticket
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-cc-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    if (!email) setEmail(`${e.target.value.toLowerCase()}@bvcgroup.in`);
                  }}
                  placeholder="e.g. 22221A0565"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-cc-hover focus:border-cc-teal outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cc-slate mb-1">
                Official College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cc-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="22221a0565@bvcgroup.in"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-cc-hover focus:border-cc-teal outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cc-slate mb-1">
              Assigned Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-cc-hover outline-none bg-white font-medium text-cc-navy"
            >
              <option value="3rd Year Section A">3rd Year Section A</option>
              <option value="3rd Year Section B">3rd Year Section B</option>
              <option value="3rd Year Section C">3rd Year Section C</option>
            </select>
          </div>

          <div className="pt-4 border-t border-cc-surface flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/faculty/classes')}
              className="px-4 py-2 text-xs font-semibold text-cc-slate hover:bg-cc-surface rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Validating...' : 'Complete Enrollment'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
