import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  BrainCircuit,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Award
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cc-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cc-surface border border-cc-teal/40 text-cc-dark text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="w-4 h-4 text-cc-dark" />
              <span>Bonam Venkata Chalamaya Engineering College &bull; Department of CSE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-cc-navy tracking-tight leading-tight">
              Smart College Management &amp; <span className="text-cc-dark bg-gradient-to-r from-cc-dark to-teal-600 bg-clip-text text-transparent">AI Student Risk Analytics</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-cc-slate leading-relaxed">
              CampusConnect bridges academic administration, daily classroom attendance, marks tracking, and machine learning-powered academic early-warning indicators for 180 CSE engineering students.
            </p>

            {/* Portal Entry Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cc-dark hover:bg-teal-900 active:scale-95 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to CampusConnect</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-cc-surface/50 border border-cc-surface text-cc-navy font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-cc-dark" />
                <span>Create Student Account</span>
              </Link>
            </div>

            <p className="mt-4 text-xs text-cc-muted">
              Official institutional domain required: <strong className="text-cc-dark font-semibold">@bvcgroup.in</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-white border-y border-cc-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-cc-navy">Engineered for Academic Excellence</h2>
            <p className="mt-2 text-cc-slate text-sm">Comprehensive modules designed for JNTUK autonomous engineering colleges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-cc-bg/40 border border-cc-surface hover:border-cc-teal transition">
              <div className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center text-cc-dark mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-cc-navy mb-2">Classroom Attendance</h3>
              <p className="text-xs text-cc-slate leading-relaxed">
                Slot-based attendance recording with session audit trails, percentage tracking, and medical leave/on-duty exception workflows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cc-bg/40 border border-cc-surface hover:border-cc-teal transition">
              <div className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center text-cc-dark mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-cc-navy mb-2">Predictive Academic Risk</h3>
              <p className="text-xs text-cc-slate leading-relaxed">
                Python FastAPI microservice analyzing attendance trends, internal assessments, and previous backlogs to identify at-risk students before final exams.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cc-bg/40 border border-cc-surface hover:border-cc-teal transition">
              <div className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center text-cc-dark mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-cc-navy mb-2">Role-Based Security</h3>
              <p className="text-xs text-cc-slate leading-relaxed">
                Strict college email validation, Brevo transactional OTP verification, and compartmentalized access controls for Students, Faculty, and HOD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-cc-bg text-center text-xs text-cc-muted">
        <p>Bonam Venkata Chalamaya Engineering College &bull; Department of Computer Science & Engineering</p>
        <p className="mt-1">CampusConnect AI Academic Management Platform</p>
      </footer>
    </div>
  );
}
