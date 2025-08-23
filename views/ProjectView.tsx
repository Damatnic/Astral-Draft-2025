import React from 'react';
import ErrorBoundary from '../components/ui/ErrorBoundary';

interface ProjectViewProps {
  // No props currently needed, but interface ready for future expansion
}

const ProjectView: React.FC<ProjectViewProps> = () => {
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="flex-shrink-0 mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
          Oracle Project
        </h1>
        <p className="text-sm text-[var(--text-secondary)] tracking-widest mt-2">
          Project Overview & Development Status
        </p>
      </header>

      <main className="flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                Project Overview
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Astral Draft Oracle is an advanced fantasy football prediction system that combines 
                machine learning, real-time data analysis, and sophisticated algorithms to provide 
                accurate player performance predictions.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-secondary)]">Version:</span>
                  <span className="ml-2 text-[var(--text-primary)] font-mono">v2.1.0</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Last Updated:</span>
                  <span className="ml-2 text-[var(--text-primary)]">Today</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Predictions Made:</span>
                  <span className="ml-2 text-[var(--text-primary)] font-mono">127,845</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Accuracy Rate:</span>
                  <span className="ml-2 text-[var(--text-primary)] font-mono">94.2%</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                Core Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">Prediction Engine</h3>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• Machine Learning Models</li>
                    <li>• Real-time Data Processing</li>
                    <li>• Ensemble Predictions</li>
                    <li>• Confidence Scoring</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">Analytics</h3>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• Performance Tracking</li>
                    <li>• Trend Analysis</li>
                    <li>• Historical Comparisons</li>
                    <li>• Pattern Recognition</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                Development Status
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">Core Engine</span>
                    <span className="text-[var(--text-primary)]">100%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">ML Models</span>
                    <span className="text-[var(--text-primary)]">95%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">UI/UX</span>
                    <span className="text-[var(--text-primary)]">90%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-secondary)]">Testing</span>
                    <span className="text-[var(--text-primary)]">85%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-sm">
                  View Analytics
                </button>
                <button className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 text-sm">
                  Check Status
                </button>
                <button className="w-full px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 text-sm">
                  Run Diagnostics
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProjectViewWithErrorBoundary: React.FC<ProjectViewProps> = (props) => (
    <ErrorBoundary>
        <ProjectView {...props} />
    </ErrorBoundary>
);

export default ProjectViewWithErrorBoundary;
