# Collaborative Text Editor — Full Stack Build Prompt

## Project Overview

Build a real-time collaborative text editor web application called **CollabDocs**. Multiple users can edit the same document simultaneously with conflict-free sync powered by Yjs CRDT. The app has two pages: a landing page and an editor page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API) + Vite |
| Editor | Quill.js |
| CRDT / Sync | Yjs + y-websocket + quill-cursors |
| Backend | Node.js + Express |
| WebSocket server | y-websocket (built-in server) |
| ORM | Prisma |
| Database | PostgreSQL |
| Routing | Vue Router |
| HTTP client | Axios |
| Styling | Plain CSS (no framework) |

---

## Code Rules (Strict)

- No comments anywhere in the code
- All variable and function names must be meaningful and self-descriptive
- Module-based architecture — each concern lives in its own file
- No unused imports, no dead code, no placeholder TODOs
- No over-engineering — only build what is specified
- Backend and frontend are separate folders in a monorepo

---

## Folder Structure

```
collab-editor/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── roomApi.js
│   │   ├── components/
│   │   │   ├── RoomTable.vue
│   │   │   ├── JoinRoomModal.vue
│   │   │   ├── CreateRoomModal.vue
│   │   │   └── ActiveUserAvatars.vue
│   │   ├── pages/
│   │   │   ├── LandingPage.vue
│   │   │   └── EditorPage.vue
│   │   ├── composables/
│   │   │   ├── useYjsEditor.js
│   │   │   └── useRoomSocket.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── landing.css
│   │   │   └── editor.css
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── roomRoutes.js
│   │   ├── controllers/
│   │   │   └── roomController.js
│   │   ├── services/
│   │   │   └── roomService.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   └── generateRoomId.js
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## Database Schema (Prisma)

```prisma
model Room {
  id           String   @id
  title        String   @default("Untitled document")
  passwordHash String?
  isProtected  Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  document     Document?
}

model Document {
  id        String   @id @default(uuid())
  roomId    String   @unique
  content   String   @default("")
  updatedAt DateTime @updatedAt
  room      Room     @relation(fields: [roomId], references: [id])
}
```

---

## Backend Specification

### `server/src/index.js`

- Start an Express server on `PORT` from `.env`
- Mount `roomRoutes` at `/api/rooms`
- Start a `y-websocket` server on a separate port (`WS_PORT` from `.env`) using `@y-websocket/server`
- Use `cors` middleware allowing the client origin
- Use `express.json()` middleware
- Mount the `errorHandler` middleware last

### `server/src/utils/generateRoomId.js`

- Export a function `generateRoomId()` that returns a string in the format `xxx-xxxx-xx` using random lowercase alphanumeric characters (no ambiguous chars like l, 0, o)

### `server/src/routes/roomRoutes.js`

Define these REST endpoints:

| Method | Path | Description |
|---|---|---|
| GET | `/api/rooms` | List all rooms (id, title, isProtected, activeUsers count, createdAt) |
| POST | `/api/rooms` | Create a new room |
| POST | `/api/rooms/:roomId/join` | Validate password and return room data |
| GET | `/api/rooms/:roomId` | Get single room metadata |
| PATCH | `/api/rooms/:roomId/title` | Update document title |

### `server/src/controllers/roomController.js`

- `listRooms` — fetch all rooms, return safe fields only (no passwordHash)
- `createRoom` — accept `{ title, password }`, hash password with `bcrypt` if provided, call `generateRoomId`, save to DB
- `joinRoom` — accept `{ username, password }`, find room by `roomId`, if `isProtected` compare bcrypt hash, return room data on success or 401 on failure
- `getRoomById` — return single room metadata
- `updateTitle` — accept `{ title }`, update room title and document title

### `server/src/services/roomService.js`

- All Prisma queries live here
- Functions: `findAllRooms`, `findRoomById`, `createRoom`, `updateRoomTitle`

### `server/src/middleware/errorHandler.js`

- Express error middleware `(err, req, res, next)`
- Return `{ error: err.message }` with appropriate status code

---

## Frontend Specification

### `client/src/router/index.js`

- Route `/` → `LandingPage.vue`
- Route `/:roomId` → `EditorPage.vue`
- Use Vue Router 4 with `createWebHistory`

### `client/src/api/roomApi.js`

- Base URL from `import.meta.env.VITE_API_URL`
- Export functions: `fetchAllRooms`, `createRoom`, `joinRoom`, `getRoomById`, `updateDocumentTitle`
- Use Axios

---

## Landing Page (`LandingPage.vue`)

### Visual Design

Dark background `#0f1117`. Navigation bar at top with:
- Left: logo text "collab**docs**" where "docs" is in purple `#7F77DD`
- Right: "Join room" button (outlined purple) and "Create room" button (solid green `#1D9E75`)

