import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ManagerLogin from './pages/ManagerLogin';
import DeveloperLogin from './pages/DeveloperLogin';
import ManagerSignup from './pages/ManagerSignup';
import DeveloperSignup from './pages/DeveloperSignup';
import ManagerHomePage from './pages/ManagerHomePage';
import ManagerNewProject from './pages/ManagerNewProject';
import ManagerAnalysis from './pages/ManagerAnalysis';
import EpicsDisplay from "./pages/EpicsDisplay";
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/manager/login" element={<ManagerLogin />} />
      <Route path="/manager/signup" element={<ManagerSignup />} />
      <Route path="/developer/login" element={<DeveloperLogin />} />
      <Route path="/developer/signup" element={<DeveloperSignup />} />
      <Route path="/developer/forgot" element={<div>Forgot Password (TBD)</div>} />
      <Route path="/manager/forgot" element={<div>Manager Forgot Password (TBD)</div>} />

      {/* Protected Routes */}
      <Route
        path="/manager/home"
        element={
          <ProtectedRoute userType="manager">
            <ManagerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/new-project"
        element={
          <ProtectedRoute userType="manager">
            <ManagerNewProject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/analysis"
        element={
          <ProtectedRoute userType="manager">
            <ManagerAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/epics"
        element={
          <ProtectedRoute userType="manager">
            <EpicsDisplay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/profile"
        element={
          <ProtectedRoute userType="manager">
            <div>Manager Profile (TBD)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/developers"
        element={
          <ProtectedRoute userType="manager">
            <div>Developers (TBD)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/tasks"
        element={
          <ProtectedRoute userType="manager">
            <div>Tasks (TBD)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <ProtectedRoute userType="manager">
            <div>Projects (TBD)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/profile"
        element={
          <ProtectedRoute userType="developer">
            <div>Developer Profile (TBD)</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;