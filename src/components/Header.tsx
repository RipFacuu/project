import React from 'react';
import { QrCode } from 'lucide-react';

interface HeaderProps {
  title: string;
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
