import re
from pathlib import Path
from typing import List, Set
from app.analyzer.parsers.base import (
    BaseParser, ParsedFileResult, ImportInfo, ExportInfo, FunctionInfo, ClassInfo, CallInfo
)

# Regular expressions for JS/TS analysis
RE_ESM_IMPORT = re.compile(
    r"""import\s+(?:(?:type\s+)?(?:([a-zA-Z0-9_$]+)\s*,?\s*)?(?:\{\s*([^}]+)\s*\}|\*\s+as\s+([a-zA-Z0-9_$]+))?)\s*from\s*['"]([^'"]+)['"]""",
    re.MULTILINE
)
RE_BARE_IMPORT = re.compile(r"""import\s+['"]([^'"]+)['"]""", re.MULTILINE)
RE_REQUIRE = re.compile(r"""(?:const|let|var)\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s*=\s*require\(['"]([^'"]+)['"]\)""", re.MULTILINE)
RE_DYNAMIC_IMPORT = re.compile(r"""import\(['"]([^'"]+)['"]\)""", re.MULTILINE)

RE_EXPORT_DEFAULT = re.compile(r"""export\s+default\s+(?:function\s*([a-zA-Z0-9_$]*)|class\s*([a-zA-Z0-9_$]*)|([a-zA-Z0-9_$]+))""", re.MULTILINE)
RE_EXPORT_NAMED = re.compile(r"""export\s+(?:const|let|var|function|class|interface|type)\s+([a-zA-Z0-9_$]+)""", re.MULTILINE)
RE_EXPORT_CLAUSE = re.compile(r"""export\s*\{\s*([^}]+)\s*\}""", re.MULTILINE)

RE_FUNCTION_DEF = re.compile(
    r"""(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)""",
    re.MULTILINE
)
RE_ARROW_FN = re.compile(
    r"""(?:const|let|var|export\s+const|export\s+let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s+)?(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*(?::\s*[^=]+)?\s*=>""",
    re.MULTILINE
)
RE_CLASS_DEF = re.compile(
    r"""class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?""",
    re.MULTILINE
)
RE_FETCH_CALL = re.compile(
    r"""(?:fetch|axios\.(?:get|post|put|delete|patch)|apiClient\.(?:get|post|put|delete|patch))\s*\(\s*['"`]([^'"`]+)['"`]""",
    re.MULTILINE
)
RE_ROUTE_DEF = re.compile(
    r"""(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]""",
    re.MULTILINE
)


