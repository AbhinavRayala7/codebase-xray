import {
  Project,
  AnalysisJob,
  GlobalStats,
  ArchitectureData,
  DependenciesOverview,
  FileDependencyDetails,
  TraceResult,
  ChangeImpactResult,
  HealthReportData,
  AIInvestigationItem,
  FileTreeNode,
  FileDetails
} from '../types';

const API_BASE = '/api';

export const api = {
  // Global & Projects
  async getGlobalStats(): Promise<GlobalStats> {
    const res = await fetch(`${API_BASE}/projects/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(projectId: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async getProjectJob(projectId: string): Promise<AnalysisJob> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/job`);
    if (!res.ok) throw new Error('Failed to fetch analysis job');
    return res.json();
  },

  async uploadZip(file: File, name?: string): Promise<{ project_id: string; status: string; name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await fetch(`${API_BASE}/projects/upload-zip`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async analyzeGitHub(url: string, name?: string): Promise<{ project_id: string; status: string; name: string }> {
    const res = await fetch(`${API_BASE}/projects/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'GitHub analysis failed' }));
      throw new Error(err.detail || 'GitHub analysis failed');
    }
    return res.json();
  },

  async analyzeSample(): Promise<{ project_id: string; status: string; name: string }> {
    const res = await fetch(`${API_BASE}/projects/sample`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start sample project analysis');
    return res.json();
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  // Architecture & Dependencies
  async getArchitecture(projectId: string): Promise<ArchitectureData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/architecture`);
    if (!res.ok) throw new Error('Failed to fetch architecture data');
    return res.json();
  },

  async getDependenciesOverview(projectId: string): Promise<DependenciesOverview> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/dependencies`);
    if (!res.ok) throw new Error('Failed to fetch dependencies overview');
    return res.json();
  },

  async getFileDependencies(projectId: string, filePath: string): Promise<FileDependencyDetails> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/dependencies/${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('Failed to fetch file dependencies');
    return res.json();
  },

  // Change Impact Analysis
  async getChangeImpact(projectId: string, filePath: string): Promise<ChangeImpactResult> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/impact?file_path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('Failed to fetch change impact');
    return res.json();
  },

  // Health
  async getHealthReport(projectId: string): Promise<HealthReportData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/health`);
    if (!res.ok) throw new Error('Failed to fetch health report');
    return res.json();
  },

  // Execution Tracer
  async getSuggestedFlows(projectId: string): Promise<{ flows: Array<{ id: string; title: string; description: string }> }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/trace/flows`);
    if (!res.ok) throw new Error('Failed to fetch suggested flows');
    return res.json();
  },

  async traceExecution(projectId: string, query: string): Promise<TraceResult> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/trace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to trace execution');
    return res.json();
  },

  // AI Investigator
  async investigate(projectId: string, query: string): Promise<AIInvestigationItem> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to investigate query');
    return res.json();
  },

  async getInvestigationHistory(projectId: string): Promise<AIInvestigationItem[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/investigate/history`);
    if (!res.ok) throw new Error('Failed to fetch investigation history');
    return res.json();
  },

  // File Explorer & Content
  async getFilesTree(projectId: string): Promise<{ tree: FileTreeNode[]; total_files: number }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files`);
    if (!res.ok) throw new Error('Failed to fetch files tree');
    return res.json();
  },

  async getFileDetails(projectId: string, filePath: string): Promise<FileDetails> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/details/${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('Failed to fetch file details');
    return res.json();
  },

  async getFileContent(projectId: string, filePath: string): Promise<{ content: string; file_path: string }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/files/content/${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('Failed to fetch file content');
    return res.json();
  },
};
