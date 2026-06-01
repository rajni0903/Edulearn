/**
 * App.js - Root component with routing
 * ProtectedRoute: checks JWT + role
 * GuestRoute: redirects logged-in users away from login/register
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import CoursesPage         from './pages/CoursesPage';
import CourseDetailPage    from './pages/CourseDetailPage';
import StudentDashboard    from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard      from './pages/AdminDashboard';
import QuizPage            from './pages/QuizPage';
import AssignmentPage      from './pages/AssignmentPage';

// Protected route — requires login + optional role
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return (
    <div className="el-loading">
      <div className="text-center">
        <div className="el-spinner mx-auto mb-3"></div>
        <p style={{ color:'var(--el-accent)', fontWeight:600 }}>Loading EduLearn…</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirect logged-in user to their dashboard
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin')      return <Navigate to="/admin"      replace />;
  if (user.role === 'instructor') return <Navigate to="/instructor" replace />;
  return <Navigate to="/student" replace />;
};

// Prevent logged-in users from visiting login/register
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3500} pauseOnHover newestOnTop
          toastStyle={{ fontFamily:'Poppins,sans-serif', borderRadius:'var(--r-md)' }} />
        <Routes>
          {/* Public */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/courses"     element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />

          {/* Guest only */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          {/* Role dashboards */}
          <Route path="/student"    element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/instructor" element={<ProtectedRoute roles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/admin"      element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          {/* Quiz & Assignment */}
          <Route path="/quiz/:quizId"              element={<ProtectedRoute roles={['student']}><QuizPage /></ProtectedRoute>} />
          <Route path="/assignment/:assignmentId"  element={<ProtectedRoute roles={['student']}><AssignmentPage /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
