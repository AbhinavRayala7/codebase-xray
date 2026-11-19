from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from pathlib import Path


class ImportInfo(BaseModel):
    source: str                 # e.g., "./utils", "react", "app.models"
    imported_symbols: List[str] # e.g., ["useState", "Button"]
    is_external: bool = False
    is_type_only: bool = False
    line_number: int = 1


class ExportInfo(BaseModel):
    name: str                   # e.g., "UserProfile", "authService"
    kind: str = "variable"      # "function", "class", "interface", "component", "variable", "default"
    line_number: int = 1


class FunctionInfo(BaseModel):
    name: str
    line_start: int
    line_end: int
    parameters: List[str] = []
    is_async: bool = False
    complexity: int = 1
    docstring: Optional[str] = None
    decorators: List[str] = []


class ClassInfo(BaseModel):
    name: str
    line_start: int
    line_end: int
    base_classes: List[str] = []
    methods: List[str] = []
    docstring: Optional[str] = None


class CallInfo(BaseModel):
    callee: str                 # e.g. "fetch", "axios.get", "db.query"
    target_endpoint: Optional[str] = None
    line_number: int = 1


class ParsedFileResult(BaseModel):
    relative_path: str
    file_name: str
    extension: str
    language: str
    line_count: int
    file_size: int
    is_entry_point: bool = False
    is_config: bool = False
    is_test: bool = False
    role: str = "module"        # entry, component, api_route, service, controller, model, utility, config, test, module
    imports: List[ImportInfo] = []
    exports: List[ExportInfo] = []
    functions: List[FunctionInfo] = []
    classes: List[ClassInfo] = []
    calls: List[CallInfo] = []
    framework_signals: List[str] = []


class BaseParser(ABC):
    @abstractmethod
    def can_parse(self, extension: str) -> bool:
        pass

    @abstractmethod
    def parse_file(self, file_path: Path, relative_path: str, content: str) -> ParsedFileResult:
        pass
