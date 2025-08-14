// Updated EpicsDisplay.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import ManagerTitleBar from '../components/ManagerTitleBar';
import { Edit2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Epic {
  name: string;
  description: string;
}

interface UserStory {
  title: string;
  gherkin: string;
}

interface EpicsStories {
  epics: Epic[];
  user_stories: UserStory[];
}

const EpicsDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { epics_stories: initialEpicsStories, project_id } = (location.state || {}) as { epics_stories?: EpicsStories; project_id?: string };
  const [epicsStories, setEpicsStories] = useState<EpicsStories | null>(initialEpicsStories || null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!initialEpicsStories && project_id ? true : false);

  // Fetch epics if not provided in location.state
  useEffect(() => {
    if (!epicsStories && project_id) {
      const fetchEpics = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('http://127.0.0.1:8000/api/epics/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ project_id }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch epics');
          }
          console.log('Fetched Epics Data:', data); // Debugging log
          setEpicsStories(data.epics_stories);
          setSuccess('Epics fetched successfully!');
        } catch (err: any) {
          setError(err.message || 'Failed to fetch epics');
        } finally {
          setIsLoading(false);
        }
      };
      fetchEpics();
    }
  }, [epicsStories, project_id]);

  const handleEdit = (section: string, index: number) => {
    setEditingSection(`${section}-${index}`);
  };

  const handleSaveEdit = (section: string, index: number, field: string, value: string) => {
    if (!epicsStories) return;
    if (section === 'epics') {
      const updatedEpics = [...epicsStories.epics];
      updatedEpics[index][field as keyof Epic] = value;
      setEpicsStories({ ...epicsStories, epics: updatedEpics });
    } else if (section === 'user_stories') {
      const updatedUserStories = [...epicsStories.user_stories];
      updatedUserStories[index][field as keyof UserStory] = value;
      setEpicsStories({ ...epicsStories, user_stories: updatedUserStories });
    }
    setEditingSection(null);
  };

  const handleAddItem = (section: string) => {
    if (!epicsStories) return;
    if (section === 'epics') {
      setEpicsStories({ ...epicsStories, epics: [...epicsStories.epics, { name: '', description: '' }] });
    } else if (section === 'user_stories') {
      setEpicsStories({ ...epicsStories, user_stories: [...epicsStories.user_stories, { title: '', gherkin: '' }] });
    }
  };

  const handleRemoveItem = (section: string, index: number) => {
    if (!epicsStories) return;
    if (section === 'epics') {
      const updatedEpics = epicsStories.epics.filter((_, i) => i !== index);
      setEpicsStories({ ...epicsStories, epics: updatedEpics });
    } else if (section === 'user_stories') {
      const updatedUserStories = epicsStories.user_stories.filter((_, i) => i !== index);
      setEpicsStories({ ...epicsStories, user_stories: updatedUserStories });
    }
  };

  const handleGoForTeamMatching = async () => {
    if (!epicsStories || !project_id) {
      setError('No epics or project ID available');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    // First, save the epics and features
    try {
      const saveResponse = await fetch('http://127.0.0.1:8000/api/save-epics-features/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project_id, epics_stories: epicsStories }),
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save epics and features');
      }
      setSuccess('Epics and features saved successfully! Generating team matching...');
    } catch (err: any) {
      setError(err.message || 'Failed to save epics and features');
      setIsLoading(false);
      return;
    }

    // Then, generate team matching if save was successful
    try {
      const teamMatcherResponse = await fetch('http://127.0.0.1:8000/api/team-matcher/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project_id }),
      });

      const teamMatcherData = await teamMatcherResponse.json();
      if (!teamMatcherResponse.ok) {
        throw new Error(teamMatcherData.error || 'Failed to generate team matching');
      }
      console.log('Team Matching Data:', teamMatcherData); // Debugging log
      setSuccess('Team matching generated successfully!');
      
      // Navigate to TeamMatchingDisplay with the response data
      setTimeout(() => navigate('/manager/team-matching', { state: { team_matching: teamMatcherData, project_id } }), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate team matching');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading epics and user stories...</div>;
  }

  if (!epicsStories) {
    return <div className="text-center py-8">No epics or user stories data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar />
      <div className="flex-1 ml-64">
        <ManagerTitleBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Epics and User Stories</h1>

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

          {/* Epics */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Epics</h2>
              <button onClick={() => handleAddItem('epics')} className="text-blue-600 hover:text-blue-800">
                Add Epic
              </button>
            </div>
            <ul className="space-y-4">
              {epicsStories.epics.map((epic, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `epics-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={epic.name}
                        onChange={(e) => handleSaveEdit('epics', index, 'name', e.target.value)}
                        placeholder="Epic Name"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        value={epic.description}
                        onChange={(e) => handleSaveEdit('epics', index, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{epic.name}</h3>
                      <p className="text-gray-600">{epic.description}</p>
                      <button onClick={() => handleEdit('epics', index)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem('epics', index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* User Stories */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">User Stories</h2>
              <button onClick={() => handleAddItem('user_stories')} className="text-blue-600 hover:text-blue-800">
                Add User Story
              </button>
            </div>
            <ul className="space-y-4">
              {epicsStories.user_stories.map((story, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `user_stories-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={story.title}
                        onChange={(e) => handleSaveEdit('user_stories', index, 'title', e.target.value)}
                        placeholder="Story Title"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        value={story.gherkin}
                        onChange={(e) => handleSaveEdit('user_stories', index, 'gherkin', e.target.value)}
                        placeholder="Gherkin"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{story.title}</h3>
                      <pre className="text-gray-600 whitespace-pre-wrap">{story.gherkin}</pre>
                      <button onClick={() => handleEdit('user_stories', index)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem('user_stories', index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <button
            onClick={handleGoForTeamMatching}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Go for Team Matching'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EpicsDisplay;