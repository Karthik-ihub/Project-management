import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar';
import ManagerTitleBar from '../components/ManagerTitleBar';
import { Edit2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Feature {
  name: string;
  description: string;
}

interface Persona {
  role: string;
  needs: string;
}

interface Risk {
  risk: string;
  mitigation: string;
}

interface Analysis {
  domain: string;
  features: Feature[];
  personas: Persona[];
  modules: string[];
  risks: Risk[];
}

const ManagerAnalysis: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis: initialAnalysis, project_id } = location.state as { analysis: Analysis; project_id: string };
  const [analysis, setAnalysis] = useState<Analysis>(initialAnalysis);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleEdit = (section: string) => {
    setEditingSection(section);
  };

  const handleSaveEdit = (section: string, index: number, field: string, value: string) => {
    if (section === 'features') {
      const updatedFeatures = [...analysis.features];
      updatedFeatures[index][field as keyof Feature] = value;
      setAnalysis({ ...analysis, features: updatedFeatures });
    } else if (section === 'personas') {
      const updatedPersonas = [...analysis.personas];
      updatedPersonas[index][field as keyof Persona] = value;
      setAnalysis({ ...analysis, personas: updatedPersonas });
    } else if (section === 'modules') {
      const updatedModules = [...analysis.modules];
      updatedModules[index] = value;
      setAnalysis({ ...analysis, modules: updatedModules });
    } else if (section === 'risks') {
      const updatedRisks = [...analysis.risks];
      updatedRisks[index][field as keyof Risk] = value;
      setAnalysis({ ...analysis, risks: updatedRisks });
    } else if (section === 'domain') {
      setAnalysis({ ...analysis, domain: value });
    }
    setEditingSection(null);
  };

  const handleAddItem = (section: string) => {
    if (section === 'features') {
      setAnalysis({ ...analysis, features: [...analysis.features, { name: '', description: '' }] });
    } else if (section === 'personas') {
      setAnalysis({ ...analysis, personas: [...analysis.personas, { role: '', needs: '' }] });
    } else if (section === 'modules') {
      setAnalysis({ ...analysis, modules: [...analysis.modules, ''] });
    } else if (section === 'risks') {
      setAnalysis({ ...analysis, risks: [...analysis.risks, { risk: '', mitigation: '' }] });
    }
  };

  const handleRemoveItem = (section: string, index: number) => {
    if (section === 'features') {
      const updatedFeatures = analysis.features.filter((_, i) => i !== index);
      setAnalysis({ ...analysis, features: updatedFeatures });
    } else if (section === 'personas') {
      const updatedPersonas = analysis.personas.filter((_, i) => i !== index);
      setAnalysis({ ...analysis, personas: updatedPersonas });
    } else if (section === 'modules') {
      const updatedModules = analysis.modules.filter((_, i) => i !== index);
      setAnalysis({ ...analysis, modules: updatedModules });
    } else if (section === 'risks') {
      const updatedRisks = analysis.risks.filter((_, i) => i !== index);
      setAnalysis({ ...analysis, risks: updatedRisks });
    }
  };

  const handleSaveAnalysis = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/save-analysis/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project_id, analysis }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save analysis');
      }
      setSuccess('Analysis saved successfully!');
      setTimeout(() => navigate('/manager/home'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save analysis');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialAnalysis) {
    return <div className="text-center py-8">No analysis data available. Please submit a new project idea.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerSidebar />
      <div className="flex-1 ml-64">
        <ManagerTitleBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Project Analysis</h1>

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

          {/* Domain */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Domain</h2>
              <button onClick={() => handleEdit('domain')} className="text-blue-600 hover:text-blue-800">
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
            {editingSection === 'domain' ? (
              <input
                type="text"
                value={analysis.domain}
                onChange={(e) => setAnalysis({ ...analysis, domain: e.target.value })}
                onBlur={() => setEditingSection(null)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <p className="text-gray-700">{analysis.domain}</p>
            )}
          </section>

          {/* Features */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Features</h2>
              <button onClick={() => handleAddItem('features')} className="text-blue-600 hover:text-blue-800">
                Add Feature
              </button>
            </div>
            <ul className="space-y-4">
              {analysis.features.map((feature, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `features-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={feature.name}
                        onChange={(e) => handleSaveEdit('features', index, 'name', e.target.value)}
                        placeholder="Feature Name"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        value={feature.description}
                        onChange={(e) => handleSaveEdit('features', index, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{feature.name}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                      <button onClick={() => handleEdit(`features-${index}`)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem('features', index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Personas */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Personas</h2>
              <button onClick={() => handleAddItem('personas')} className="text-blue-600 hover:text-blue-800">
                Add Persona
              </button>
            </div>
            <ul className="space-y-4">
              {analysis.personas.map((persona, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `personas-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={persona.role}
                        onChange={(e) => handleSaveEdit('personas', index, 'role', e.target.value)}
                        placeholder="Role"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        value={persona.needs}
                        onChange={(e) => handleSaveEdit('personas', index, 'needs', e.target.value)}
                        placeholder="Needs"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{persona.role}</h3>
                      <p className="text-gray-600">{persona.needs}</p>
                      <button onClick={() => handleEdit(`personas-${index}`)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem('personas', index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Modules */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
              <button onClick={() => handleAddItem('modules')} className="text-blue-600 hover:text-blue-800">
                Add Module
              </button>
            </div>
            <ul className="space-y-4">
              {analysis.modules.map((module, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md flex items-center justify-between">
                  {editingSection === `modules-${index}` ? (
                    <div className="flex-1">
                      <input
                        type="text"
                        value={module}
                        onChange={(e) => handleSaveEdit('modules', index, 'module', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-gray-700">{module}</p>
                      <div>
                        <button onClick={() => handleEdit(`modules-${index}`)} className="text-blue-600 hover:text-blue-800 mr-2">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveItem('modules', index)} className="text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Risks */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Risks</h2>
              <button onClick={() => handleAddItem('risks')} className="text-blue-600 hover:text-blue-800">
                Add Risk
              </button>
            </div>
            <ul className="space-y-4">
              {analysis.risks.map((risk, index) => (
                <li key={index} className="p-4 bg-white rounded-lg shadow-md">
                  {editingSection === `risks-${index}` ? (
                    <div>
                      <input
                        type="text"
                        value={risk.risk}
                        onChange={(e) => handleSaveEdit('risks', index, 'risk', e.target.value)}
                        placeholder="Risk"
                        className="w-full mb-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        value={risk.mitigation}
                        onChange={(e) => handleSaveEdit('risks', index, 'mitigation', e.target.value)}
                        placeholder="Mitigation"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => setEditingSection(null)} className="mt-2 text-green-600">
                        <Save className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900">{risk.risk}</h3>
                      <p className="text-gray-600">{risk.mitigation}</p>
                      <button onClick={() => handleEdit(`risks-${index}`)} className="text-blue-600 hover:text-blue-800 mr-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem('risks', index)} className="text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <button
            onClick={handleSaveAnalysis}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Analysis'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerAnalysis;