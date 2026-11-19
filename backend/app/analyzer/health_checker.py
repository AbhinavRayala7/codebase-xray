from typing import List, Dict, Any
from pathlib import Path
from app.analyzer.parsers.base import ParsedFileResult
from app.analyzer.dependency_graph import DependencyEngine


class HealthReport:
    def __init__(self):
        self.issues: List[Dict[str, Any]] = []
        self.health_score: int = 100
        self.category_breakdown: Dict[str, int] = {
            "circular_dependency": 0,
            "large_file": 0,
            "high_complexity": 0,
            "missing_test": 0,
            "high_coupling": 0,
            "dead_code": 0,
            "duplicate_import": 0
        }

    def add_issue(
        self,
        category: str,
        severity: str,
        title: str,
        description: str,
        file_path: str,
        line_number: int = None,
        suggestion: str = None,
        is_confirmed: bool = True
    ):
        self.issues.append({
            "category": category,
            "severity": severity,
            "title": title,
            "description": description,
            "file_path": file_path,
            "line_number": line_number,
            "suggestion": suggestion,
            "is_confirmed": is_confirmed
        })
        self.category_breakdown[category] = self.category_breakdown.get(category, 0) + 1


class HealthChecker:
    def __init__(self, files: List[ParsedFileResult], dep_engine: DependencyEngine):
        self.files = files
        self.dep_engine = dep_engine
        self.file_map = {f.relative_path.replace("\\", "/"): f for f in files}

    def run_checks(self) -> HealthReport:
        report = HealthReport()
        deduction = 0

        # 1. Circular Dependencies (Confirmed, High severity)
        cycles = self.dep_engine.get_circular_dependencies()
        for cycle in cycles:
            cycle_str = " -> ".join(cycle) + " -> " + cycle[0]
            report.add_issue(
                category="circular_dependency",
                severity="high",
                title=f"Circular Dependency Detected ({len(cycle)} files)",
                description=f"Cycle: {cycle_str}. Circular dependencies complicate module loading and tight coupling.",
                file_path=cycle[0],
                suggestion="Refactor shared types or functions into a separate intermediary utility module.",
                is_confirmed=True
            )
            deduction += 12

        # 2. Large Files (> 300 lines) (Confirmed, Medium/Low severity)
        for f in self.files:
            if f.line_count > 300:
                severity = "high" if f.line_count > 600 else "medium"
                report.add_issue(
                    category="large_file",
                    severity=severity,
                    title=f"Excessive File Length ({f.line_count} lines)",
                    description=f"File exceeds standard maintainability guidelines (300 lines).",
                    file_path=f.relative_path,
                    suggestion="Split sub-components, helper functions, or state hooks into separate focused files.",
                    is_confirmed=True
                )
                deduction += 4 if severity == "medium" else 8

        # 3. High Complexity Functions (Confirmed, Medium severity)
        for f in self.files:
            for fn in f.functions:
                if fn.complexity > 8:
                    report.add_issue(
                        category="high_complexity",
                        severity="medium",
                        title=f"High Cyclomatic Complexity: `{fn.name}` (Score: {fn.complexity})",
                        description=f"Function `{fn.name}` contains deeply nested branches or conditions (lines {fn.line_start}-{fn.line_end}).",
                        file_path=f.relative_path,
                        line_number=fn.line_start,
                        suggestion="Extract conditional branches into smaller specialized helper functions or guard clauses.",
                        is_confirmed=True
                    )
                    deduction += 3

        # 4. High Coupling / Architectural Bottlenecks (Confirmed, High/Medium severity)
        bottlenecks = self.dep_engine.get_architectural_bottlenecks()
        for b in bottlenecks:
            if b.get("dependents_count", 0) > 8:
                report.add_issue(
                    category="high_coupling",
                    severity="high",
                    title=f"Architectural Chokepoint: {b['file_path']}",
                    description=f"Module has {b['dependents_count']} dependent files and high betweenness centrality ({b['centrality_score']}).",
                    file_path=b["file_path"],
                    suggestion="Isolate module interfaces using dependency inversion or abstract contracts to minimize blast radius.",
                    is_confirmed=True
                )
                deduction += 5

        # 5. Duplicate Imports (Confirmed, Low severity)
        for f in self.files:
            seen_sources = set()
            for imp in f.imports:
                if imp.source in seen_sources:
                    report.add_issue(
                        category="duplicate_import",
                        severity="low",
                        title=f"Duplicate Import Statement: `{imp.source}`",
                        description=f"Module `{imp.source}` is imported multiple times in the same file.",
                        file_path=f.relative_path,
                        line_number=imp.line_number,
                        suggestion="Consolidate duplicate import statements into a single unified import clause.",
                        is_confirmed=True
                    )
                    deduction += 1
                else:
                    seen_sources.add(imp.source)

        # 6. Missing Tests (Heuristic, Low/Medium severity)
        test_files = [f.relative_path.lower() for f in self.files if f.is_test]
        has_any_tests = len(test_files) > 0
        for f in self.files:
            if f.role in {"service", "api_route"} and not f.is_test:
                base_stem = Path(f.relative_path).stem.lower()
                has_matching_test = any(base_stem in t for t in test_files)
                if not has_matching_test:
                    report.add_issue(
                        category="missing_test",
                        severity="medium" if has_any_tests else "low",
                        title=f"Uncovered Critical Module: {f.file_name}",
                        description=f"No matching automated unit/integration test detected for `{f.file_name}`.",
                        file_path=f.relative_path,
                        suggestion=f"Create a unit test file `{base_stem}.test.{f.extension.strip('.')}` with scenario verification.",
                        is_confirmed=False
                    )
                    deduction += 2

        # 7. Potential Dead Code Candidates (Heuristic, Low severity)
        for node in self.dep_engine.graph.nodes():
            in_deg = self.dep_engine.graph.in_degree(node)
            data = self.dep_engine.graph.nodes[node]
            if (
                in_deg == 0
                and not data.get("is_entry_point")
                and not data.get("is_config")
                and not data.get("is_test")
                and data.get("role") not in {"entry", "config", "test"}
                and not node.endswith("index.ts")
                and not node.endswith("index.js")
            ):
                report.add_issue(
                    category="dead_code",
                    severity="low",
                    title=f"Potential Orphan Module: {node}",
                    description=f"Zero incoming internal imports detected. If not dynamically invoked or an entry point, this may be unused.",
                    file_path=node,
                    suggestion="Verify if this module is required by runtime plugins or remove if obsolete.",
                    is_confirmed=False
                )
                deduction += 1

        # Calculate final Health Score (0 - 100)
        report.health_score = max(20, min(100, 100 - deduction))
        return report
