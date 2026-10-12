import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';

// Public authentication pages
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { VerifyOtpPage } from './pages/public/VerifyOtpPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';

// Student pages
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentProfile } from './pages/student/StudentProfile';
import { SemesterMarks } from './pages/student/SemesterMarks';
import { AttendanceDashboard } from './pages/student/AttendanceDashboard';
import { FeeDashboard } from './pages/student/FeeDashboard';
import { SubjectImprovement } from './pages/student/SubjectImprovement';
import { RiskInsights } from './pages/student/RiskInsights';
import { Announcements } from './pages/student/Announcements';

// Faculty pages
import { FacultyOverview } from './pages/faculty/FacultyOverview';
import { MyClasses } from './pages/faculty/MyClasses';
import { AddStudentModal } from './pages/faculty/AddStudentModal';
import { AttendanceMarking } from './pages/faculty/AttendanceMarking';
import { MarksManagement } from './pages/faculty/MarksManagement';
import { FacultyRiskAnalytics } from './pages/faculty/RiskAnalytics';

// HOD pages
import { HodOverview } from './pages/hod/HodOverview';
import { StudentDirectory } from './pages/hod/StudentDirectory';
import { SectionAnalytics } from './pages/hod/SectionAnalytics';
import { FacultyManagement } from './pages/hod/FacultyManagement';
import { TeachingAssignments } from './pages/hod/TeachingAssignments';
import { ReportsExport } from './pages/hod/ReportsExport';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-semibold text-cc-dark animate-pulse">
        Verifying Academic Authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function MainLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cc-bg flex flex-col">
      <Navbar onMenuToggle={() => setIsMobileOpen(prev => !prev)} isMobileOpen={isMobileOpen} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {user && (
          <Sidebar isMobileOpen={isMobileOpen} closeMobile={() => setIsMobileOpen(false)} />
        )}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            {/* Public Auth-First Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Student Protected Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentOverview /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/marks" element={<ProtectedRoute allowedRoles={['STUDENT']}><SemesterMarks /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><AttendanceDashboard /></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['STUDENT']}><FeeDashboard /></ProtectedRoute>} />
            <Route path="/student/improvement" element={<ProtectedRoute allowedRoles={['STUDENT']}><SubjectImprovement /></ProtectedRoute>} />
            <Route path="/student/risk-insights" element={<ProtectedRoute allowedRoles={['STUDENT']}><RiskInsights /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['STUDENT']}><Announcements /></ProtectedRoute>} />

            {/* Faculty Protected Routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><FacultyOverview /></ProtectedRoute>} />
            <Route path="/faculty/classes" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><MyClasses /></ProtectedRoute>} />
            <Route path="/faculty/add-student" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><AddStudentModal /></ProtectedRoute>} />
            <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><AttendanceMarking /></ProtectedRoute>} />
            <Route path="/faculty/marks" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><MarksManagement /></ProtectedRoute>} />
            <Route path="/faculty/risk-analytics" element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD']}><FacultyRiskAnalytics /></ProtectedRoute>} />

            {/* HOD Protected Routes */}
            <Route path="/hod" element={<ProtectedRoute allowedRoles={['HOD']}><HodOverview /></ProtectedRoute>} />
            <Route path="/hod/students" element={<ProtectedRoute allowedRoles={['HOD']}><StudentDirectory /></ProtectedRoute>} />
            <Route path="/hod/sections" element={<ProtectedRoute allowedRoles={['HOD']}><SectionAnalytics /></ProtectedRoute>} />
            <Route path="/hod/faculty" element={<ProtectedRoute allowedRoles={['HOD']}><FacultyManagement /></ProtectedRoute>} />
            <Route path="/hod/assignments" element={<ProtectedRoute allowedRoles={['HOD']}><TeachingAssignments /></ProtectedRoute>} />
            <Route path="/hod/reports" element={<ProtectedRoute allowedRoles={['HOD']}><ReportsExport /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
