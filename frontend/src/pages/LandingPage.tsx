import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { UserCheck, Code, ArrowRight, Shield, Zap, Users, Bot, ChevronDown } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handlePortalAccess = (portal: 'manager' | 'developer') => {
    // Redirect to the appropriate login page
    if (portal === 'manager') {
      navigate('/manager/login');
    } else if (portal === 'developer') {
      navigate('/developer/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Navbar */}
      <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Taskify
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <button 
                onClick={() => handlePortalAccess('manager')}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
              >
                <UserCheck className="w-5 h-5" />
                <span>Manager Portal</span>
              </button>
              <button 
                onClick={() => handlePortalAccess('developer')}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                <Code className="w-5 h-5" />
                <span>Developer Portal</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ChevronDown className={`w-6 h-6 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden pb-4 space-y-2">
              <button 
                onClick={() => handlePortalAccess('manager')}
                className="flex items-center space-x-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors duration-200"
              >
                <UserCheck className="w-5 h-5" />
                <span>Manager Portal</span>
              </button>
              <button 
                onClick={() => handlePortalAccess('developer')}
                className="flex items-center space-x-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
              >
                <Code className="w-5 h-5" />
                <span>Developer Portal</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-sm font-medium text-gray-700 mb-8">
              <Zap className="w-4 h-4 mr-2 text-blue-600" />
              Powered by Advanced AI Technology
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Taskify
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Empowering seamless collaboration between managers and developers through 
              intelligent automation and streamlined workflows
            </p>

            {/* Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {/* Manager Portal Card */}
              <button
                onClick={() => handlePortalAccess('manager')}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 p-8 transition-all duration-300 transform hover:-translate-y-2 text-left"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-600 transition-colors duration-300">
                    <UserCheck className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Manager Portal</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Oversee projects, manage teams, and drive innovation from your centralized 
                  dashboard with powerful analytics and insights.
                </p>
                <div className="flex items-center text-purple-600 group-hover:text-purple-700 font-semibold">
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>

              {/* Developer Portal Card */}
              <button
                onClick={() => handlePortalAccess('developer')}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 p-8 transition-all duration-300 transform hover:-translate-y-2 text-left"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <Code className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Developer Portal</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Contribute to projects, manage tasks, and showcase your skills with 
                  advanced development tools and collaboration features.
                </p>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-semibold">
                  <span>Start Building</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure & Reliable</h4>
                <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h4>
                <p className="text-gray-600">Seamless communication and project coordination</p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h4>
                <p className="text-gray-600">Intelligent automation for enhanced productivity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold">Taskify</span>
          </div>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Taskify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;