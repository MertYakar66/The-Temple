import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showSettings?: boolean;
}

export function Header({ title = 'TheTemple', showSettings = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {showSettings && (
          <Link
            to="/settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
        )}
      </div>
    </header>
  );
}
