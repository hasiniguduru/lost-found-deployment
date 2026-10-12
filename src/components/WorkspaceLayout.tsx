import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Building2,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../services/api';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const { user, unreadCount, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/items', label: 'Browse Lost & Found', icon: Search },
    { to: '/report', label: 'Report an Item', icon: PlusCircle },
    { to: '/hubs', label: 'Collection Desks', icon: Building2 },
    { to: '/claims', label: 'Verify & Claims', icon: ShieldCheck },
    {
      to: '/notifications',
      label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications',
      icon: Bell,
    },
  ];

  const getBreadcrumbLabel = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Campus Overview';
      case '/items':
        return 'Browse Lost & Found Items';
      case '/report':
        return 'Report Lost or Found Item';
      case '/hubs':
        return 'Fixed Campus Collection Desks';
      case '/claims':
        return 'Ownership Verification & Pickup Passes';
      case '/notifications':
        return 'Notifications & Alerts';
      default:
        return 'Campus Portal';
    }
  };

  const roleLabels: Record<UserRole, string> = {
    OWNER: 'Item Owner',
    FINDER: 'Item Finder',
    ADMIN_SECURITY: 'Campus Security',
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FB] text-slate-900">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[272px] lg:shrink-0 border-r border-indigo-100 bg-white">
        {/* Colorful Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-violet-700 text-white">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            <Compass className="w-5 h-5 text-amber-300 shrink-0" />
            <span>Lost & Found</span>
          </NavLink>
        </div>

        {/* Logged-in User Profile Card */}
        {user && (
          <div className="p-4 border-b border-indigo-100 bg-indigo-50/50">
            <div className="text-sm font-bold text-slate-900 truncate">
              {user.fullName}
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {user.email}
            </div>
            <div className="text-xs text-indigo-700 font-semibold truncate mt-1">
              {roleLabels[user.role]} · <span className="font-mono">{user.campusId}</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out Footer */}
        <div className="p-4 border-t border-indigo-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-full bg-white h-full flex flex-col z-10 border-r border-indigo-100">
            <div className="h-16 px-5 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-violet-700 text-white">
              <span className="font-display text-lg font-bold">
                Lost & Found
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-indigo-100 hover:text-white rounded-lg"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user && (
              <div className="p-4 border-b border-indigo-100 bg-indigo-50/50">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {user.fullName}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {user.email}
                </div>
                <div className="text-xs text-indigo-700 font-semibold truncate mt-1">
                  {roleLabels[user.role]} · <span className="font-mono">{user.campusId}</span>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-indigo-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-indigo-100">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="h-16 bg-white border-b border-indigo-100 px-6 flex items-center justify-between gap-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
              <span className="hidden sm:inline text-indigo-600 font-medium whitespace-nowrap">
                Campus Portal
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-bold text-slate-900 truncate">
                {getBreadcrumbLabel(location.pathname)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/report?mode=LOST')}
              className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
            >
              Report Lost Item
            </button>
            <button
              type="button"
              onClick={() => navigate('/report?mode=FOUND')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              Submit Found Item
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-6 py-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
