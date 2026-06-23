import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ThemeProvider } from '@/lib/ThemeContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-60 bg-background min-h-screen">
          <header className="h-12 border-b border-border flex items-center justify-end px-6 sticky top-0 z-20 bg-background">
            <NotificationBell />
          </header>
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}