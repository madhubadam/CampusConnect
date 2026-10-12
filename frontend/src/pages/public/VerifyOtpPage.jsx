import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Mail,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Email from search params or router location state
  const initialEmail = searchParams.get('email') || location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');

  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(
    location.state?.message || 'A 6-digit security code has been dispatched to your official college inbox via Brevo transactional email.'
  );

  // 5-minute countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError('Please provide the official college email address associated with your registration.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('Please enter a complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      await api.verifyOtp(targetEmail, otp.trim());

      // Account activated on backend -> redirect to login with confirmation
      navigate('/login?verified=true', {
        state: {
          successMessage: 'Account successfully verified and activated! Please sign in with your college credentials.',
          email: targetEmail
        }
      });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code or request a new OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError('Please specify your college email address before requesting a new OTP.');
      return;
    }

    setError('');
    setResending(true);

    try {
      const response = await api.requestOtp(targetEmail, 'REGISTRATION');
      setCountdown(300);
      setSuccessInfo(response.message || `A fresh verification code has been dispatched to ${targetEmail} via Brevo.`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch a new verification code. Please check your Brevo configuration.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-cc-bg">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-soft border border-cc-surface mb-3">
            <ShieldCheck className="w-8 h-8 text-cc-dark" />
          </div>
          <h1 className="text-2xl font-black text-cc-navy tracking-tight">Email OTP Verification</h1>
          <p className="text-xs font-semibold text-cc-dark uppercase tracking-widest mt-0.5">
            BVC Engineering College &bull; CSE Department
          </p>
          <p className="text-xs text-cc-slate mt-1">
            Enter the 6-digit verification code dispatched to your college inbox
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-soft border border-cc-surface p-6 sm:p-8">
          {/* Target Email Display */}
          <div className="mb-5 p-3.5 rounded-xl bg-cc-bg border border-cc-surface flex items-center gap-3">
            <Mail className="w-5 h-5 text-cc-dark shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cc-muted">
                Official College Email
              </div>
              {initialEmail ? (
                <div className="text-sm font-bold text-cc-navy font-mono truncate">{email}</div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. 22221A0515@bvcgroup.in"
                  className="w-full text-xs font-mono font-semibold text-cc-navy bg-transparent outline-none border-b border-cc-hover focus:border-cc-teal"
                />
              )}
            </div>
            <Link
              to="/register"
              className="text-[11px] font-semibold text-cc-dark hover:underline shrink-0"
              title="Change email"
            >
              Change
            </Link>
          </div>

          {/* Delivery Confirmation Feedback */}
          {successInfo && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Brevo Transactional Delivery: </span>
                {successInfo}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cc-slate mb-1 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  required
                  autoFocus
                  className="w-full py-3.5 text-center text-3xl font-mono tracking-[0.4em] font-extrabold rounded-xl border border-cc-hover bg-slate-50/50 focus:bg-white focus:border-cc-teal focus:ring-4 focus:ring-cc-teal/20 outline-none transition text-cc-navy placeholder:text-cc-muted/30"
                />
              </div>
            </div>

            {/* Timer & Resend Controls */}
            <div className="flex items-center justify-between text-xs py-1 px-1">
              <div className="flex items-center gap-1.5 text-cc-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Expires in:{' '}
                  <strong className={`font-mono font-bold ${countdown < 60 ? 'text-rose-600 animate-pulse' : 'text-cc-navy'}`}>
                    {formatTimer(countdown)}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || countdown > 240}
                className="text-cc-dark font-bold hover:underline disabled:opacity-40 disabled:hover:no-underline flex items-center gap-1 transition cursor-pointer"
                title={countdown > 240 ? 'Please wait before requesting a new code' : 'Request a new OTP via Brevo'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Dispatching...' : 'Resend Code'}</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying &amp; Activating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP &amp; Activate Account</span>
                </>
              )}
            </button>
          </form>

          {/* Navigation link back to login or registration */}
          <div className="mt-6 pt-5 border-t border-cc-surface flex items-center justify-between text-xs text-cc-slate">
            <Link to="/register" className="text-cc-muted hover:text-cc-navy inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
            </Link>
            <Link to="/login" className="text-cc-dark font-bold hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center text-[11px] text-cc-muted">
          CampusConnect Security Framework &bull; Autonomous Verification System
        </div>
      </div>
    </div>
  );
}
