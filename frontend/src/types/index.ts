export interface Project {
  id: string;
  name: string;
  description?: string;
  source_type: 'github' | 'zip' | 'sample';
  repository_url?: string;
  total_files: number;
  total_lines: number;
  primary_language: string;
  languages: Record<string, number>;
  frameworks: string[];
  health_score: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  error_message?: string;
}

export interface AnalysisJob {
  id: string;
  stage: string;
  progress_percent: number;
  status: string;
  log_messages: string[];
  started_at: string;
  completed_at?: string;
}

export interface GlobalStats {
  total_projects: number;
  total_files: number;
  total_issues: number;
}

export interface ReactFlowNodeData {
  [key: string]: any;
  label: string;
  filePath: string;
  role: string;
  language: string;
  lineCount: number;
  color: string;
  inDegree: number;
  outDegree: number;
  isCircular: boolean;
  functions: string[];
  classes: string[];
  exports: string[];
}

export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: ReactFlowNodeData;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: {
    symbols: string[];
    isCircular: boolean;
  };
}

export interface ArchitectureData {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  summary: {
    total_nodes: number;
    total_edges: number;
    cycles_count: number;
    external_packages_count: number;
  };
}

export interface DependenciesOverview {
  circular_dependencies: string[][];
  hub_modules: Array<{
    file_path: string;
    dependents_count: number;
    dependencies_count: number;
    total_connections: number;
    role: string;
  }>;
  bottlenecks: Array<{
    file_path: string;
    centrality_score: number;
    role: string;
    dependents_count: number;
  }>;
  external_packages: string[];
}

export interface FileDependencyDetails {
  file_path: string;
  imports: Array<{ file_path: string; role: string; symbols: string[] }>;
  dependents: Array<{ file_path: string; role: string; symbols: string[] }>;
  imports_count: number;
  dependents_count: number;
  cycles: string[][];
}

export interface ExecutionStep {
  step_number: number;
  title: string;
  role: string;
  file_path: string;
  line_number?: number;
  description: string;
  is_static_proven: boolean;
  evidence_type: string;
  symbol_name?: string;
}

export interface TraceResult {
  query: string;
  steps: ExecutionStep[];
  total_steps: number;
  static_proven_steps: number;
  inferred_steps: number;
}

export interface ChangeImpactResult {
  target_file: string;
  direct_impact: Array<{ file_path: string; role: string }>;
  indirect_impact: Array<{ file_path: string; role: string }>;
  potential_impact: Array<{ file_path: string; role: string }>;
  affected_routes: string[];
  affected_tests: string[];
  risk_score: number;
  total_affected_count: number;
}

export interface CodeIssueItem {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file_path: string;
  line_number?: number;
  suggestion?: string;
  is_confirmed: boolean;
}

export interface HealthReportData {
  health_score: number;
  total_issues: number;
  severity_breakdown: { high: number; medium: number; low: number };
  category_breakdown: Record<string, number>;
  issues: CodeIssueItem[];
}

export interface AIInvestigationCitation {
  path: string;
  lines?: number[];
  reason: string;
}

export interface AIInvestigationItem {
  id?: string;
  query: string;
  response: string;
  cited_files: AIInvestigationCitation[];
  cited_symbols: string[];
  uncertainty_note?: string;
  created_at?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  is_directory: boolean;
  language?: string;
  role?: string;
  line_count?: number;
  is_entry_point?: boolean;
  children?: FileTreeNode[];
}

export interface FileDetails {
  id: string;
  relative_path: string;
  file_name: string;
  extension: string;
  language: string;
  line_count: number;
  file_size: number;
  role: string;
  is_entry_point: boolean;
  is_config: boolean;
  is_test: boolean;
  imports: any[];
  exports: any[];
  functions: any[];
  classes: any[];
}
