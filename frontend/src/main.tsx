import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { NotificationProvider } from '@/context/NotificationContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import ApiStatusBanner from '@/components/ApiStatusBanner';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Impact from '@/pages/Impact';
import Guidelines from '@/pages/Guidelines';
import AppIndex from '@/pages/AppIndex';

import CustomerDashboard from '@/pages/customer/Dashboard';
import SchedulePickup from '@/pages/customer/SchedulePickup';
import MyPickups from '@/pages/customer/MyPickups';
import PickupTracking from '@/pages/customer/PickupTracking';
import Transactions from '@/pages/customer/Transactions';
import CustomerImpact from '@/pages/customer/CustomerImpact';
import Profile from '@/pages/Profile';

import CollectorDashboard from '@/pages/collector/Dashboard';
import Requests from '@/pages/collector/Requests';
import ActivePickups from '@/pages/collector/ActivePickups';
import Earnings from '@/pages/collector/Earnings';
import RoutePlanner from '@/pages/collector/RoutePlanner';
import Customers from '@/pages/collector/Customers';

import RecyclerOverview from '@/pages/recycler/Overview';
import RecyclerFlow from '@/pages/recycler/Flow';
import RecyclerIntake from '@/pages/recycler/Intake';

import AdminAnalytics from '@/pages/admin/Analytics';
import AdminPickups from '@/pages/admin/AdminPickups';
import CollectorNetwork from '@/pages/admin/CollectorNetwork';
import Presentation from '@/pages/admin/Presentation';

function RequireRole({ role, children }: { role: string; children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-10 w-40" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/app" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <ApiStatusBanner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/guidelines" element={<Guidelines />} />

              <Route path="/app" element={<DashboardLayout />}>
                {/* Role-aware index */}
                <Route index element={<AppIndex />} />
                <Route path="schedule" element={
                  <RequireRole role="customer"><SchedulePickup /></RequireRole>} />
                <Route path="pickups" element={
                  <RequireRole role="customer"><MyPickups /></RequireRole>} />
                <Route path="pickups/:id" element={
                  <RequireRole role="customer"><PickupTracking /></RequireRole>} />
                <Route path="transactions" element={
                  <RequireRole role="customer"><Transactions /></RequireRole>} />
                <Route path="impact" element={<CustomerImpact />} />
                <Route path="profile" element={<Profile />} />

                {/* Collector */}
                <Route path="requests" element={
                  <RequireRole role="collector"><Requests /></RequireRole>} />
                <Route path="active" element={
                  <RequireRole role="collector"><ActivePickups /></RequireRole>} />
                <Route path="earnings" element={
                  <RequireRole role="collector"><Earnings /></RequireRole>} />
                <Route path="route" element={
                  <RequireRole role="collector"><RoutePlanner /></RequireRole>} />
                <Route path="customers" element={
                  <RequireRole role="collector"><Customers /></RequireRole>} />

                {/* Recycler */}
                <Route path="recycler/flow" element={
                  <RequireRole role="recycler"><RecyclerFlow /></RequireRole>} />
                <Route path="recycler/intake" element={
                  <RequireRole role="recycler"><RecyclerIntake /></RequireRole>} />

                {/* Admin */}
                <Route path="admin/pickups" element={
                  <RequireRole role="admin"><AdminPickups /></RequireRole>} />
                <Route path="collectors" element={
                  <RequireRole role="admin"><CollectorNetwork /></RequireRole>} />
                <Route path="presentation" element={
                  <RequireRole role="admin"><Presentation /></RequireRole>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
