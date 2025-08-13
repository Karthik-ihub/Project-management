import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, List, Folder } from 'lucide-react';

const ManagerSidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white shadow-lg flex flex-col">
      <div className="p-6">
        <span className="text-xl font-bold">Manager Dashboard</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink
          to="/manager/home"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-md text-sm font-medium ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-500'
            } transition-colors duration-200`
          }
        >
          <Home className="w-5 h-5 mr-3" />
          Home
        </NavLink>
        <NavLink
          to="/manager/developers"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-md text-sm font-medium ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-500'
            } transition-colors duration-200`
          }
        >
          <Users className="w-5 h-5 mr-3" />
          Developers
        </NavLink>
        <NavLink
          to="/manager/tasks"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-md text-sm font-medium ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-500'
            } transition-colors duration-200`
          }
        >
          <List className="w-5 h-5 mr-3" />
          Tasks
        </NavLink>
        <NavLink
          to="/manager/projects"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-md text-sm font-medium ${
              isActive ? 'bg-blue-700' : 'hover:bg-blue-500'
            } transition-colors duration-200`
          }
        >
          <Folder className="w-5 h-5 mr-3" />
          Projects
        </NavLink>
      </nav>
    </aside>
  );
};

export default ManagerSidebar;