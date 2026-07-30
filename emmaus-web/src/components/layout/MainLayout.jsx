import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

/**
 * MainLayout — Root layout wrapper for the authenticated area.
 * Renders a fixed Sidebar on the left, TopHeader at the top right,
 * and a scrollable main content area below the header with mobile drawer support.
 */
function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 bg-background overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
