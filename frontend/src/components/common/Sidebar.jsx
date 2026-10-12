import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  User,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  BrainCircuit,
  Megaphone,
  Users,
  UserPlus,
  ClipboardCheck,
  Edit3,
  ShieldAlert,
  HeartHandshake,
  Layers,
  FileSpreadsheet,
  Settings,
  BookOpen
} from 'lucide-react';

export function Sidebar({ isMobileOpen, closeMobile }) {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { to: '/student', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/student/profile', label: 'My Academic Profile', icon: User },
    { to: '/student/marks', label: 'Semester Marks', icon: GraduationCap },
    { to: '/student/attendance', label: 'Attendance Records', icon: CalendarCheck },
    { to: '/student/fees', label: 'Fee Details', icon: CreditCard },
    { to: '/student/improvement', label: 'Subject Improvement', icon: TrendingUp },
    { to: '/student/risk-insights', label: 'Academic Risk Insights', icon: BrainCircuit },
    { to: '/student/announcements', label: 'Announcements', icon: Megaphone }
  ];

  const facultyLinks = [
    { to: '/faculty', label: 'Faculty Overview', icon: LayoutDashboard },
    { to: '/faculty/classes', label: 'My Classes (Sections A-C)', icon: Users },
    { to: '/faculty/add-student', label: 'Enroll Student', icon: UserPlus },
    { to: '/faculty/attendance', label: 'Attendance Marking', icon: ClipboardCheck },
    { to: '/faculty/marks', label: 'Marks Management', icon: Edit3 },
    { to: '/faculty/risk-analytics', label: 'Student Risk Analytics', icon: ShieldAlert }
  ];

  const hodLinks = [
    { to: '/hod', label: 'Department Overview', icon: LayoutDashboard },
    { to: '/hod/students', label: 'CSE Student Directory', icon: Users },
    { to: '/hod/sections', label: 'Section-wise Analytics', icon: Layers },
    { to: '/hod/faculty', label: 'Faculty Management', icon: BookOpen },
    { to: '/hod/assignments', label: 'Teaching Assignments', icon: Settings },
    { to: '/hod/reports', label: 'Export Reports (CSV/PDF)', icon: FileSpreadsheet }
  ];

  let links = [];
  let roleTitle = '';
  if (user.role === 'HOD') {
    links = hodLinks;
    roleTitle = 'HOD Portal';
  } else if (user.role === 'FACULTY') {
    links = facultyLinks;
    roleTitle = 'Faculty Portal';
  } else {
    links = studentLinks;
    roleTitle = 'Student Portal';
  }

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-cc-surface shadow-sm no-print">
      <div className="p-4 border-b border-cc-surface bg-cc-bg/40">
        <span className="text-xs uppercase font-extrabold tracking-wider text-cc-dark">{roleTitle}</span>
        <p className="text-sm font-bold text-cc-navy truncate mt-0.5">{user.name}</p>
        <span className="text-[11px] text-cc-muted">
          {user.role === 'HOD'
            ? `${user.department || 'CSE'} • Head of Department`
            : user.role === 'FACULTY'
            ? `${user.department || 'CSE'} • Faculty Member`
            : `${user.department || 'CSE'} • ${user.section || 'All Sections'}`}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/student' || link.to === '/faculty' || link.to === '/hod'}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-cc-teal text-white shadow-sm shadow-cc-teal/40 font-semibold'
                    : 'text-cc-slate hover:bg-cc-surface hover:text-cc-dark'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-cc-surface text-center">
        <div className="text-[11px] text-cc-muted">
          BVC Engineering College<br />
          <span className="font-semibold text-cc-slate">JNTUK Affiliated &bull; Autonomous</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-cc-navy/50 backdrop-blur-sm" onClick={closeMobile}></div>
          <div className="relative w-72 max-w-xs h-full z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
