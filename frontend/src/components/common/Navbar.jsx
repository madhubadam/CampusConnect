import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Bell, User, BookOpen, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Navbar({ onMenuToggle, isMobileOpen }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'HOD':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-semibold">Department HOD</span>;
      case 'FACULTY':
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 text-xs px-2 py-0.5 rounded-full font-semibold">CSE Faculty</span>;
      case 'STUDENT':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-semibold">CSE Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-cc-surface sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-cc-slate hover:bg-cc-surface transition"
              aria-label="Toggle Navigation"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cc-teal to-cc-dark flex items-center justify-center text-white shadow-md shadow-cc-teal/30 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-cc-navy">Campus<span className="text-cc-dark">Connect</span></span>
                  <span className="text-[10px] bg-cc-hover/40 text-cc-dark px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">BVC CSE</span>
                </div>
                <p className="text-[11px] text-cc-muted hidden sm:block">Bonam Venkata Chalamaya Engineering College</p>
              </div>
            </Link>
          </div>

          {/* Right user profile & actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-cc-navy leading-tight">{user.name}</span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {getRoleBadge(user.role)}
                    <span className="text-[11px] text-cc-muted">
                      {user.role === 'STUDENT' ? (user.section || user.department) : (user.department || 'CSE Department')}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-cc-surface border border-cc-teal/50 flex items-center justify-center text-cc-dark font-bold text-sm shadow-sm">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-cc-slate hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-cc-dark hover:text-cc-navy px-3 py-2 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-cc-dark hover:bg-teal-900 px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
