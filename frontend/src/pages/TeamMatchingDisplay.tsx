import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import ManagerTitleBar from '../components/ManagerTitleBar';
import { Edit2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Allocation {
  story_title: string;
  assigned_to: string;
  reason: string;
}

const TeamMatchingDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { team_matching: initialTeamMatching, project_id } = (location.state || {}) as { team_matching?: Allocation[]; project_id?: string };
  const [teamMatching, setTeamMatching] = useState<Allocation[] | null>(initialTeamMatching || null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!initialTeamMatching && project_id ? true : false);

  // Fetch team matching if not provided in location.state
  useEffect(() => {
    if (!teamMatching && project_id) {
      const fetchTeamMatching = async () => {
        setIsLoading(true);
        try {
          // Send project_id as a query parameter in the URL
          const response = await fetch(`http://127.0.0.1:8000/api/team-matcher/?project_id=${encodeURIComponent(project_id)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            // Remove the body since project_id is now in the URL
            // body: JSON.stringify({ project_id }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch team matching');
          }
          console.log('Fetched Team Matching Data:', data); // Debugging log
          setTeamMatching(data.allocations);
          setSuccess('Team matching fetched successfully!');
        } catch (err: any) {
          setError(err.message || 'Failed to fetch team matching');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTeamMatching();
    }
  }, [teamMatching, project_id]);

  const handleEdit = (index: number) => {
    setEditingSection(`allocations-${index}`);
  };

  const handleSaveEdit = (index: number, field: string, value: string) => {
    if (!teamMatching) return;
    const updatedAllocations = [...teamMatching];
    updatedAllocations[index][field as keyof Allocation] = value;
    setTeamMatching(updatedAllocations);
    setEditingSection(null);
  };

  const handleAddItem = () => {
    if (!teamMatching) return;
    setTeamMatching([
      ...teamMatching,
      { story_title: '', assigned_to: '', reason: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (!teamMatching) return;
    const updatedAllocations = teamMatching.filter((_, i) => i !== index);
    setTeamMatching(updatedAllocations);
  };

  const handleSaveTeamMatching = async () => {
    if (!teamMatching || !project_id) {
      setError('No team matching or project ID available to save');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/save-team-matching/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project_id, allocations: teamMatching }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save team matching');
      }
      setSuccess('Team matching saved successfully!');
      setTimeout(() => navigate('/manager/home'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save team matching');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading team matching...</div>;
  }

  if (!teamMatching) {
    return <div className="text-center py-8">No team matching data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar />
      <div className="flex-1 ml-64">
        <ManagerTitleBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Matching Allocations</h1>

          {success && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Allocations */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Allocations</h2>
              <button onClick={handleAddItem} className="text-blue-600 hover:text-blue-800">
                Add Allocation
              </button>
            </div>
            <ul className="space-y-4">
              {teamMatching.map((allocation, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `allocations-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={allocation.story_title}
                        onChange={(e) => handleSaveEdit(index, 'story_title', e.target.value)}
                        placeholder="Story Title"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={allocation.assigned_to}
                        onChange={(e) => handleSaveEdit(index, 'assigned_to', e.target.value)}
                        placeholder="Assigned To"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        value={allocation.reason}
                        onChange={(e) => handleSaveEdit(index, 'reason', e.target.value)}
                        placeholder="Reason"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{allocation.story_title}</h3>
                      <p className="text-gray-600">Assigned To: {allocation.assigned_to}</p>
                      <p className="text-gray-600">Reason: {allocation.reason}</p>
                      <button onClick={() => handleEdit(index)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <button
            onClick={handleSaveTeamMatching}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Team Matching'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMatchingDisplay;