import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';

export const Layout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-graphite-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-graphite-950">
          <Outlet />
        </main>
      </div>
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
