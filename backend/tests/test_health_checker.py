import pytest
from app.analyzer.parsers.base import ParsedFileResult, ImportInfo, FunctionInfo
from app.analyzer.dependency_graph import DependencyEngine
from app.analyzer.health_checker import HealthChecker


def test_health_checker_evaluations():
    # File with large length and high cyclomatic complexity
    f1 = ParsedFileResult(
        relative_path="src/monolith.ts",
        file_name="monolith.ts",
        extension=".ts",
        language="TypeScript",
        line_count=450,  # Large file (>300 lines)
        file_size=5000,
        functions=[
            FunctionInfo(name="complexLogic", line_start=10, line_end=90, complexity=14)
        ],
        imports=[
            ImportInfo(source="react", imported_symbols=["useState"]),
            ImportInfo(source="react", imported_symbols=["useEffect"])  # Duplicate import source
        ]
    )

    dep_engine = DependencyEngine([f1])
    checker = HealthChecker([f1], dep_engine)
    report = checker.run_checks()

    categories = [iss["category"] for iss in report.issues]
    assert "large_file" in categories
    assert "high_complexity" in categories
    assert "duplicate_import" in categories
    assert report.health_score < 100
