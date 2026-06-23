import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Building2, Target, Users, Settings, Sun, Moon, MessageSquare, Lightbulb, LogOut, Repeat } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { base44 } from '@/api/base44Client';
import { useNotifications } from '@/lib/useNotifications';

const navItems = [
  { label: 'The Motherboard', path: '/', icon: LayoutDashboard },
  { label: 'My Work', path: '/my-work', icon: UserCheck },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Ongoing Responsibilities', path: '/responsibilities', icon: Repeat },
  { label: 'Leads', path: '/leads', icon: Target },
  { label: 'Clients', path: '/clients', icon: Building2 },
  { label: 'Bright Ideas', path: '/bright-ideas', icon: Lightbulb },
  { label: 'Team Meetings', path: '/team-meetings', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const handleLogout = () => base44.auth.logout('/login');

  return (
    <aside className="w-60 h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-30">
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <img src="https://media.base44.com/images/public/6a319e757dacbad40bdfaa71/8a545800a_ONEelevenMainLogo.png" alt="One Eleven Group HQ" className="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="text-sidebar-foreground font-heading font-extrabold text-xs tracking-wide leading-tight">ONE ELEVEN</h1>
            <p className="text-sidebar-foreground/50 text-[10px] font-semibold tracking-wider uppercase">Group HQ</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {item.label}
              {item.path === '/messages' && unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2.5 border-t border-sidebar-border space-y-0.5">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-foreground'
              : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <Settings className="w-4.5 h-4.5 flex-shrink-0" />
          Settings
        </Link>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5 flex-shrink-0" /> : <Moon className="w-4.5 h-4.5 flex-shrink-0" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}