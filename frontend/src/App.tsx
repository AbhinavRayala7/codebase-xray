import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ProjectsListTab } from './components/dashboard/ProjectsListTab';
import { AnalyzeModal } from './components/dashboard/AnalyzeModal';
import { AnalysisProgressBar } from './components/dashboard/AnalysisProgressBar';
import { ArchitectureExplorer } from './components/architecture/ArchitectureExplorer';
import { DependencyDetective } from './components/dependencies/DependencyDetective';
import { ExecutionTracer } from './components/tracer/ExecutionTracer';
import { AIInvestigator } from './components/investigator/AIInvestigator';
import { ProjectHealth } from './components/health/ProjectHealth';
import { FileExplorer } from './components/files/FileExplorer';
import { SettingsTab } from './components/settings/SettingsTab';

import { api } from './api/client';
import { Project, GlobalStats } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<GlobalStats>({ total_projects: 0, total_files: 0, total_issues: 0 });
  const [analyzingProjectId, setAnalyzingProjectId] = useState<string | null>(null);
  const [targetFileToInspect, setTargetFileToInspect] = useState<string | null>(null);

  useEffect(() => {
    loadProjectsAndStats();
  }, []);

  const loadProjectsAndStats = async () => {
    try {
      const [projs, globalStats] = await Promise.all([
        api.getProjects(),
        api.getGlobalStats()
      ]);
      setProjects(projs);
      setStats(globalStats);
      if (projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setCurrentView('app');
    setActiveTab('overview');
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
      loadProjectsAndStats();
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleAnalysisStarted = (projectId: string) => {
    setAnalyzingProjectId(projectId);
    setCurrentView('app');
    setActiveTab('overview');
    loadProjectsAndStats();
  };

  const handleAnalysisComplete = async () => {
    setAnalyzingProjectId(null);
    await loadProjectsAndStats();
    // Re-fetch project to set as active
    try {
      const projs = await api.getProjects();
      if (projs.length > 0) {
        setActiveProject(projs[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToFile = (filePath: string) => {
    setTargetFileToInspect(filePath);
    setCurrentView('app');
    setActiveTab('files');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080b12] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Navbar */}
      <Navbar
        currentProject={activeProject}
        onOpenAnalyzeModal={() => setIsAnalyzeModalOpen(true)}
        onNavigateHome={() => setCurrentView('landing')}
        activeTab={activeTab}
      />

      {/* Main View Router */}
      {currentView === 'landing' ? (
        <main className="flex-1">
          <LandingPage
            onStartAnalysis={() => setIsAnalyzeModalOpen(true)}
            onExploreFeatures={() => {
              setCurrentView('app');
              setActiveTab('overview');
            }}
            onTrySample={async () => {
              try {
                const res = await api.analyzeSample();
                handleAnalysisStarted(res.project_id);
              } catch (err) {
                console.error(err);
                setIsAnalyzeModalOpen(true);
              }
            }}
          />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            hasActiveProject={Boolean(activeProject)}
            healthScore={activeProject?.health_score}
          />

          {/* Main Dashboard Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
            
            {/* Live Analysis Progress Bar */}
            {analyzingProjectId && (
              <div className="mb-6">
                <AnalysisProgressBar
                  projectId={analyzingProjectId}
                  onComplete={handleAnalysisComplete}
                />
              </div>
            )}

            {/* TAB CONTENTS */}
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                recentProjects={projects}
                activeProject={activeProject}
                onSelectProject={handleSelectProject}
                onOpenAnalyzeModal={() => setIsAnalyzeModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsListTab
                projects={projects}
                activeProject={activeProject}
                onSelectProject={handleSelectProject}
                onDeleteProject={handleDeleteProject}
                onOpenAnalyzeModal={() => setIsAnalyzeModalOpen(true)}
              />
            )}

            {activeTab === 'architecture' && activeProject && (
              <ArchitectureExplorer
                projectId={activeProject.id}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {activeTab === 'dependencies' && activeProject && (
              <DependencyDetective
                projectId={activeProject.id}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {activeTab === 'tracer' && activeProject && (
              <ExecutionTracer
                projectId={activeProject.id}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {activeTab === 'investigator' && activeProject && (
              <AIInvestigator
                projectId={activeProject.id}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {activeTab === 'health' && activeProject && (
              <ProjectHealth
                projectId={activeProject.id}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {activeTab === 'files' && activeProject && (
              <FileExplorer
                projectId={activeProject.id}
                initialFilePath={targetFileToInspect}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab />
            )}

          </main>
        </div>
      )}

      {/* Footer Branding strictly adhering to Section 16 */}
      <Footer />

      {/* Global Ingestion Modal */}
      <AnalyzeModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onAnalysisStarted={handleAnalysisStarted}
      />

    </div>
  );
};

export default App;
