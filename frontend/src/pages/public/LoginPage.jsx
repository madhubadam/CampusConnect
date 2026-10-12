import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [successNotice, setSuccessNotice] = useState(
    location.state?.successMessage ||
    (searchParams.get('verified') === 'true' ? 'Account verified and activated successfully! Please sign in.' : '')
  );
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If user is already authenticated, redirect to their role's dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'HOD') navigate('/hod', { replace: true });
      else if (user.role === 'FACULTY') navigate('/faculty', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');

    const normalized = email.toLowerCase().trim();
    if (!normalized.endsWith('@bvcgroup.in')) {
      setError('Only official college email addresses ending in @bvcgroup.in are permitted.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(normalized, password);
      if (res.user.role === 'HOD') navigate('/hod', { replace: true });
      else if (res.user.role === 'FACULTY') navigate('/faculty', { replace: true });
      else navigate('/student', { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('not been verified') || errMsg.toLowerCase().includes('otp')) {
        setUnverifiedEmail(normalized);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-cc-bg via-cc-surface/30 to-cc-bg">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-soft border border-cc-surface p-6 sm:p-8 relative overflow-hidden transition-all">
          {/* Top Brand Banner */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cc-teal to-cc-dark text-white shadow-md shadow-cc-teal/30 mb-3 transform hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-cc-navy tracking-tight">
              Campus<span className="text-cc-dark">Connect</span>
            </h1>
            <p className="text-xs font-semibold text-cc-slate mt-1 uppercase tracking-wider">
              Bonam Venkata Chalamaya Engineering College
            </p>
            <p className="text-[11px] text-cc-muted mt-0.5">
              Department of Computer Science &amp; Engineering
            </p>
          </div>

          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{successNotice}</div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
              {unverifiedEmail && (
                <div className="pl-6 pt-1">
                  <Link
                    to={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cc-dark hover:underline bg-white px-3 py-1.5 rounded-lg border border-teal-200 shadow-sm"
                  >
                    <span>Click here to enter OTP and activate account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1.5">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cc-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. 22221A0501@bvcgroup.in"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-cc-hover focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition bg-cc-bg/20 font-medium text-cc-navy placeholder:text-cc-muted/60 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-cc-dark hover:underline transition"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-cc-muted absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-cc-hover focus:border-cc-teal focus:ring-2 focus:ring-cc-teal/20 outline-none transition bg-cc-bg/20 font-medium text-cc-navy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-3 text-cc-muted hover:text-cc-navy transition p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-bold text-sm shadow-md shadow-cc-dark/20 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CampusConnect</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <div className="mt-6 pt-5 border-t border-cc-surface text-center">
            <p className="text-xs text-cc-slate">
              Don't have an account?{' '}
              <Link to="/register" className="text-cc-dark font-bold hover:underline transition">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-[11px] text-cc-muted">
          Bonam Venkata Chalamaya Engineering College &bull; Autonomous Institution
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Password Recovery & Support"
      >
        <div className="space-y-4 text-xs sm:text-sm text-cc-slate leading-relaxed">
          <div className="p-3.5 rounded-xl bg-cc-bg/50 border border-cc-surface">
            <h4 className="font-bold text-cc-navy mb-1">Official Password Policy:</h4>
            <p>
              To ensure compliance with BVC institutional cybersecurity standards, password resets for official college accounts (`@bvcgroup.in`) are coordinated through the CSE Department Examination Cell and Academic Administration.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cc-navy">Recommended Recovery Steps:</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>
                <strong>Students:</strong> Contact your class mentor or CSE Department Academic Coordinator with your official student roll number.
              </li>
              <li>
                <strong>Faculty Members:</strong> Reach out to the CSE HOD Office or Systems Administrator for faculty credential reissuance.
              </li>
              <li>
                <strong>Department HOD:</strong> Contact the Principal's Office or Institute Systems Management Team.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Support Desk: CSE Department Block B, Room 102 &bull; admin@bvcgroup.in</span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="px-4 py-2 rounded-xl bg-cc-dark text-white text-xs font-semibold hover:bg-teal-900 transition"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
