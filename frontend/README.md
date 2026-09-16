# Project RAG Tracker Frontend

The frontend is the React and TypeScript client for Project RAG Tracker. It provides JWT login, a user-scoped project list, drag-and-drop Kanban boards, task editing, a project RAG chat, and a user administration view.

## Stack

- React 19 with TypeScript and Create React App
- Material UI and Emotion
- React Router
- Axios
- `dnd-kit`
- `jwt-decode` and Day.js

## Main Areas

- `src/App.tsx` defines the project list and client-side routes.
- `src/ProjectBoard.tsx` contains the board, column/task drag and drop, and chat panel.
- `src/TaskDetailModal.tsx` edits task titles and descriptions.
- `src/context/AuthContext.tsx` owns login, logout, decoded user state, and browser token persistence.
- `src/api/axiosInstance.ts` attaches and refreshes JWT access tokens.
- `src/admin/` contains the user administration interface.

## Backend Communication

Set `REACT_APP_API_URL` when starting the frontend. For the default local backend:

```bash
REACT_APP_API_URL=http://localhost:8000 npm start
```

PowerShell:

```powershell
$env:REACT_APP_API_URL = "http://localhost:8000"
npm start
```

Axios sends REST requests to Django. The authenticated client stores the access/refresh token pair in `localStorage`, adds the access token to requests, and calls the refresh endpoint when the access token expires.

The board loads a project with nested columns and tasks. Dragging persists column order, task order, or the task's destination column through `PATCH` requests. The chat posts a question to the selected project's `ask` action and reloads the stored project history after completion.

See the repository-level [README](../README.md), [architecture documentation](../docs/architecture.md), and [RAG pipeline documentation](../docs/rag-pipeline.md) for the full system context.
