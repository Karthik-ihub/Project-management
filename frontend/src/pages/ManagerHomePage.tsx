import React from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import ManagerTitleBar from '../components/ManagerTitleBar';
import { PlusCircle } from 'lucide-react';

const ManagerHomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar />
      <div className="flex-1 ml-64">
        <ManagerTitleBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md mx-auto">
            <div className="flex flex-col items-center text-center">
              <PlusCircle className="w-12 h-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">New Project</h2>
              <p className="text-gray-600 mb-6">Start a new project to organize tasks and collaborate with your team.</p>
              <button
                onClick={() => navigate('/manager/new-project')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHomePage;