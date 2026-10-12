import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl border border-cc-surface shadow-soft">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Access Restricted</h1>
        <p className="text-xs text-cc-slate mt-2 leading-relaxed">
          You do not have the required administrative or role permissions to view this resource. Access is strictly logged and enforced by CampusConnect role security guards.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cc-dark text-white font-semibold text-xs hover:bg-teal-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Campus Home
          </Link>
        </div>
      </div>
    </div>
  );
}
