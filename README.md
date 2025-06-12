```markdown
# Synapse

A real-time, collaborative whiteboard application built from the ground up to demonstrate mastery of modern full-stack technologies. Inspired by industry leaders like Miro and FigJam.

## Vision
To create a web-based whiteboard application that offers a frictionless, real-time collaborative experience. Synapse serves as a blueprint for building highly performant, state-synchronized applications.

---

## Core Features (MVP)
- [x] Secure User Authentication (NextAuth.js with Google & GitHub)
- [x] Workspace & Board Management (basic board creation)
- [x] **Real-Time Collaboration Engine**
- [x] Live Cursors
- [ ] Presence Indicators (Avatars)
- [x] Conflict-Free State Sync
- [x] **Core Whiteboard Tools**
- [x] Shapes (Rectangles, Circles) with customizable colors
- [x] Sticky Notes with real-time text editing
- [x] Freehand Drawing Tool
- [ ] Connector Lines
- [x] Infinite Canvas with Panning and a Grid Background
- [ ] Zooming
- [ ] Sharing & Permissions

---

## Tech Stack
* **Frontend:** Next.js, React, TypeScript, Tailwind CSS
* **Canvas:** `react-konva`
* **Real-Time Layer:** Node.js, Express, `ws` (WebSockets)
* **Database:** Firebase Firestore (for future state persistence)
* **Authentication:** NextAuth.js

---

## Getting Started (Local Development)
Follow these instructions to set up and run the project on your local machine.

### 1. Prerequisites
* Node.js (v18 or later)
* npm

### 2. Installation
Clone the repository and install the dependencies from the root directory:
```bash
git clone [Your-Repository-URL]
cd synapse
npm install
```

### 3. Environment Variables
This project requires credentials for authentication providers.

1. Navigate to the client app: `cd apps/client`
2. Create a new file named `.env.local`
3. Add the following variables, filling in your own keys from the Google Cloud Console and GitHub OAuth Apps:

```env
AUTH_SECRET="GENERATE_A_SECRET_USING_`openssl rand -hex 32`"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="YOUR_GOOGLE_CLIENT_ID"
AUTH_GOOGLE_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
AUTH_GITHUB_ID="YOUR_GITHUB_CLIENT_ID"
AUTH_GITHUB_SECRET="YOUR_GITHUB_CLIENT_SECRET"

# WebSocket Server URL
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:8080"
```

### 4. Run the Development Servers
This is a monorepo with two separate processes. The recommended way to run them is with `concurrently` (if installed) or in two separate terminals.

**Using `concurrently` (from the root directory):**
```bash
npm run dev
```

**Using two terminals (from the root directory):**
* In Terminal 1 (Frontend): `npm run dev --workspace=apps/client`
* In Terminal 2 (Backend): `npm run dev --workspace=apps/server`

The application will be available at `http://localhost:3000`
```