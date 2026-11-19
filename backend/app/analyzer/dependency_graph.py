import os
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any, Optional
import networkx as nx
from app.analyzer.parsers.base import ParsedFileResult


def normalize_path(p: str) -> str:
    return p.replace("\\", "/").strip("/")


class DependencyEngine:
    def __init__(self, files: List[ParsedFileResult]):
        self.files = files
        self.file_map: Dict[str, ParsedFileResult] = {
            normalize_path(f.relative_path): f for f in files
        }
        self.graph = nx.DiGraph()
        self.external_packages: Set[str] = set()
        self._build_graph()

    def _resolve_target(self, source_path: str, import_source: str) -> Optional[str]:
        """Resolves an imported module string to a known project file path."""
        norm_source = normalize_path(source_path)
        source_dir = str(Path(norm_source).parent).replace("\\", "/")
        if source_dir == ".":
            source_dir = ""

        # Relative import (e.g. ./utils, ../components/Nav)
        if import_source.startswith("."):
            base = Path(source_dir) / import_source
            candidate = normalize_path(str(base.resolve() if hasattr(base, "resolve") else base))
            # Clean candidate relative to root
            parts = []
            for p in (source_dir + "/" + import_source).split("/"):
                if p == ".." and parts:
                    parts.pop()
                elif p != "." and p != "":
                    parts.append(p)
            clean_candidate = "/".join(parts)

            # Try candidate with common extensions
            candidates = [
                clean_candidate,
                clean_candidate + ".ts",
                clean_candidate + ".tsx",
                clean_candidate + ".js",
                clean_candidate + ".jsx",
                clean_candidate + ".py",
                clean_candidate + "/index.ts",
                clean_candidate + "/index.tsx",
                clean_candidate + "/index.js",
                clean_candidate + "/index.jsx",
                clean_candidate + "/__init__.py",
            ]
            for cand in candidates:
                norm_c = normalize_path(cand)
                if norm_c in self.file_map:
                    return norm_c

        # Alias or root-relative (e.g. "@/components/Button" or "src/utils")
        clean_alias = import_source.replace("@/", "src/").strip("/")
        alias_candidates = [
            clean_alias,
            clean_alias + ".ts",
            clean_alias + ".tsx",
            clean_alias + ".js",
            clean_alias + ".jsx",
            clean_alias + ".py",
            clean_alias + "/index.ts",
            clean_alias + "/index.tsx",
            "src/" + clean_alias,
            "src/" + clean_alias + ".ts",
            "src/" + clean_alias + ".tsx",
        ]
        for cand in alias_candidates:
            norm_c = normalize_path(cand)
            if norm_c in self.file_map:
                return norm_c

        # Python package style (e.g., "app.models.database" or "backend.app...")
        py_path = import_source.replace(".", "/")
        py_candidates = [
            py_path + ".py",
            py_path + "/__init__.py",
            "backend/" + py_path + ".py",
            "src/" + py_path + ".py",
        ]
        for cand in py_candidates:
            norm_c = normalize_path(cand)
            if norm_c in self.file_map:
                return norm_c

        # Match by basename if uniquely identifiable
        base_name = import_source.split("/")[-1]
        matching = [
            p for p in self.file_map.keys()
            if Path(p).stem == base_name or Path(p).name == base_name
        ]
        if len(matching) == 1:
            return matching[0]

        return None

    def _build_graph(self):
        # Add all project files as nodes
        for f in self.files:
            norm = normalize_path(f.relative_path)
            self.graph.add_node(
                norm,
                file_name=f.file_name,
                extension=f.extension,
                language=f.language,
                line_count=f.line_count,
                role=f.role,
                is_entry_point=f.is_entry_point,
                is_config=f.is_config,
                is_test=f.is_test,
                functions_count=len(f.functions),
                classes_count=len(f.classes),
            )

        # Add directed edges: source -> target
        for f in self.files:
            norm_src = normalize_path(f.relative_path)
            for imp in f.imports:
                if imp.is_external:
                    self.external_packages.add(imp.source)
                    continue

                target = self._resolve_target(f.relative_path, imp.source)
                if target and target != norm_src:
                    self.graph.add_edge(norm_src, target, symbols=imp.imported_symbols)
                elif imp.is_external:
                    self.external_packages.add(imp.source)

    def get_circular_dependencies(self) -> List[List[str]]:
        """Detect circular dependency cycles in the codebase."""
        cycles = []
        try:
            raw_cycles = list(nx.simple_cycles(self.graph))
            # Sort cycles by length
            for cycle in raw_cycles:
                if len(cycle) > 1:
                    cycles.append(cycle)
        except Exception:
            pass
        return cycles

    def get_hub_modules(self, top_n: int = 5) -> List[Dict[str, Any]]:
        """Find modules with highest incoming dependents (high risk/impact) or outgoing imports."""
        in_degrees = dict(self.graph.in_degree())
        out_degrees = dict(self.graph.out_degree())
        
        hubs = []
        for node in self.graph.nodes():
            in_deg = in_degrees.get(node, 0)
            out_deg = out_degrees.get(node, 0)
            total = in_deg + out_deg
            if total > 0:
                hubs.append({
                    "file_path": node,
                    "dependents_count": in_deg,
                    "dependencies_count": out_deg,
                    "total_connections": total,
                    "role": self.graph.nodes[node].get("role", "module")
                })
        
        hubs.sort(key=lambda x: x["total_connections"], reverse=True)
        return hubs[:top_n]

    def get_architectural_bottlenecks(self, top_n: int = 5) -> List[Dict[str, Any]]:
        """Detect bottleneck files with high betweenness centrality."""
        if len(self.graph) == 0:
            return []
        try:
            centrality = nx.betweenness_centrality(self.graph)
            sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
            results = []
            for node, score in sorted_nodes[:top_n]:
                if score > 0.01:
                    results.append({
                        "file_path": node,
                        "centrality_score": round(score, 4),
                        "role": self.graph.nodes[node].get("role", "module"),
                        "dependents_count": self.graph.in_degree(node)
                    })
            return results
        except Exception:
            return []

    def get_file_dependencies(self, file_path: str) -> Dict[str, Any]:
        """Returns direct imports, direct dependents, and circular status for a file."""
        norm = normalize_path(file_path)
        if norm not in self.graph:
            return {"file_path": file_path, "imports": [], "dependents": [], "cycles": []}

        # Imports = successors (outgoing edges)
        imports = []
        for succ in self.graph.successors(norm):
            edge_data = self.graph.get_edge_data(norm, succ) or {}
            imports.append({
                "file_path": succ,
                "role": self.graph.nodes[succ].get("role", "module"),
                "symbols": edge_data.get("symbols", [])
            })

        # Dependents = predecessors (incoming edges)
        dependents = []
        for pred in self.graph.predecessors(norm):
            edge_data = self.graph.get_edge_data(pred, norm) or {}
            dependents.append({
                "file_path": pred,
                "role": self.graph.nodes[pred].get("role", "module"),
                "symbols": edge_data.get("symbols", [])
            })

        # Check if this file is involved in any cycle
        all_cycles = self.get_circular_dependencies()
        involved_cycles = [c for c in all_cycles if norm in c]

        return {
            "file_path": norm,
            "imports": imports,
            "dependents": dependents,
            "imports_count": len(imports),
            "dependents_count": len(dependents),
            "cycles": involved_cycles
        }

    def analyze_change_impact(self, file_path: str) -> Dict[str, Any]:
        """Section 9: Change Impact Analysis (Direct, Indirect, Potential impact)."""
        norm = normalize_path(file_path)
        if norm not in self.graph:
            return {
                "target_file": file_path,
                "direct_impact": [],
                "indirect_impact": [],
                "potential_impact": [],
                "affected_routes": [],
                "affected_tests": [],
                "risk_score": 0
            }

        # In-degree predecessors = files depending on this file
        direct_dependents = list(self.graph.predecessors(norm))

        # Indirect = dependents of direct dependents (2 hops)
        indirect_dependents = set()
        for d in direct_dependents:
            for ind in self.graph.predecessors(d):
                if ind != norm and ind not in direct_dependents:
                    indirect_dependents.add(ind)

        # Potential = 3+ hops reachable in reverse graph
        reverse_graph = self.graph.reverse()
        all_reachable = set(nx.descendants(reverse_graph, norm))
        potential_dependents = all_reachable - set(direct_dependents) - indirect_dependents

        # Extract affected API routes and tests
        affected_routes = []
        affected_tests = []
        for affected in all_reachable | {norm}:
            node_role = self.graph.nodes[affected].get("role", "")
            if node_role == "api_route" or "route" in affected or "api" in affected:
                affected_routes.append(affected)
            if node_role == "test" or "test" in affected:
                affected_tests.append(affected)

        # Blast radius score (0-100) based on reachability and graph proportion
        total_files = max(len(self.graph), 1)
        impact_count = len(direct_dependents) * 3 + len(indirect_dependents) * 2 + len(potential_dependents)
        risk_score = min(100, int((impact_count / total_files) * 35) + len(direct_dependents) * 5)

        return {
            "target_file": norm,
            "direct_impact": [
                {"file_path": f, "role": self.graph.nodes[f].get("role", "module")}
                for f in direct_dependents
            ],
            "indirect_impact": [
                {"file_path": f, "role": self.graph.nodes[f].get("role", "module")}
                for f in indirect_dependents
            ],
            "potential_impact": [
                {"file_path": f, "role": self.graph.nodes[f].get("role", "module")}
                for f in potential_dependents
            ],
            "affected_routes": list(set(affected_routes)),
            "affected_tests": list(set(affected_tests)),
            "risk_score": risk_score,
            "total_affected_count": len(all_reachable)
        }

    def to_react_flow(self) -> Dict[str, Any]:
        """Convert repository graph into React Flow compatible nodes and edges."""
        nodes = []
        edges = []

        # Color/badge styling by role
        role_colors = {
            "entry": "#8b5cf6",       # Violet
            "component": "#38bdf8",   # Sky blue
            "api_route": "#10b981",   # Emerald
            "service": "#f59e0b",     # Amber
            "controller": "#f97316",  # Orange
            "model": "#ec4899",       # Pink
            "utility": "#64748b",     # Slate
            "config": "#a855f7",      # Purple
            "test": "#06b6d4",        # Cyan
            "module": "#94a3b8"       # Default gray
        }

        # Arrange nodes in a neat layered/grid layout
        cols = 4
        spacing_x = 320
        spacing_y = 140

        # Group by role for intelligent layout
        roles_order = ["entry", "api_route", "controller", "service", "model", "component", "utility", "config", "test", "module"]
        nodes_by_role: Dict[str, List[str]] = {r: [] for r in roles_order}
        for n in self.graph.nodes():
            role = self.graph.nodes[n].get("role", "module")
            if role not in nodes_by_role:
                nodes_by_role["module"].append(n)
            else:
                nodes_by_role[role].append(n)

        current_y = 50
        node_positions = {}
        for role, file_list in nodes_by_role.items():
            if not file_list:
                continue
            for i, node_id in enumerate(file_list):
                col = i % cols
                row_offset = (i // cols) * spacing_y
                pos_x = 50 + col * spacing_x
                pos_y = current_y + row_offset
                node_positions[node_id] = {"x": pos_x, "y": pos_y}
            current_y += ((len(file_list) - 1) // cols + 1) * spacing_y + 60

        cycles = self.get_circular_dependencies()
        cycle_nodes = {node for cycle in cycles for node in cycle}

        for node_id, data in self.graph.nodes(data=True):
            role = data.get("role", "module")
            pos = node_positions.get(node_id, {"x": 50, "y": 50})
            file_obj = self.file_map.get(node_id)
            
            nodes.append({
                "id": node_id,
                "type": "codeNode",
                "position": pos,
                "data": {
                    "label": data.get("file_name", node_id),
                    "filePath": node_id,
                    "role": role,
                    "language": data.get("language", "Unknown"),
                    "lineCount": data.get("line_count", 0),
                    "color": role_colors.get(role, "#94a3b8"),
                    "inDegree": self.graph.in_degree(node_id),
                    "outDegree": self.graph.out_degree(node_id),
                    "isCircular": node_id in cycle_nodes,
                    "functions": [f.name for f in (file_obj.functions if file_obj else [])],
                    "classes": [c.name for c in (file_obj.classes if file_obj else [])],
                    "exports": [e.name for e in (file_obj.exports if file_obj else [])],
                }
            })

        for u, v, data in self.graph.edges(data=True):
            is_cycle_edge = any(u in cycle and v in cycle for cycle in cycles)
            edges.append({
                "id": f"e-{u}->{v}",
                "source": u,
                "target": v,
                "animated": is_cycle_edge,
                "style": {
                    "stroke": "#ef4444" if is_cycle_edge else "#475569",
                    "strokeWidth": 2 if is_cycle_edge else 1.5,
                },
                "data": {
                    "symbols": data.get("symbols", []),
                    "isCircular": is_cycle_edge
                }
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "cycles_count": len(cycles),
                "external_packages_count": len(self.external_packages)
            }
        }
