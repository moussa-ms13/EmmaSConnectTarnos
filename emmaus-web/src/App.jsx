import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthProvider from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CompanionsList from './pages/Companions/CompanionsList';
import CompanionProfile from './pages/Companions/CompanionProfile';
import HealthDashboard from './pages/Health/HealthDashboard';
import AppointmentsList from './pages/Appointments/AppointmentsList';
import TrainingsList from './pages/Trainings/TrainingsList';
import DocumentsManager from './pages/Documents/DocumentsManager';
import AchievementsList from './pages/Achievements/AchievementsList';
import VacationsList from './pages/Vacations/VacationsList';
import Settings from './pages/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import NotFound from './pages/NotFound/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Full-screen auth route — renders WITHOUT the sidebar */}
          <Route path="/login" element={<Login />} />

          {/* All authenticated routes — guarded by ProtectedRoute */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/"                element={<Navigate to="/tableau-de-bord" replace />} />
            <Route path="/tableau-de-bord" element={<Dashboard />} />
            <Route path="/compagnons"      element={<CompanionsList />} />
            <Route path="/compagnons/:id"  element={<CompanionProfile />} />
            <Route path="/sante"           element={<HealthDashboard />} />
            <Route path="/rendez-vous"     element={<AppointmentsList />} />
            <Route path="/formations"      element={<TrainingsList />} />
            <Route path="/documents"       element={<DocumentsManager />} />
            <Route path="/realisations"    element={<AchievementsList />} />
            <Route path="/conges"           element={<VacationsList />} />
            <Route path="/parametres"      element={<Settings />} />
            <Route path="/notifications"   element={<Notifications />} />
            <Route path="*"                element={<NotFound />} />
          </Route>

          {/* Fallback 404 route for unauthenticated paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;