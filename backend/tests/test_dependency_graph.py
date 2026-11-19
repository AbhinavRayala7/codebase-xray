import pytest
from pathlib import Path
from app.analyzer.parsers.base import ParsedFileResult, ImportInfo
from app.analyzer.dependency_graph import DependencyEngine


def test_dependency_resolution_and_cycles():
    # Construct 3 files where file_a -> file_b -> file_c -> file_a (circular dependency)
    file_a = ParsedFileResult(
        relative_path="src/a.ts",
        file_name="a.ts",
        extension=".ts",
        language="TypeScript",
        line_count=20,
        file_size=300,
        imports=[ImportInfo(source="./b", imported_symbols=["bFunc"])]
    )
    file_b = ParsedFileResult(
        relative_path="src/b.ts",
        file_name="b.ts",
        extension=".ts",
        language="TypeScript",
        line_count=20,
        file_size=300,
        imports=[ImportInfo(source="./c", imported_symbols=["cFunc"])]
    )
    file_c = ParsedFileResult(
        relative_path="src/c.ts",
        file_name="c.ts",
        extension=".ts",
        language="TypeScript",
        line_count=20,
        file_size=300,
        imports=[ImportInfo(source="./a", imported_symbols=["aFunc"])]
    )

    engine = DependencyEngine([file_a, file_b, file_c])
    cycles = engine.get_circular_dependencies()

    assert len(cycles) == 1
    cycle_nodes = set(cycles[0])
    assert "src/a.ts" in cycle_nodes
    assert "src/b.ts" in cycle_nodes
    assert "src/c.ts" in cycle_nodes


def test_change_impact_blast_radius():
    # file_root -> file_mid -> file_leaf
    file_root = ParsedFileResult(
        relative_path="src/root.ts",
        file_name="root.ts",
        extension=".ts",
        language="TypeScript",
        line_count=15,
        file_size=200,
        imports=[ImportInfo(source="./mid", imported_symbols=["midFunc"])]
    )
    file_mid = ParsedFileResult(
        relative_path="src/mid.ts",
        file_name="mid.ts",
        extension=".ts",
        language="TypeScript",
        line_count=15,
        file_size=200,
        imports=[ImportInfo(source="./leaf", imported_symbols=["leafFunc"])]
    )
    file_leaf = ParsedFileResult(
        relative_path="src/leaf.ts",
        file_name="leaf.ts",
        extension=".ts",
        language="TypeScript",
        line_count=15,
        file_size=200,
        imports=[]
    )

    engine = DependencyEngine([file_root, file_mid, file_leaf])
    # When leaf changes, mid is direct impact, root is indirect impact
    impact = engine.analyze_change_impact("src/leaf.ts")

    direct_paths = [d["file_path"] for d in impact["direct_impact"]]
    indirect_paths = [d["file_path"] for d in impact["indirect_impact"]]

    assert "src/mid.ts" in direct_paths
    assert "src/root.ts" in indirect_paths
    assert impact["risk_score"] > 0
