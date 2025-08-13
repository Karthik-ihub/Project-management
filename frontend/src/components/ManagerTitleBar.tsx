import React from 'react';
import { User } from 'lucide-react';

const ManagerTitleBar: React.FC = () => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Manager Profile</span>
            <div className="relative">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200">
                <User className="w-6 h-6" />
                <span>John Doe</span>
              </button>
              {/* Dropdown menu can be added later */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerTitleBar;