import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import ManagerTitleBar from '../components/ManagerTitleBar';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Developer {
  _id: string;
  name: string;
  role: string;
  skills: string[];
  bandwidth: number;
  work_batch: string;
}

const ManagerNewProject: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [projectGoal, setProjectGoal] = useState<string>('');
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fetch developers on mount
  useEffect(() => {
    const fetchDevelopers = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/developers/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch developers');
        }
        setDevelopers(data.developers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch developers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  const toggleDeveloperSelection = (developerId: string) => {
    setSelectedDevelopers((prev) =>
      prev.includes(developerId)
        ? prev.filter((id) => id !== developerId)
        : [...prev, developerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea || !teamName || !projectGoal || selectedDevelopers.length === 0) {
      setError('Please fill in all fields and select at least one developer');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const project_id = uuidv4();
      const team_metadata = {
        team_name: teamName,
        members: developers
          .filter((dev) => selectedDevelopers.includes(dev._id))
          .map((dev) => ({ name: dev.name, role: dev.role })),
        project_goal: projectGoal,
      };

      const response = await fetch('http://127.0.0.1:8000/api/submit-idea/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project_id, idea, team_metadata }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit idea');
      }
      // Navigate to analysis page with response data
      navigate('/manager/analysis', { state: { analysis: data.analysis, project_id } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit idea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar />
      <div className="flex-1 ml-64">
        <ManagerTitleBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h1>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Idea
                </label>
                <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your project idea..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  rows={5}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="projectGoal" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Goal
                </label>
                <input
                  id="projectGoal"
                  type="text"
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  placeholder="Enter project goal"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Idea'
                )}
              </button>
            </div>
          </form>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && <p className="text-gray-600">Loading developers...</p>}
            {developers.length === 0 && !isLoading && <p className="text-gray-600">No developers available.</p>}
            {developers.map((developer) => (
              <div
                key={developer._id}
                className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <User className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{developer.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2"><strong>Role:</strong> {developer.role}</p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Skills:</strong> {developer.skills.join(', ')}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Bandwidth:</strong> {developer.bandwidth * 100}%
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Work Hours:</strong> {developer.work_batch}
                </p>
                <button
                  onClick={() => toggleDeveloperSelection(developer._id)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                    selectedDevelopers.includes(developer._id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={isLoading}
                >
                  {selectedDevelopers.includes(developer._id) ? 'Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerNewProject;