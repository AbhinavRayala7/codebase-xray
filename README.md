# CODEBASE X-RAY
### *See Beyond the Code.*

> **Codebase X-Ray** is an AI-powered software intelligence platform that helps developers understand, visualize, investigate, and analyze unfamiliar codebases in minutes.

---

## 🌟 Key Highlights & Architecture

- **Interactive Architecture Explorer:** Built with React Flow, providing drag-and-drop, zoomable, filterable architectural maps with cycle warnings and node inspection.
- **Dependency Detective:** Detects circular dependency cycles using NetworkX simple cycles, isolates high-coupling hub modules, and highlights betweenness centrality bottlenecks.
- **Execution Flow Tracer:** Reconstructs full request-to-persistence trajectories from frontend components down to API endpoints, business services, and database schemas with explicit **STATIC PROVEN** vs **ROLE INFERRED** badges.
- **Change Impact Blast Radius:** Analyzes direct, indirect, and potential blast radius when modifying files, surfacing downstream API routes and test suites requiring regression testing.
- **Codebase Health Auditor:** Scores repository health (0-100) and detects oversized files, high cyclomatic complexity, circular imports, and orphan candidate dead code with actionable remediation advice.
- **Source-Grounded AI Investigator:** Dual-mode AI assistant that grounds every response in real AST extracts, citing file paths, function definitions, line numbers, and actual snippets with strict zero-hallucination guardrails.
- **Project File Explorer:** Integrated tree navigator with syntax-highlighted code viewer, line numbering, and instant symbol inspector.
- **1-Click Instant Demo:** Bundles a pre-configured multi-tier fullstack project (*TaskFlow Fullstack: React + FastAPI + SQLAlchemy*) for instant zero-setup exploration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow), Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, NetworkX, SQLAlchemy 2.0, Uvicorn |
| **Parsers** | Python AST, TypeScript/JavaScript Regex/AST Parser, Java Parser, Abstract Extensible Registry |
| **Database** | SQLite (Zero-config out of the box) & PostgreSQL compatible via `DATABASE_URL` |
| **AI Layer** | Grounded AST Semantic Indexing + Optional Gemini & OpenAI API integration |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) and `npm`
- **Python** (v3.10+)

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://127.0.0.1:8000)
python run.py
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173 with proxy to backend)
npm run dev
```

---

## 🧪 Running Automated Tests

The backend includes test suites validating parser AST extracts, circular dependency graph detection, and codebase health auditing:

```bash
# From workspace root:
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest.exe backend\tests
```

---

## 🔐 Security & Ingestion Safeguards

- **Zip-Slip Traversal Prevention:** Target file paths are strictly validated against target root directories prior to extraction.
- **Safe Ingestion Limits:** Configurable limits (50MB ZIP ceiling, 2,500 file limit).
- **Zero Execution Sandbox:** Uploaded or cloned code is **never executed**; analysis is 100% static AST parsing.
- **Key Isolation:** External AI keys (Gemini / OpenAI) remain strictly on the backend server and are never delivered to the client.

---

## 📜 Creator Attribution

**Made with ♥ by Abhi**  
*CODEBASE X-RAY — See Beyond the Code.*
