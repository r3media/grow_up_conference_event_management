import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  IdCard,
  QrCode,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Scan
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Tickets', href: '/tickets', icon: CreditCard },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Badge Designer', href: '/badge-designer', icon: IdCard },
    { name: 'Scanner', href: '/scanner', icon: Scan },
    { name: 'Orders', href: '/orders', icon: CreditCard },
    { name: 'Check-In', href: '/checkin', icon: QrCode },
    { name: 'Communications', href: '/communications', icon: Mail },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`bg-slate-900 text-slate-50 border-r border-slate-800 transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <img
                src="https://customer-assets.emergentagent.com/job_b24daee5-f6b3-4e7a-8cbd-5bf09369a819/artifacts/pq64btdj_ep-logo.png"
                alt="EventPass"
                className="h-8"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
          )}
          <button
            data-testid="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.name}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.role}</p>
                </div>
              </div>
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              data-testid="logout-button-collapsed"
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">EventPass</h1>
              <p className="text-sm text-slate-600">Multi-tenant Event Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Tenant: <span className="font-medium text-slate-900">{user?.tenant_id?.slice(0, 8)}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};