import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  showNav?: boolean;
  showHeader?: boolean;
  title?: string;
}

export function Layout({
  showNav = true,
  showHeader = true,
  title,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showHeader && <Header title={title} />}
      <main className={`max-w-lg mx-auto ${showNav ? 'pb-20' : ''} ${showHeader ? '' : ''}`}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
