import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import Project, CodeFile, AIInvestigation


class AIInvestigator:
    def __init__(self, db: Session, project: Project):
        self.db = db
        self.project = project
        self.files = db.query(CodeFile).filter(CodeFile.project_id == project.id).all()

    def _retrieve_relevant_files(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Finds most relevant files and symbols based on query keywords and codebase roles."""
        q_tokens = set(query.lower().replace("?", "").replace("/", " ").replace(".", " ").split())
        scored_files = []

        for f in self.files:
            score = 0
            norm_path = f.relative_path.lower()
            norm_name = f.file_name.lower()

            # Path matches
            for token in q_tokens:
                if len(token) < 2:
                    continue
                if token in norm_name:
                    score += 15
                elif token in norm_path:
                    score += 8

            # Role matches
            if "auth" in q_tokens or "login" in q_tokens:
                if "auth" in norm_path or "login" in norm_path:
                    score += 25
            if "api" in q_tokens or "route" in q_tokens or "request" in q_tokens:
                if f.role == "api_route" or "route" in norm_path or "api" in norm_path:
                    score += 20
            if "data" in q_tokens or "database" in q_tokens or "model" in q_tokens or "schema" in q_tokens:
                if f.role == "model" or "model" in norm_path or "schema" in norm_path:
                    score += 20

            # Function / symbol matches
            matched_symbols = []
            for fn in (f.functions or []):
                fn_name = fn.get("name", "").lower()
                for token in q_tokens:
                    if len(token) > 2 and token in fn_name:
                        score += 12
                        matched_symbols.append(fn.get("name"))

            for cls in (f.classes or []):
                cls_name = cls.get("name", "").lower()
                for token in q_tokens:
                    if len(token) > 2 and token in cls_name:
                        score += 12
                        matched_symbols.append(cls.get("name"))

            if score > 0 or f.is_entry_point:
                scored_files.append({
                    "file": f,
                    "score": score,
                    "matched_symbols": list(set(matched_symbols))
                })

        scored_files.sort(key=lambda x: x["score"], reverse=True)
        return scored_files[:top_k]

    def _read_file_snippet(self, rel_path: str, max_lines: int = 40) -> str:
        """Reads real source snippet safely from repository path."""
        try:
            full_path = Path(self.project.root_path) / rel_path
            if not full_path.exists():
                # Check subdirectories
                matches = list(Path(self.project.root_path).rglob(Path(rel_path).name))
                if matches:
                    full_path = matches[0]
            if full_path.exists():
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = [line.rstrip() for line in f.readlines()[:max_lines]]
                    return "\n".join(lines)
        except Exception:
            pass
        return ""

    async def _query_external_llm(self, prompt: str) -> Optional[str]:
        """Calls external OpenAI or Gemini API if credentials are provided."""
        # Try Gemini API if key is present
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2}
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                pass

        # Try OpenAI API if key is present
        if settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are Codebase X-Ray AI, an expert software architecture investigator. You provide accurate, source-grounded answers citing only existing files and functions."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
            except Exception:
                pass

        return None

    def _generate_grounded_local_response(self, query: str, relevant: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        High-precision source-grounded response generator.
        Provides deterministic, factually accurate answers rooted in actual AST extracts.
        """
        q = query.lower()
        cited_files = []
        cited_symbols = []
        body_sections = []

        total_files = len(self.files)
        primary_lang = self.project.primary_language or "Unknown"
        frameworks = ", ".join(self.project.frameworks or []) or "Standard standard-library setup"

        # General project explanation
        if any(term in q for term in ["explain", "overview", "what does", "about this project", "architecture"]):
            body_sections.append(
                f"### Project Overview: **{self.project.name}**\n\n"
                f"This repository contains **{total_files} analyzed files** ({self.project.total_lines:,} lines of code) "
                f"primarily authored in **{primary_lang}**, utilizing **{frameworks}**.\n\n"
                f"#### Core Architectural Layers Discovered:"
            )

            # Categorize discovered modules
            entries = [f for f in self.files if f.is_entry_point]
            routes = [f for f in self.files if f.role == "api_route"]
            services = [f for f in self.files if f.role == "service"]
            models = [f for f in self.files if f.role == "model"]
            components = [f for f in self.files if f.role == "component"]

            if entries:
                body_sections.append(f"- **Entry Points:** `{', '.join(f.relative_path for f in entries[:3])}`")
                for e in entries[:2]:
                    cited_files.append({"path": e.relative_path, "reason": "System entry point / bootstrap file"})

            if routes:
                body_sections.append(f"- **API Routes / Controllers:** `{', '.join(f.relative_path for f in routes[:4])}`")
                for r in routes[:2]:
                    cited_files.append({"path": r.relative_path, "reason": "Handles incoming network requests"})

            if services:
                body_sections.append(f"- **Business & Domain Logic:** `{', '.join(f.relative_path for f in services[:4])}`")
                for s in services[:2]:
                    cited_files.append({"path": s.relative_path, "reason": "Executes domain workflows"})

            if models:
                body_sections.append(f"- **Data Models & Schemas:** `{', '.join(f.relative_path for f in models[:4])}`")
                for m in models[:2]:
                    cited_files.append({"path": m.relative_path, "reason": "Defines schemas and database entities"})

            if components:
                body_sections.append(f"- **UI Components:** `{', '.join(f.relative_path for f in components[:4])}`")
                for c in components[:2]:
                    cited_files.append({"path": c.relative_path, "reason": "User interface presentation layer"})

        # Specific feature / investigation query
        elif relevant:
            body_sections.append(f"### Investigation Findings for: *\"{query}\"*\n")
            body_sections.append("Based on static source code analysis, the following relevant files and modules handle this capability:")

            for item in relevant:
                f = item["file"]
                fn_names = [fn["name"] for fn in (f.functions or [])[:4]]
                cls_names = [c["name"] for c in (f.classes or [])[:3]]
                symbols = fn_names + cls_names
                cited_symbols.extend(symbols)

                cited_files.append({
                    "path": f.relative_path,
                    "reason": f"Discovered role: {f.role} with matching symbols: {', '.join(symbols) if symbols else 'module contents'}"
                })

                body_sections.append(f"\n#### [{f.relative_path}](file:///{f.relative_path})")
                body_sections.append(f"- **Role:** `{f.role}` | **Language:** {f.language} | **Lines:** {f.line_count}")
                if symbols:
                    body_sections.append(f"- **Exported Symbols / Functions:** `{', '.join(symbols)}`")

                # Include actual snippet
                snippet = self._read_file_snippet(f.relative_path, max_lines=15)
                if snippet:
                    body_sections.append(f"```text\n{snippet}\n```")

        else:
            body_sections.append(
                f"### Analysis Result\n\n"
                f"Could not identify definitive static occurrences directly matching `\"{query}\"` in the indexed repository files.\n\n"
                f"**Recommendation:** Try querying for specific file names, components, functions, or architectural concepts like 'auth', 'database', 'api', or 'routes'."
            )

        full_response = "\n\n".join(body_sections)
        uncertainty = None
        if not relevant and "explain" not in q:
            uncertainty = "Static analysis could not find direct token matches for this query in the analyzed code files."

        return {
            "response": full_response,
            "cited_files": cited_files,
            "cited_symbols": list(set(cited_symbols)),
            "uncertainty_note": uncertainty
        }

    async def investigate(self, query: str) -> Dict[str, Any]:
        """Executes source-grounded code investigation."""
        relevant = self._retrieve_relevant_files(query, top_k=4)

        # Build context for LLM if available
        context_lines = [f"Repository: {self.project.name} ({self.project.primary_language})"]
        for item in relevant:
            f = item["file"]
            snippet = self._read_file_snippet(f.relative_path, max_lines=25)
            context_lines.append(f"File: {f.relative_path} (role: {f.role})\nSnippet:\n{snippet}\n")

        prompt = (
            f"You are Codebase X-Ray AI. Answer the following question about this codebase based strictly on the provided real code context.\n"
            f"Question: {query}\n\n"
            f"Context:\n" + "\n".join(context_lines) + "\n\n"
            f"Instructions:\n"
            f"- Ground all answers strictly in the files, functions, and lines shown.\n"
            f"- If certain details cannot be proven from static code, explicitly state the uncertainty.\n"
            f"- Do not hallucinate files or APIs."
        )

        external_resp = await self._query_external_llm(prompt)
        if external_resp:
            cited_files = [{"path": item["file"].relative_path, "reason": f"Role: {item['file'].role}"} for item in relevant]
            cited_symbols = [fn["name"] for item in relevant for fn in (item["file"].functions or [])[:3]]
            result = {
                "response": external_resp,
                "cited_files": cited_files,
                "cited_symbols": list(set(cited_symbols)),
                "uncertainty_note": None
            }
        else:
            result = self._generate_grounded_local_response(query, relevant)

        # Record investigation history
        inv = AIInvestigation(
            project_id=self.project.id,
            query=query,
            response=result["response"],
            cited_files=result["cited_files"],
            cited_symbols=result["cited_symbols"],
            uncertainty_note=result.get("uncertainty_note")
        )
        self.db.add(inv)
        self.db.commit()

        return result