Hero section centered with:
- Heading: "Real-time collaborative editing"
- Subtext: "Create a room, share the link, and edit together — instantly."
- Two CTA buttons: Join and Create

Below hero — Active rooms section:
- Section label "Active rooms" (uppercase, muted) on the left
- Search input on the right (filters table live)
- Table with columns: Room ID (monospace), Title, Users online, Access (Public/Password badge), Created

### Behaviour

- On mount, call `fetchAllRooms` and display in table
- Search filters by room ID or title (client-side)
- "Create room" opens `CreateRoomModal`
- "Join room" opens `JoinRoomModal`
- Clicking a table row opens `JoinRoomModal` pre-filled with that room's ID

### `CreateRoomModal.vue`

Fields:
- Username (text, required)
- Document title (text, required)
- Auto-generated Room ID shown in a read-only styled box with a "Regen" button that calls `generateRoomId` on the client side too
- Toggle switch for "Password protect this room" (off by default)
- Password field (shown only when toggle is on)

On submit:
- Call `createRoom` API
- On success, navigate to `/:roomId` passing `username` via Vue Router state

### `JoinRoomModal.vue`

Fields:
- Username (text, required)
- Document ID (text, required)
- Password (optional, shown always but labelled "Leave blank if public")

On submit:
- Call `joinRoom` API with `{ roomId, username, password }`
- On 200, navigate to `/:roomId` with username in router state
- On 401, show inline error "Incorrect password"
- On 404, show inline error "Room not found"

### `RoomTable.vue`

- Accepts `rooms` array and `searchQuery` string as props
- Emits `row-click(room)` when a row is clicked
- Filters rooms internally based on `searchQuery`
- Shows Public badge (green) or Password badge (gray) per room

---

## Editor Page (`EditorPage.vue`)

### Visual Design

Full dark theme `#0f1117`.

**Top navbar:**
- Left: back arrow button "← Home" + editable document title input + room ID pill (monospace, muted)
- Right: live status dot (green) + "N online" label + user avatar stack + "Share" button

Clicking avatar stack opens a small popover listing all active usernames with colored dots.

**Toolbar (below navbar):**
Quill toolbar with: paragraph/heading selector, font selector, font size selector, Bold, Italic, Underline, Strikethrough, align left/center/right, bullet list, ordered list, link, image, code block, undo, redo.

**Editor area:**
- Light padding, max-width centered content
- Quill editor in dark theme
- Remote cursors shown inline using `quill-cursors` with username labels

**Status bar (bottom):**
- Word count
- Auto-save status ("Saved just now" / "Saving...")
- Yjs sync status ("Synced" in green / "Connecting..." in amber)
- Room ID on the right

### Behaviour

- On mount: get `roomId` from route params, get `username` from router state (redirect to `/` if missing)
- Call `getRoomById` to load title and metadata
- Initialize Yjs + y-websocket + Quill using `useYjsEditor` composable
- Title input is editable; on blur call `updateDocumentTitle` API
- Title change syncs to the `h1` in the editor body as well
- Word count computed from Quill getText()
- Auto-save: debounce 3 seconds after last keystroke, save document content via API

### `composables/useYjsEditor.js`

- Accept `{ roomId, username, editorContainer }` as parameters
- Create a `Y.Doc`
- Connect to WebSocket server at `VITE_WS_URL` with `WebsocketProvider`
- Bind Quill to `Y.Text` using `QuillBinding` from `y-quill`
- Set up `quill-cursors` module with the provider awareness
- Assign each user a random color from a predefined palette
- Return `{ quill, provider, connectedUsers, syncStatus }`

### `composables/useRoomSocket.js`

