import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/lib/ThemeContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-60 p-6 lg:p-8 bg-background min-h-screen">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}