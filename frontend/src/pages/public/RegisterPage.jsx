import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  GraduationCap,
  Users,
  Award,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Hash,
  Layers,
  Briefcase,
  Building
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();

  // Role selection
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'FACULTY' | 'HOD'

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student fields
  const [rollNumber, setRollNumber] = useState('');
  const [section, setSection] = useState('Section A');
  const [academicYear, setAcademicYear] = useState('III Year');

  // Faculty fields
  const [designation, setDesignation] = useState('Assistant Professor');
  const [facultyId, setFacultyId] = useState('');
  const [assignedSection, setAssignedSection] = useState('3rd Year Section A');
  const [assignedSubject, setAssignedSubject] = useState('CS301');

  // HOD fields
  const [hodEmployeeId, setHodEmployeeId] = useState('');
  const [cabin, setCabin] = useState('Block B - Room 204');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Email domain check
    if (!normalizedEmail.endsWith('@bvcgroup.in')) {
      setError('Registration is strictly restricted to official college email addresses ending in @bvcgroup.in');
      return;
    }

    // 2. Password length check
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    // 3. Confirm password check
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match. Please verify your entries.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
        department: 'CSE'
      };

      if (role === 'STUDENT') {
        payload.rollNumber = rollNumber.trim() || normalizedEmail.split('@')[0].toUpperCase();
        payload.academicYear = academicYear;
        payload.section = section;
      } else if (role === 'FACULTY') {
        payload.employeeId = facultyId.trim() || `FAC_${normalizedEmail.split('@')[0].toUpperCase()}`;
        payload.designation = designation;
        payload.assignedSection = assignedSection;
        payload.assignedSubject = assignedSubject;
      } else if (role === 'HOD') {
        payload.employeeId = hodEmployeeId.trim() || 'HOD_CSE';
        payload.cabin = cabin.trim();
      }

      await api.register(payload);

      // Navigate to dedicated OTP verification page upon successful send
      navigate(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`, {
        state: {
          email: normalizedEmail,
          message: 'Verification OTP has been dispatched to your official college email.'
        }
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-cc-bg">
      <div className="max-w-xl w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-soft border border-cc-surface mb-3">
            <GraduationCap className="w-8 h-8 text-cc-dark" />
          </div>
          <h1 className="text-2xl font-black text-cc-navy tracking-tight">Create Academic Account</h1>
          <p className="text-xs font-semibold text-cc-dark uppercase tracking-widest mt-0.5">
            BVC Engineering College &bull; CSE Department
          </p>
          <p className="text-xs text-cc-slate mt-1">
            Official registration portal for Students, Faculty, and Department HOD
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-soft border border-cc-surface p-6 sm:p-8">
          {/* Role Switcher Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-2">
              Select Your Academic Role
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-cc-bg/60 border border-cc-surface">
              <button
                type="button"
                onClick={() => { setRole('STUDENT'); setError(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'STUDENT'
                    ? 'bg-cc-dark text-white shadow-sm'
                    : 'text-cc-slate hover:text-cc-navy hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('FACULTY'); setError(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'FACULTY'
                    ? 'bg-cc-dark text-white shadow-sm'
                    : 'text-cc-slate hover:text-cc-navy hover:bg-white/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('HOD'); setError(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'HOD'
                    ? 'bg-cc-dark text-white shadow-sm'
                    : 'text-cc-slate hover:text-cc-navy hover:bg-white/60'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>HOD</span>
              </button>
            </div>
          </div>

          {/* Role Security Guidance Notice */}
          {role === 'STUDENT' && (
            <div className="mb-5 p-3 rounded-xl bg-cc-bg/60 border border-cc-surface text-cc-navy text-xs flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-cc-dark shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Student Portal Registration: </span>
                Requires an official BVC student email (<code className="font-mono text-cc-dark">@bvcgroup.in</code>). An OTP verification code will be dispatched to your inbox.
              </div>
            </div>
          )}

          {role === 'FACULTY' && (
            <div className="mb-5 p-3 rounded-xl bg-cc-bg/60 border border-cc-surface text-cc-navy text-xs flex items-start gap-2.5">
              <Users className="w-4 h-4 text-cc-dark shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Faculty Portal Registration: </span>
                Requires an official college email (<code className="font-mono text-cc-dark">@bvcgroup.in</code>). An OTP verification code will be dispatched to your inbox.
              </div>
            </div>
          )}

          {role === 'HOD' && (
            <div className="mb-5 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
              <Award className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Head of Department Registration: </span>
                Official portal for authorized CSE Department Leadership. Requires an official institutional email (<code className="font-mono text-purple-800">@bvcgroup.in</code>). Once email OTP is verified, your HOD account is activated immediately.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'STUDENT' ? 'e.g. Sai Teja' : role === 'FACULTY' ? 'e.g. Dr. K. Srinivasa Rao' : 'e.g. Dr. V. Rama Krishna'}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                />
              </div>
            </div>

            {/* College Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                College Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'STUDENT' ? '22221A0515@bvcgroup.in' : role === 'FACULTY' ? 'srinivasarao.k@bvcgroup.in' : 'hod.cse@bvcgroup.in'}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy font-mono"
                />
              </div>
              <p className="text-[11px] text-cc-muted mt-1">
                Must end with <strong className="text-cc-dark font-semibold">@bvcgroup.in</strong>. Non-college domains will be rejected.
              </p>
            </div>

            {/* Student Specific Fields */}
            {role === 'STUDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                    Student Roll Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 22221A0515"
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                    >
                      <option value="3rd Year Section A">3rd Year Section A</option>
                      <option value="3rd Year Section B">3rd Year Section B</option>
                      <option value="3rd Year Section C">3rd Year Section C</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Faculty Specific Fields */}
            {role === 'FACULTY' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Adjunct Faculty">Adjunct Faculty</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                      Employee ID
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        placeholder="e.g. FAC_CSE_101"
                        className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                      Assigned Section
                    </label>
                    <select
                      value={assignedSection}
                      onChange={(e) => setAssignedSection(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                    >
                      <option value="3rd Year Section A">3rd Year Section A</option>
                      <option value="3rd Year Section B">3rd Year Section B</option>
                      <option value="3rd Year Section C">3rd Year Section C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                      Teaching Subject
                    </label>
                    <select
                      value={assignedSubject}
                      onChange={(e) => setAssignedSubject(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                    >
                      <option value="CS301">CS301 - Compiler Design</option>
                      <option value="CS302">CS302 - Operating Systems</option>
                      <option value="CS303">CS303 - Computer Networks</option>
                      <option value="CS304">CS304 - Database Management Systems</option>
                      <option value="CS305">CS305 - Machine Learning Foundations</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* HOD Specific Fields */}
            {role === 'HOD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                    HOD Employee ID
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={hodEmployeeId}
                      onChange={(e) => setHodEmployeeId(e.target.value)}
                      placeholder="e.g. HOD_CSE_01"
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                    Department Cabin / Room
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      placeholder="Block B - Room 204"
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition text-cc-navy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-cc-muted hover:text-cc-navy focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cc-muted absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition text-cc-navy ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-cc-hover focus:border-cc-teal focus:ring-cc-teal/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-cc-muted hover:text-cc-navy focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating & Dispatching Brevo OTP...</span>
                </>
              ) : (
                <>
                  <span>Register &amp; Verify Email OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 pt-5 border-t border-cc-surface text-center text-xs text-cc-slate">
            Already have an active account?{' '}
            <Link to="/login" className="text-cc-dark font-black hover:underline inline-flex items-center gap-1">
              Sign In Here
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 text-center text-[11px] text-cc-muted">
          Bonam Venkata Chalamayya Engineering College &bull; Autonomous &bull; Accredited by NAAC
        </div>
      </div>
    </div>
  );
}
