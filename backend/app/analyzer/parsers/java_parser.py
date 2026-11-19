import re
from pathlib import Path
from typing import List, Set
from app.analyzer.parsers.base import (
    BaseParser, ParsedFileResult, ImportInfo, ExportInfo, FunctionInfo, ClassInfo, CallInfo
)

RE_JAVA_PACKAGE = re.compile(r"""package\s+([a-zA-Z0-9_.]+)\s*;""")
RE_JAVA_IMPORT = re.compile(r"""import\s+(?:static\s+)?([a-zA-Z0-9_.*]+)\s*;""")
RE_JAVA_CLASS = re.compile(r"""(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+([a-zA-Z0-9_]+))?(?:\s+implements\s+([a-zA-Z0-9_,\s]+))?""")
RE_JAVA_METHOD = re.compile(r"""(?:public|protected|private|static|\s)+[\w<>\[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*\{""")


class JavaParser(BaseParser):
    def can_parse(self, extension: str) -> bool:
        return extension.lower() in {".java"}

    def parse_file(self, file_path: Path, relative_path: str, content: str) -> ParsedFileResult:
        lines = content.splitlines()
        line_count = len(lines)
        file_size = len(content.encode("utf-8"))
        file_name = file_path.name
        norm_path = relative_path.replace("\\", "/").lower()

        is_test = "test" in norm_path or "@test" in content.lower() or file_name.endswith("Test.java")
        is_config = "config" in norm_path or "@configuration" in content.lower()
        is_entry_point = "public static void main" in content

        imports: List[ImportInfo] = []
        exports: List[ExportInfo] = []
        functions: List[FunctionInfo] = []
        classes: List[ClassInfo] = []
        calls: List[CallInfo] = []
        framework_signals: Set[str] = set()

        for match in RE_JAVA_IMPORT.finditer(content):
            imp = match.group(1)
            is_ext = not (imp.startswith("com.app") or imp.startswith("org.app"))
            line_no = content[:match.start()].count("\n") + 1
            imports.append(ImportInfo(
                source=imp,
                imported_symbols=[imp.split(".")[-1]],
                is_external=is_ext,
                line_number=line_no
            ))
            if "springframework" in imp:
                framework_signals.add("Spring")
            elif "jakarta" in imp or "javax" in imp:
                framework_signals.add("Jakarta/JavaEE")

        for match in RE_JAVA_CLASS.finditer(content):
            cls_name = match.group(1)
            base_cls = match.group(2)
            line_no = content[:match.start()].count("\n") + 1
            classes.append(ClassInfo(
                name=cls_name,
                line_start=line_no,
                line_end=min(line_no + 50, line_count),
                base_classes=[base_cls] if base_cls else []
            ))
            exports.append(ExportInfo(name=cls_name, kind="class", line_number=line_no))

        for match in RE_JAVA_METHOD.finditer(content):
            method_name = match.group(1)
            raw_params = match.group(2)
            params = [p.strip().split()[-1] for p in raw_params.split(",") if p.strip()]
            line_no = content[:match.start()].count("\n") + 1
            functions.append(FunctionInfo(
                name=method_name,
                line_start=line_no,
                line_end=min(line_no + 20, line_count),
                parameters=params,
                complexity=1 + content[match.start():match.start()+400].count("if (")
            ))

        role = "module"
        if is_entry_point:
            role = "entry"
        elif is_test:
            role = "test"
        elif is_config:
            role = "config"
        elif "@restcontroller" in content.lower() or "@controller" in content.lower() or "controller" in norm_path:
            role = "api_route"
        elif "@service" in content.lower() or "service" in norm_path:
            role = "service"
        elif "@repository" in content.lower() or "@entity" in content.lower() or "repository" in norm_path or "entity" in norm_path:
            role = "model"

        return ParsedFileResult(
            relative_path=relative_path,
            file_name=file_name,
            extension=".java",
            language="Java",
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
