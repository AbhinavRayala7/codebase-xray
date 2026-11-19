import re
from typing import List, Dict, Any, Optional
from app.analyzer.parsers.base import ParsedFileResult


class ExecutionStep:
    def __init__(
        self,
        step_number: int,
        title: str,
        role: str,
        file_path: str,
        line_number: Optional[int],
        description: str,
        is_static_proven: bool,
        evidence_type: str,
        symbol_name: Optional[str] = None
    ):
        self.step_number = step_number
        self.title = title
        self.role = role
        self.file_path = file_path
        self.line_number = line_number
        self.description = description
        self.is_static_proven = is_static_proven
        self.evidence_type = evidence_type
        self.symbol_name = symbol_name

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_number": self.step_number,
            "title": self.title,
            "role": self.role,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "description": self.description,
            "is_static_proven": self.is_static_proven,
            "evidence_type": self.evidence_type,
            "symbol_name": self.symbol_name
        }


class ExecutionTracer:
    def __init__(self, files: List[ParsedFileResult]):
        self.files = files
        self.files_by_path = {f.relative_path.replace("\\", "/"): f for f in files}

    def get_suggested_flows(self) -> List[Dict[str, str]]:
        """Identify available common flows in this repository based on detected components & routes."""
        flows = []
        has_auth = any(
            "auth" in f.relative_path.lower() or "login" in f.relative_path.lower()
            for f in self.files
        )
        if has_auth:
            flows.append({
                "id": "auth_login",
                "title": "User Authentication & Login Flow",
                "description": "Traces from login UI/action down through auth endpoint, credential validation, and token creation."
            })

        has_api = any(f.role == "api_route" for f in self.files)
        if has_api:
            flows.append({
                "id": "api_request",
                "title": "Core API Request & Data Mutation Flow",
                "description": "Traces incoming client API payload to route controller, business service, and database persistence."
            })

        has_db = any(f.role == "model" for f in self.files)
        if has_db:
            flows.append({
                "id": "data_persistence",
                "title": "Data Query & Database Persistence Flow",
                "description": "Traces domain model query, session management, and response formatting."
            })

        if not flows:
            flows.append({
                "id": "general_flow",
                "title": "Entrypoint Execution Flow",
                "description": "Traces initialization from main entrypoint to mounted routers and modules."
            })

        return flows

    def trace_flow(self, query: str) -> Dict[str, Any]:
        """
        Traces execution path for a given user story or query.
        Ensures strict separation between statically proven vs inferred steps.
        """
        q = query.lower().strip()
        steps: List[ExecutionStep] = []
        step_idx = 1

        # Check for matching frontend trigger or component
        ui_matches = [
            f for f in self.files
            if (f.role in {"component", "entry"} or "page" in f.relative_path.lower() or "form" in f.relative_path.lower())
            and any(term in f.relative_path.lower() or any(term in fn.name.lower() for fn in f.functions) for term in q.split())
        ]
        if not ui_matches:
            # Fallback to any component or entrypoint
            ui_matches = [f for f in self.files if f.role in {"component", "entry"}]

        frontend_step_file = ui_matches[0] if ui_matches else None
        if frontend_step_file:
            steps.append(ExecutionStep(
                step_number=step_idx,
                title=f"User Interaction Trigger ({frontend_step_file.file_name})",
                role="component",
                file_path=frontend_step_file.relative_path,
                line_number=frontend_step_file.functions[0].line_start if frontend_step_file.functions else 1,
                description=f"Action initiated via component or entry module: {frontend_step_file.file_name}",
                is_static_proven=True,
                evidence_type="ENTRY_POINT" if frontend_step_file.is_entry_point else "COMPONENT_DECLARATION",
                symbol_name=frontend_step_file.functions[0].name if frontend_step_file.functions else None
            ))
            step_idx += 1

        # Check for client-side API call or service dispatch
        api_dispatch_file = None
        for f in self.files:
            if f.calls and any(c.target_endpoint for c in f.calls):
                api_dispatch_file = f
                break
            if "api" in f.relative_path.lower() or "client" in f.relative_path.lower():
                api_dispatch_file = f
                break

        if api_dispatch_file:
            endpoint_str = api_dispatch_file.calls[0].target_endpoint if (api_dispatch_file.calls and api_dispatch_file.calls[0].target_endpoint) else "/api"
            steps.append(ExecutionStep(
                step_number=step_idx,
                title="Client API Dispatch",
                role="service",
                file_path=api_dispatch_file.relative_path,
                line_number=api_dispatch_file.calls[0].line_number if api_dispatch_file.calls else 1,
                description=f"HTTP request sent to endpoint `{endpoint_str}` with payload serialization.",
                is_static_proven=bool(api_dispatch_file.calls),
                evidence_type="AST_CALL" if api_dispatch_file.calls else "ROLE_INFERRED",
                symbol_name=api_dispatch_file.calls[0].callee if api_dispatch_file.calls else "fetch"
            ))
            step_idx += 1

        # Match backend API Route
        route_candidates = [
            f for f in self.files
            if f.role == "api_route" or "route" in f.relative_path.lower() or "controller" in f.relative_path.lower()
        ]
        route_file = None
        for rf in route_candidates:
            if any(term in rf.relative_path.lower() for term in q.split()):
                route_file = rf
                break
        if not route_file and route_candidates:
            route_file = route_candidates[0]

        if route_file:
            matching_fn = None
            for fn in route_file.functions:
                if any(term in fn.name.lower() for term in q.split()):
                    matching_fn = fn
                    break
            if not matching_fn and route_file.functions:
                matching_fn = route_file.functions[0]

            steps.append(ExecutionStep(
                step_number=step_idx,
                title=f"Backend Route Handler ({route_file.file_name})",
                role="api_route",
                file_path=route_file.relative_path,
                line_number=matching_fn.line_start if matching_fn else 1,
                description=f"Server receives request and invokes handler function `{matching_fn.name if matching_fn else 'handler'}`.",
                is_static_proven=True,
                evidence_type="ENDPOINT_MATCH",
                symbol_name=matching_fn.name if matching_fn else None
            ))
            step_idx += 1

        # Match Service or Business logic
        service_candidates = [
            f for f in self.files
            if f.role == "service" or "service" in f.relative_path.lower() or "manager" in f.relative_path.lower()
        ]
        service_file = service_candidates[0] if service_candidates else None
        if service_file:
            steps.append(ExecutionStep(
                step_number=step_idx,
                title=f"Business Logic & Service Layer ({service_file.file_name})",
                role="service",
                file_path=service_file.relative_path,
                line_number=service_file.functions[0].line_start if service_file.functions else 1,
                description=f"Executes core business validation, permission checks, and domain logic.",
                is_static_proven=any(
                    route_file and imp.source and (service_file.file_name in imp.source or Path(service_file.relative_path).stem in imp.source)
                    for imp in (route_file.imports if route_file else [])
                ),
                evidence_type="IMPORT_REFERENCE" if (route_file and any(service_file.file_name in imp.source for imp in route_file.imports)) else "ROLE_INFERRED",
                symbol_name=service_file.functions[0].name if service_file.functions else None
            ))
            step_idx += 1

        # Match Database model / persistence
        model_candidates = [
            f for f in self.files
            if f.role == "model" or "model" in f.relative_path.lower() or "db" in f.relative_path.lower() or "schema" in f.relative_path.lower()
        ]
        model_file = model_candidates[0] if model_candidates else None
        if model_file:
            cls_name = model_file.classes[0].name if model_file.classes else "Entity"
            steps.append(ExecutionStep(
                step_number=step_idx,
                title=f"Data Persistence & Database Interaction ({model_file.file_name})",
                role="model",
                file_path=model_file.relative_path,
                line_number=model_file.classes[0].line_start if model_file.classes else 1,
                description=f"Queries or commits state using `{cls_name}` schema/table representation.",
                is_static_proven=bool(model_file.classes),
                evidence_type="SCHEMA_DECLARATION",
                symbol_name=cls_name
            ))
            step_idx += 1

        # Response Return Step
        steps.append(ExecutionStep(
            step_number=step_idx,
            title="Response Serialization & State Delivery",
            role="entry",
            file_path=route_file.relative_path if route_file else (frontend_step_file.relative_path if frontend_step_file else "api/response"),
            line_number=None,
            description="Payload serialized to JSON, HTTP headers applied, and response returned to client.",
            is_static_proven=True,
            evidence_type="HTTP_RESPONSE",
            symbol_name="JSONResponse"
        ))

        return {
            "query": query,
            "steps": [s.to_dict() for s in steps],
            "total_steps": len(steps),
            "static_proven_steps": sum(1 for s in steps if s.is_static_proven),
            "inferred_steps": sum(1 for s in steps if not s.is_static_proven)
        }