class TsJsParser(BaseParser):
    def can_parse(self, extension: str) -> bool:
        return extension.lower() in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}

    def parse_file(self, file_path: Path, relative_path: str, content: str) -> ParsedFileResult:
        lines = content.splitlines()
        line_count = len(lines)
        file_size = len(content.encode("utf-8"))
        file_name = file_path.name
        ext = file_path.suffix.lower()
        norm_path = relative_path.replace("\\", "/").lower()

        # Language determination
        is_ts = ext in {".ts", ".tsx"}
        language = "TypeScript" if is_ts else "JavaScript"

        # Heuristics
        is_test = any(t in norm_path for t in [".test.", ".spec.", "__tests__", "test/"])
        is_config = any(c in file_name.lower() for c in [
            "config", "tsconfig", "vite", "webpack", "eslint", "tailwind", "postcss", "babel"
        ])
        is_entry_point = file_name in {
            "index.ts", "index.tsx", "index.js", "index.jsx",
            "main.ts", "main.tsx", "main.js", "main.jsx",
            "App.tsx", "App.jsx", "server.ts", "server.js"
        }

        imports: List[ImportInfo] = []
        exports: List[ExportInfo] = []
        functions: List[FunctionInfo] = []
        classes: List[ClassInfo] = []
        calls: List[CallInfo] = []
        framework_signals: Set[str] = set()

        # Parse ESM imports
        for match in RE_ESM_IMPORT.finditer(content):
            default_imp, named_imps, star_imp, source = match.groups()
            symbols = []
            if default_imp:
                symbols.append(default_imp)
            if star_imp:
                symbols.append(star_imp)
            if named_imps:
                cleaned = [s.strip().split(" as ")[0].strip() for s in named_imps.split(",") if s.strip()]
                symbols.extend(cleaned)

            is_ext = not (source.startswith(".") or source.startswith("/") or source.startswith("@/"))
            line_no = content[:match.start()].count("\n") + 1
            imports.append(ImportInfo(
                source=source,
                imported_symbols=symbols,
                is_external=is_ext,
                line_number=line_no
            ))

            if is_ext:
                pkg_root = source.split("/")[0]
                if pkg_root in {"react", "react-dom", "vue", "svelte", "express", "next", "axios", "@reduxjs"}:
                    framework_signals.add(pkg_root)

        # Parse bare imports: import 'style.css'
        for match in RE_BARE_IMPORT.finditer(content):
            source = match.group(1)
            is_ext = not (source.startswith(".") or source.startswith("/"))
            line_no = content[:match.start()].count("\n") + 1
            imports.append(ImportInfo(
                source=source,
                imported_symbols=[],
                is_external=is_ext,
                line_number=line_no
            ))

        # Parse CommonJS require
        for match in RE_REQUIRE.finditer(content):
            named_destructured, single_var, source = match.groups()
            symbols = []
            if single_var:
                symbols.append(single_var)
            if named_destructured:
                symbols.extend([s.strip().split(":")[0].strip() for s in named_destructured.split(",") if s.strip()])
            is_ext = not (source.startswith(".") or source.startswith("/"))
            line_no = content[:match.start()].count("\n") + 1
            imports.append(ImportInfo(
                source=source,
                imported_symbols=symbols,
                is_external=is_ext,
                line_number=line_no
            ))

        # Parse Dynamic import()
        for match in RE_DYNAMIC_IMPORT.finditer(content):
            source = match.group(1)
            is_ext = not (source.startswith(".") or source.startswith("/"))
            line_no = content[:match.start()].count("\n") + 1
            imports.append(ImportInfo(
                source=source,
                imported_symbols=["(dynamic)"],
                is_external=is_ext,
                line_number=line_no
            ))

        # Parse exports
        for match in RE_EXPORT_DEFAULT.finditer(content):
            fn_name, cls_name, var_name = match.groups()
            name = fn_name or cls_name or var_name or "default"
            line_no = content[:match.start()].count("\n") + 1
            exports.append(ExportInfo(name=name, kind="default", line_number=line_no))

        for match in RE_EXPORT_NAMED.finditer(content):
            name = match.group(1)
            line_no = content[:match.start()].count("\n") + 1
            exports.append(ExportInfo(name=name, kind="named", line_number=line_no))

        for match in RE_EXPORT_CLAUSE.finditer(content):
            clause = match.group(1)
            line_no = content[:match.start()].count("\n") + 1
            for item in clause.split(","):
                name = item.strip().split(" as ")[0].strip()
                if name:
                    exports.append(ExportInfo(name=name, kind="clause", line_number=line_no))

        # Parse functions
        seen_fns = set()
        for match in RE_FUNCTION_DEF.finditer(content):
            fn_name = match.group(1)
            params = [p.strip().split(":")[0].strip() for p in match.group(2).split(",") if p.strip()]
            line_no = content[:match.start()].count("\n") + 1
            if fn_name not in seen_fns:
                seen_fns.add(fn_name)
                functions.append(FunctionInfo(
                    name=fn_name,
                    line_start=line_no,
                    line_end=min(line_no + 15, line_count),
                    parameters=params,
                    complexity=1 + content[match.start():match.start()+500].count("if (") + content[match.start():match.start()+500].count("&&")
                ))

        for match in RE_ARROW_FN.finditer(content):
            fn_name = match.group(1)
            raw_params = match.group(2) or match.group(3) or ""
            params = [p.strip().split(":")[0].strip() for p in raw_params.split(",") if p.strip()]
            line_no = content[:match.start()].count("\n") + 1
            if fn_name not in seen_fns:
                seen_fns.add(fn_name)
                functions.append(FunctionInfo(
                    name=fn_name,
                    line_start=line_no,
                    line_end=min(line_no + 15, line_count),
                    parameters=params,
                    complexity=1 + content[match.start():match.start()+500].count("if (")
                ))

        # Parse classes
        for match in RE_CLASS_DEF.finditer(content):
            cls_name = match.group(1)
            base_cls = match.group(2)
            line_no = content[:match.start()].count("\n") + 1
            classes.append(ClassInfo(
                name=cls_name,
                line_start=line_no,
                line_end=min(line_no + 30, line_count),
                base_classes=[base_cls] if base_cls else []
            ))

        # Parse fetch / API calls
        for match in RE_FETCH_CALL.finditer(content):
            endpoint = match.group(1)
            line_no = content[:match.start()].count("\n") + 1
            calls.append(CallInfo(callee="fetch", target_endpoint=endpoint, line_number=line_no))

        # Check for Express / API route definition
        has_route = bool(RE_ROUTE_DEF.search(content)) or "/api/" in norm_path or "routes/" in norm_path

        # Determine Role
        role = "module"
        if is_entry_point:
            role = "entry"
        elif is_test:
            role = "test"
        elif is_config:
            role = "config"
        elif ext in {".tsx", ".jsx"} or "components/" in norm_path:
            role = "component"
        elif has_route or "api" in norm_path or "controller" in norm_path:
            role = "api_route"
        elif "service" in norm_path:
            role = "service"
        elif "hook" in norm_path or "hooks/" in norm_path:
            role = "hook"
        elif "util" in norm_path or "lib/" in norm_path:
            role = "utility"
        elif "model" in norm_path or "types" in norm_path:
            role = "model"

        return ParsedFileResult(
            relative_path=relative_path,
            file_name=file_name,
            extension=ext,
            language=language,
            line_count=line_count,
            file_size=file_size,
            is_entry_point=is_entry_point,
            is_config=is_config,
            is_test=is_test,
            role=role,
            imports=imports,
            exports=exports,
            functions=functions,
            classes=classes,
            calls=calls,
            framework_signals=list(framework_signals)
        )
