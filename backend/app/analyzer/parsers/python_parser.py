import ast
from pathlib import Path
from typing import List, Optional
from app.analyzer.parsers.base import (
    BaseParser, ParsedFileResult, ImportInfo, ExportInfo, FunctionInfo, ClassInfo, CallInfo
)


class CyclomaticComplexityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.complexity = 1

    def visit_If(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_For(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_While(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_Try(self, node):
        self.complexity += len(node.handlers)
        self.generic_visit(node)

    def visit_BoolOp(self, node):
        self.complexity += len(node.values) - 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        self.generic_visit(node)


class PythonParser(BaseParser):
    def can_parse(self, extension: str) -> bool:
        return extension.lower() in {".py"}

    def parse_file(self, file_path: Path, relative_path: str, content: str) -> ParsedFileResult:
        lines = content.splitlines()
        line_count = len(lines)
        file_size = len(content.encode("utf-8"))
        file_name = file_path.name
        norm_path = relative_path.replace("\\", "/").lower()

        # Check heuristics for test and config and entry
        is_test = "test" in norm_path or file_name.startswith("test_") or file_name.endswith("_test.py")
        is_config = file_name in {"settings.py", "config.py", "setup.py", "conftest.py"} or "config" in norm_path
        is_entry_point = file_name in {"main.py", "app.py", "__main__.py", "manage.py", "wsgi.py", "asgi.py"}

        imports: List[ImportInfo] = []
        exports: List[ExportInfo] = []
        functions: List[FunctionInfo] = []
        classes: List[ClassInfo] = []
        calls: List[CallInfo] = []
        framework_signals: List[str] = []

        role = "module"
        if is_entry_point:
            role = "entry"
        elif is_test:
            role = "test"
        elif is_config:
            role = "config"

        try:
            tree = ast.parse(content, filename=str(file_path))
        except SyntaxError:
            # If there's a syntax error in user code, return best-effort basic file
            return ParsedFileResult(
                relative_path=relative_path,
                file_name=file_name,
                extension=".py",
                language="Python",
                line_count=line_count,
                file_size=file_size,
                is_entry_point=is_entry_point,
                is_config=is_config,
                is_test=is_test,
                role=role
            )

        has_api_route = False
        has_database_model = False
        has_service_logic = False

        for node in ast.walk(tree):
            # Parse imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    is_ext = not (alias.name.startswith(".") or alias.name.startswith("app") or alias.name.startswith("src"))
                    imports.append(ImportInfo(
                        source=alias.name,
                        imported_symbols=[alias.asname or alias.name],
                        is_external=is_ext,
                        line_number=getattr(node, 'lineno', 1)
                    ))
                    if alias.name in {"fastapi", "flask", "django", "sqlalchemy", "tortoise", "pydantic"}:
                        framework_signals.append(alias.name)

            elif isinstance(node, ast.ImportFrom):
                module_name = node.module or ""
                dots = "." * node.level
                source = f"{dots}{module_name}"
                is_ext = node.level == 0 and not (source.startswith("app") or source.startswith("src"))
                symbols = [a.name for a in node.names]
                imports.append(ImportInfo(
                    source=source,
                    imported_symbols=symbols,
                    is_external=is_ext,
                    line_number=getattr(node, 'lineno', 1)
                ))
                if source.split(".")[0] in {"fastapi", "flask", "django", "sqlalchemy", "tortoise", "pydantic"}:
                    framework_signals.append(source.split(".")[0])

            # Parse function calls (e.g. requests.get, httpx.get, db.query)
            elif isinstance(node, ast.Call):
                callee_name = ""
                if isinstance(node.func, ast.Name):
                    callee_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    val = node.func.value
                    prefix = val.id if isinstance(val, ast.Name) else ""
                    callee_name = f"{prefix}.{node.func.attr}" if prefix else node.func.attr

                endpoint_target = None
                if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                    if node.args[0].value.startswith("/") or node.args[0].value.startswith("http"):
                        endpoint_target = node.args[0].value

                if callee_name:
                    calls.append(CallInfo(
                        callee=callee_name,
                        target_endpoint=endpoint_target,
                        line_number=getattr(node, 'lineno', 1)
                    ))

        # Parse top-level classes and functions
        for stmt in tree.body:
            if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef)):
                cc_visitor = CyclomaticComplexityVisitor()
                cc_visitor.visit(stmt)
                
                decorator_names = []
                for dec in stmt.decorator_list:
                    if isinstance(dec, ast.Name):
                        decorator_names.append(dec.id)
                    elif isinstance(dec, ast.Attribute):
                        prefix = dec.value.id if isinstance(dec.value, ast.Name) else ""
                        decorator_names.append(f"{prefix}.{dec.attr}" if prefix else dec.attr)
                    elif isinstance(dec, ast.Call):
                        fn = dec.func
                        if isinstance(fn, ast.Name):
                            decorator_names.append(fn.id)
                        elif isinstance(fn, ast.Attribute):
                            prefix = fn.value.id if isinstance(fn.value, ast.Name) else ""
                            decorator_names.append(f"{prefix}.{fn.attr}" if prefix else fn.attr)
                
                # Check for API route decorator
                for dec in decorator_names:
                    if any(term in dec for term in ["get", "post", "put", "delete", "patch", "route"]):
                        has_api_route = True

                docstring = ast.get_docstring(stmt)
                params = [arg.arg for arg in stmt.args.args]
                line_end = getattr(stmt, 'end_lineno', stmt.lineno)

                fn_info = FunctionInfo(
                    name=stmt.name,
                    line_start=stmt.lineno,
                    line_end=line_end,
                    parameters=params,
                    is_async=isinstance(stmt, ast.AsyncFunctionDef),
                    complexity=cc_visitor.complexity,
                    docstring=docstring,
                    decorators=decorator_names
                )
                functions.append(fn_info)

                if not stmt.name.startswith("_"):
                    exports.append(ExportInfo(name=stmt.name, kind="function", line_number=stmt.lineno))

            elif isinstance(stmt, ast.ClassDef):
                base_names = []
                for b in stmt.bases:
                    if isinstance(b, ast.Name):
                        base_names.append(b.id)
                    elif isinstance(b, ast.Attribute):
                        base_names.append(b.attr)
                
                if any(b in {"Base", "Model", "DeclarativeBase", "BaseModel"} for b in base_names):
                    has_database_model = True

                method_names = []
                for item in stmt.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        method_names.append(item.name)

                line_end = getattr(stmt, 'end_lineno', stmt.lineno)
                docstring = ast.get_docstring(stmt)

                classes.append(ClassInfo(
                    name=stmt.name,
                    line_start=stmt.lineno,
                    line_end=line_end,
                    base_classes=base_names,
                    methods=method_names,
                    docstring=docstring
                ))

                exports.append(ExportInfo(name=stmt.name, kind="class", line_number=stmt.lineno))

        # Refine role if not set by entry or test
        if role == "module":
            if has_api_route or "route" in norm_path or "api" in norm_path:
                role = "api_route"
            elif has_database_model or "model" in norm_path or "schema" in norm_path:
                role = "model"
            elif "service" in norm_path:
                role = "service"
            elif "controller" in norm_path:
                role = "controller"
            elif "util" in norm_path or "helper" in norm_path:
                role = "utility"

        return ParsedFileResult(
            relative_path=relative_path,
            file_name=file_name,
            extension=".py",
            language="Python",
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
            framework_signals=list(set(framework_signals))
        )