- Accept `{ roomId, username }` 
- Use the provider awareness from Yjs to track connected users
- Return `{ connectedUsers }` as a reactive ref — array of `{ username, color }`

### `ActiveUserAvatars.vue`

- Accept `users` array as prop (each with `username` and `color`)
- Show up to 3 overlapping avatar circles with initials
- If more than 3, show "+N" avatar
- On click, toggle a popover showing all usernames with colored dots
- Close popover on outside click

---

## Styling Rules

All styles go in `.css` files — no inline styles, no scoped style blocks in Vue files except for component-specific overrides that cannot live in a global file.

### Color Palette

```css
--color-bg-base: #0f1117;
--color-bg-surface: #13151f;
--color-bg-elevated: #1a1d27;
--color-border-subtle: rgba(255,255,255,0.08);
--color-border-medium: rgba(255,255,255,0.15);
--color-text-primary: #ffffff;
--color-text-secondary: #aaaaaa;
--color-text-muted: #555555;
--color-accent-purple: #7F77DD;
--color-accent-purple-dim: rgba(127,119,221,0.15);
--color-accent-green: #1D9E75;
--color-accent-green-dim: rgba(29,158,117,0.15);
--color-accent-coral: #D85A30;
```

### Typography

```css
font-family: 'Inter', system-ui, sans-serif;
```

Body text 14px, line-height 1.7. Headings font-weight 500. Monospace elements use `font-family: 'JetBrains Mono', monospace`.

### Button Styles

- Primary (purple): `background: #7F77DD`, white text, hover at 88% opacity
- Secondary (green): `background: #1D9E75`, white text
- Ghost: transparent background, `border: 0.5px solid rgba(255,255,255,0.2)`, muted text
- All buttons: `border-radius: 8px`, `padding: 7px 16px`, `font-size: 13px`, `cursor: pointer`

### Form Inputs

- `background: #0f1117`
- `border: 0.5px solid rgba(255,255,255,0.15)`
- `border-radius: 8px`
- `padding: 8px 12px`
- `color: #ffffff`
- On focus: `border-color: #7F77DD`

### Modal

- `background: #1a1d27`
- `border: 0.5px solid rgba(255,255,255,0.12)`
- `border-radius: 12px`
- `padding: 24px`
- Overlay: `background: rgba(0,0,0,0.6)`

### Quill Dark Theme Override

Override Quill's default white theme to match dark editor:

```css
.ql-container { background: #0f1117; color: #cccccc; border: none; font-size: 15px; }
.ql-toolbar { background: #13151f; border: none; border-bottom: 0.5px solid rgba(255,255,255,0.08); }
.ql-toolbar .ql-stroke { stroke: #888888; }
.ql-toolbar .ql-fill { fill: #888888; }
.ql-toolbar button:hover .ql-stroke { stroke: #cccccc; }
.ql-editor { min-height: 400px; line-height: 1.8; padding: 40px 60px; }
.ql-editor h1, .ql-editor h2 { color: #ffffff; }
```

---

## Environment Variables

### `server/.env`

```
DATABASE_URL=postgresql://user:password@localhost:5432/collabdocs
PORT=3000
WS_PORT=1234
CLIENT_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
```

### `client/.env`

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:1234
```

---

## Package Dependencies

### Server (`server/package.json`)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "@prisma/client": "^5.0.0",
    "y-websocket": "^1.5.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

### Client (`client/package.json`)

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "axios": "^1.6.0",
    "yjs": "^13.6.0",
    "y-websocket": "^1.5.0",
    "y-quill": "^0.1.5",
    "quill": "^1.3.7",
    "quill-cursors": "^4.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0"
  }
}
```

---

## What NOT to Build

- No user authentication / JWT / sessions
- No file upload
- No rich media embedding beyond what Quill supports natively
- No admin panel
- No email or notifications
- No rate limiting (keep it simple for hackathon)
- No Docker setup
- No unit tests

---

## Final Instructions for the AI IDE

Generate all files in the folder structure above. Each file must be complete and functional — no placeholder functions, no stub implementations. Follow the module boundaries strictly: routes call controllers, controllers call services, services call Prisma. On the frontend, pages use composables and components — no business logic inside pages directly. All API calls go through `roomApi.js` only.