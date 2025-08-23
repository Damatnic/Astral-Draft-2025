import React from 'react';
import ErrorBoundary from '../components/ui/ErrorBoundary';

interface ProjectIntegrityViewProps {
  // No props currently needed, but interface ready for future expansion
}

const ProjectIntegrityView: React.FC<ProjectIntegrityViewProps> = () => {
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="flex-shrink-0 mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
          Project Integrity
        </h1>
        <p className="text-sm text-[var(--text-secondary)] tracking-widest mt-2">
          Oracle Project Status & Integrity Monitoring
        </p>
      </header>

      <main className="flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Oracle Engine</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Data Pipeline</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Model Training</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                  In Progress
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              Integrity Metrics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Data Quality Score</span>
                <span className="text-[var(--text-primary)] font-mono">98.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Model Accuracy</span>
                <span className="text-[var(--text-primary)] font-mono">94.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Prediction Confidence</span>
                <span className="text-[var(--text-primary)] font-mono">89.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[var(--surface-secondary)] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Model retrained with latest data</span>
              <span>2 hours ago</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Data validation completed</span>
              <span>4 hours ago</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>System backup completed</span>
              <span>6 hours ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProjectIntegrityViewWithErrorBoundary: React.FC<ProjectIntegrityViewProps> = (props) => (
    <ErrorBoundary>
        <ProjectIntegrityView {...props} />
    </ErrorBoundary>
);

export default ProjectIntegrityViewWithErrorBoundary;
