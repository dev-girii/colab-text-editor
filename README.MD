# CollabDocs

A real-time collaborative text editor with live editing, presence indicators, and persistent documents.

## Live Demo

- Live URL: https://docscolab.netlify.app
- GitHub: https://github.com/dev-girii/colab-text-editor/

## Features

- Real-time sync across multiple users using Yjs CRDT
- Coloured per-user cursors with username labels
- User presence indicators (Google Docs style avatar stack)
- Password-protected and public rooms
- Rich text formatting toolbar (bold, italic, underline, headings, lists, code)
- Document persistence in PostgreSQL
- Auto-save with debounce
- Searchable active rooms table
- Shareable room URLs

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite + Quill.js |
| CRDT | Yjs + y-websocket + y-quill + quill-cursors |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma ORM |
| Frontend Deploy | Netlify |
| Backend Deploy | Render |
| Database Host | Railway PostgreSQL |

## Project Folder Structure

```
collab-text-editor/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── styles/
   │   ├── App.vue
   │   └── main.js
│   └── package.json
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   └── package.json
└── README.MD
```

## Local Setup

```bash
git clone https://github.com/dev-girii/colab-text-editor.git
cd colab-text-editor
```

### Install dependencies

```bash
cd client
npm install
cd ../server
npm install
```

### Environment variables

Create `server/.env` with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
CLIENT_ORIGIN="http://localhost:5173"
PORT=3000
```

Create `client/.env` with:

```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

### Run locally

```bash
cd server
npm run dev
```

```bash
cd ../client
npm run dev
```

Open the Vite frontend URL shown in the terminal.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List rooms and active user counts |
| POST | `/api/rooms` | Create a new room |
| POST | `/api/rooms/:roomId/join` | Join room with optional password |
| GET | `/api/rooms/:roomId` | Fetch room metadata |
| PATCH | `/api/rooms/:roomId/title` | Update room title |
| PATCH | `/api/rooms/:roomId/document` | Save document content |
| DELETE | `/api/rooms/:roomId` | Delete room and close session |

## Deployment

| Component | Service |
|---|---|
| Frontend | Netlify |
| Backend | Render |
| Database | Railway PostgreSQL |

## AI Tools Used

### Claude (Anthropic)
- Architecture decisions and tech stack evaluation
- System design and module structure planning
- UI/UX design for landing page and editor page
- Deployment troubleshooting (CORS, Railway URLs, Render port binding)
- Writing the full project specification prompt

### GitHub Copilot
- Generating all Vue components and composables
- Implementing Yjs + Quill binding
- Writing Prisma services and Express route handlers
- Generating dark theme CSS for Quill
- Autocompleting boilerplate across all modules
