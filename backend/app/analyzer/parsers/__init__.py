from pathlib import Path
from typing import List, Optional
from app.analyzer.parsers.base import BaseParser, ParsedFileResult
from app.analyzer.parsers.python_parser import PythonParser
from app.analyzer.parsers.ts_js_parser import TsJsParser
from app.analyzer.parsers.java_parser import JavaParser


class ParserRegistry:
    def __init__(self):
        self.parsers: List[BaseParser] = [
            PythonParser(),
            TsJsParser(),
            JavaParser()
        ]

    def register_parser(self, parser: BaseParser):
        self.parsers.insert(0, parser)

    def get_parser(self, extension: str) -> Optional[BaseParser]:
        for parser in self.parsers:
            if parser.can_parse(extension):
                return parser
        return None

    def parse(self, file_path: Path, relative_path: str, content: str) -> ParsedFileResult:
        parser = self.get_parser(file_path.suffix)
        if parser:
            return parser.parse_file(file_path, relative_path, content)
        
        # Fallback generic metadata extractor
        lines = content.splitlines()
        ext = file_path.suffix.lower()
        lang_map = {
            ".json": "JSON",
            ".yaml": "YAML",
            ".yml": "YAML",
            ".md": "Markdown",
            ".html": "HTML",
            ".css": "CSS",
            ".sql": "SQL"
        }
        return ParsedFileResult(
            relative_path=relative_path,
            file_name=file_path.name,
            extension=ext,
            language=lang_map.get(ext, "Unknown"),
            line_count=len(lines),
            file_size=len(content.encode("utf-8")),
            is_entry_point=False,
            is_config=ext in {".json", ".yaml", ".yml", ".toml"},
            is_test=False,
            role="config" if ext in {".json", ".yaml", ".yml"} else "module"
        )


registry = ParserRegistry()
