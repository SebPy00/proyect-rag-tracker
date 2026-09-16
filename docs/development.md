# Development Guide

## Environment

The repository defines a local development stack. Django runs with its development server and `DEBUG=True`; React runs through Create React App's development server. The checked-in files do not define a production server, reverse proxy, TLS, or deployment workflow.

## Requirements

For the container-based path:

- Docker Engine or Docker Desktop
- Docker Compose v2
- Sufficient disk, memory, and CPU resources for Sentence Transformers and the local Llama 3 model

For running the frontend directly on the host:

- Node.js 20 is the container's reference runtime
- npm

Internet access may be required on first setup to build images, install packages, download `all-MiniLM-L6-v2`, and pull `llama3` into Ollama.

## Services and Ports

| Compose service | Container | Role | Published port | Persistent/bind data |
| --- | --- | --- | --- | --- |
| `frontend` | `frontend_service` | React development server | `3000:3000` | `./frontend:/app`; anonymous `/app/node_modules` volume |
| `backend` | `backend_service` | Django REST development server | `8000:8000` | `./backend:/app` |
| `db` | `postgres_db` | PostgreSQL 15 with pgvector | `5433:5432` | `postgres_data` named volume |
| `ollama` | `ollama_service` | Local LLM runtime | `11434:11434` | `ollama_data` named volume |

Inside the Compose network, Django reaches PostgreSQL at `db:5432` and Ollama at `ollama:11434`.

## Configuration Inputs

The root `.env` file is ignored by Git. Compose expects:

```dotenv
DB_NAME=project_db
DB_USER=project_user
DB_PASS=choose-a-local-password
```

These values are mapped to Django's `POSTGRES_NAME`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` environment variables and to the corresponding PostgreSQL container variables.

The browser application also expects:

```text
REACT_APP_API_URL=http://localhost:8000
```

The current `docker-compose.yml` does not pass that variable to the frontend service. It must therefore be supplied at frontend process startup (examples below) for the browser to address the backend correctly. This guide documents that current constraint without changing Compose.

## First Run

### 1. Start PostgreSQL, Ollama, and Django

From the repository root:

```bash
docker compose up --build -d db ollama backend
```

`depends_on` controls startup order but does not wait for PostgreSQL readiness. If Django exits during the first database startup, start the backend again:

```bash
docker compose up -d backend
```

### 2. Apply Django migrations

```bash
docker compose exec backend python manage.py migrate
```

Migration `0001_initial` enables the PostgreSQL vector extension before the domain tables and vector field are created.

### 3. Create a login user

```bash
docker compose exec backend python manage.py createsuperuser
```

The same credentials can be used on the React login page. Django admin is available at `http://localhost:8000/admin/`.

### 4. Pull Llama 3

```bash
docker compose exec ollama ollama pull llama3
```

Compose preserves the downloaded model in `ollama_data`. The backend's first start may separately download the `all-MiniLM-L6-v2` SentenceTransformer model.

### 5. Start the React application

Use the existing Compose frontend definition while injecting the required URL at runtime:

```bash
docker compose run --rm --service-ports -e REACT_APP_API_URL=http://localhost:8000 frontend
```

Do not run the normal `frontend` service at the same time, because both processes would claim host port `3000`.

Alternatively, run the frontend on the host:

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

PowerShell equivalent:

```powershell
cd frontend
npm install
$env:REACT_APP_API_URL = "http://localhost:8000"
npm start
```

Then open `http://localhost:3000` and sign in.

## Starting the Declared Compose Stack

The repository's complete declared topology can be started with:

```bash
docker compose up --build
```

This starts all four services, but the frontend service as currently declared does not receive `REACT_APP_API_URL`. The one-off command in the first-run instructions is the documented way to supply it without editing configuration.

## Backend

The backend image is based on Python 3.11 slim, installs `backend/requirements.txt`, and starts:

```text
python manage.py runserver 0.0.0.0:8000
```

Useful development commands include:

```bash
docker compose exec backend python manage.py showmigrations
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
```

The repository currently contains only Django's empty test placeholder in `api/tests.py`.

## Frontend

The frontend image is based on Node 20 Alpine. Its normal command is `npm start`. Available package scripts are:

```bash
npm start
npm test
npm run build
```

The frontend talks directly to the backend URL from the browser. Django currently allows cross-origin requests, so `localhost:3000` can call `localhost:8000` during development.

## PostgreSQL and pgvector

The database runs from `pgvector/pgvector:pg15`. The host maps PostgreSQL to port `5433`; containers use the normal internal port `5432`. Application data persists in `postgres_data` when containers are recreated.

Django uses PostgreSQL exclusively in its checked-in settings. Although `backend/db.sqlite3` exists in the repository, it is not selected by the current database configuration.

## Ollama

Ollama publishes port `11434` to the host, while Django calls it by Compose service name. The RAG endpoint requests model `llama3`, disables streaming, and allows up to 180 seconds for the HTTP response.

Useful checks after pulling the model:

```bash
docker compose exec ollama ollama list
docker compose logs ollama
```

## Application Endpoints

| URL | Purpose |
| --- | --- |
| `http://localhost:3000/` | Authenticated project list |
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/project/{id}` | Kanban board and project RAG chat |
| `http://localhost:3000/admin/users` | Frontend user administration route |
| `http://localhost:8000/api/` | REST API root |
| `http://localhost:8000/auth/jwt/create/` | JWT login endpoint |
| `http://localhost:8000/auth/jwt/refresh/` | Access-token refresh endpoint |
| `http://localhost:8000/admin/` | Django admin |
| `http://localhost:11434/` | Published Ollama service |

## Stopping the Environment

```bash
docker compose down
```

The named database and Ollama volumes remain in place. Removing those volumes would delete local database records and downloaded models, so that operation is intentionally not included in the standard workflow.
