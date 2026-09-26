/** Authenticated dashboard shell with role-aware sidebar. */
import { useState } from 'react';
import type { ComponentType } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { LucideProps } from 'lucide-react';
import {
  BarChart3, CalendarClock, ClipboardList, Factory, LayoutDashboard, Leaf,
  LogOut, Menu, Presentation, Recycle, Route, ShieldCheck, Trash2, Users, UserCircle, Wallet, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import NotificationBell from '@/components/NotificationBell';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

type NavIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number } | any>;
const NAV: Record<Role, { to: string; icon: NavIcon; label: string }[]> = {
  customer: [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/schedule', icon: CalendarClock, label: 'Schedule Pickup' },
    { to: '/app/pickups', icon: ClipboardList, label: 'My Pickups' },
    { to: '/app/transactions', icon: Wallet, label: 'Transactions' },
    { to: '/app/impact', icon: Leaf, label: 'Impact' },
    { to: '/app/profile', icon: UserCircle, label: 'Profile' },
  ],
  collector: [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/requests', icon: ClipboardList, label: 'Pickup Requests' },
    { to: '/app/active', icon: TruckRouteIcon, label: 'Active Pickups' },
    { to: '/app/earnings', icon: Wallet, label: 'Earnings' },
    { to: '/app/route', icon: Route, label: 'Route' },
    { to: '/app/customers', icon: Users, label: 'Customers' },
    { to: '/app/profile', icon: UserCircle, label: 'Profile' },
  ],
  recycler: [
    { to: '/app', icon: LayoutDashboard, label: 'Overview' },
    { to: '/app/recycler/flow', icon: Factory, label: 'Material Flow' },
    { to: '/app/recycler/intake', icon: TruckRouteIcon, label: 'Incoming' },
    { to: '/app/impact', icon: Leaf, label: 'Impact' },
  ],
  admin: [
    { to: '/app', icon: BarChart3, label: 'Analytics' },
    { to: '/app/admin/pickups', icon: ClipboardList, label: 'All Pickups' },
    { to: '/app/impact', icon: Leaf, label: 'Impact' },
    { to: '/app/collectors', icon: ShieldCheck, label: 'Collector Network' },
    { to: '/app/presentation', icon: Presentation, label: 'Presentation Mode' },
  ],
};

function TruckRouteIcon(props: { size?: number; className?: string }) {
  return <Trash2 {...props} />;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  if (!user) return null;
  const nav = NAV[user.role];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Recycle size={19} />
        </span>
        <div>
          <p className="font-display text-[15px] font-bold leading-tight text-ink">Kabadiwala Connect</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">SIH 2026 Prototype</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Dashboard">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/app'}
            onClick={() => setDrawer(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition
              ${isActive ? 'bg-brand-600 text-white shadow-[0_4px_14px_-4px_rgba(5,150,105,.5)]'
                : 'text-ink-soft hover:bg-neutral-100 hover:text-ink'}`}>
            <item.icon size={17} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-neutral-100 p-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
            <p className="truncate text-[11px] capitalize text-neutral-500">{user.role} account</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium text-neutral-500 transition hover:bg-red-50 hover:text-red-600">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in bg-white shadow-lift">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
          <button type="button" className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
            onClick={() => setDrawer(true)} aria-label="Open menu">
            {drawer ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-bold text-ink">
              {nav.find((n) => n.to === '/app') && false ? '' : ''}
              {user.role === 'admin' ? 'City Analytics' :
                user.role === 'recycler' ? 'Recycling Partner' :
                  user.role === 'collector' ? 'Collector Workspace' : 'Household Dashboard'}
            </p>
          </div>
          <LanguageSwitcher compact />
          <NotificationBell />
          <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700 sm:block">
            Demo Mode
          </span>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8" id="main">
          <Outlet />
        </main>

        <footer className="border-t border-neutral-200 bg-white px-4 py-4 text-center text-[11.5px] text-neutral-400 lg:px-8">
          Kabadiwala Connect · SIH26229 prototype · All figures are demo data
        </footer>
      </div>
    </div>
  );
}
