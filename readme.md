SyncSpace

SyncSpace is a real-time collaborative workspace built using the MERN stack. It combines team collaboration, task management, live chat, document editing, and AI-powered assistance into a single platform.

Think of it as a lightweight blend of Notion, Slack, and Trello—with AI built in.

🧠 Features
👥 Team Collaboration
Create and manage project rooms
Assign and track tasks
Collaborate with team members in real-time
💬 Real-Time Communication
Live chat using WebSockets
Instant updates across all users
📝 Collaborative Document Editor
Real-time document editing
Version tracking and comments
🤖 AI Integration
AI-powered:
Plan generation
Q&A
Summarization
Integrated using Groq API
🔐 Authentication
Secure login via Google OAuth
Session-based authentication using Passport.js
🏗️ Tech Stack
Frontend
React.js
Context API
Socket.io-client
Backend
Node.js
Express.js
Socket.io
Passport.js
Database
MongoDB (Mongoose ODM)
External Services
Groq AI API
Google OAuth
🏛️ Architecture
Frontend (React SPA)
Dashboard (Rooms & progress)
Room Page (Tasks, chat, AI)
Document Editor (real-time collaboration)
AuthContext (global state)
WebSocket client
Backend (Express Server)
Authentication (OAuth + sessions)
REST APIs (Rooms, Tasks, Messages, Docs)
Socket.io for real-time features
AI service layer (plan generation, summarization)
Middleware (auth checks, error handling)
Database (MongoDB)

Collections:

Users
Rooms
Tasks
Messages
Documents
Comments
Versions
AI Sessions
🔄 How It Works
Client sends requests via REST APIs
Real-time updates handled using WebSockets
Backend processes:
Database operations (MongoDB)
AI requests (Groq API)
Authentication (Google OAuth)
Updates are pushed instantly to connected users

## Deployment

### Frontend (Railway)
- Connect the `client` folder to Railway as a static site or Node.js service.
- Set the environment variable for your Railway project:
  - REACT_APP_API_URL=https://your-railway-backend-url.up.railway.app
- Build command: `npm run build`
- Output directory: `build`
- If you use Railway Static Sites, configure the site to serve the `build` directory after the build step.

### Backend (Railway)
- Connect the `server` folder to Railway as a Node.js service.
- Set these environment variables in your Railway project settings:
  - NODE_ENV=production
  - MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/syncspace?retryWrites=true&w=majority
  - SESSION_SECRET=your-random-secret
  - CLIENT_URL=https://your-railway-frontend-url.up.railway.app
  - CLIENT_URLS=https://your-railway-frontend-url.up.railway.app
  - GOOGLE_CLIENT_ID=your-google-oauth-client-id
  - GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
  - GOOGLE_CALLBACK_URL=https://your-railway-backend-url.up.railway.app/auth/google/callback
- Railway provides a `PORT` environment variable automatically; ensure the server uses `process.env.PORT || 10000`.
- Start command: `npm start`

### Google OAuth (register redirect)
- In Google Cloud Console, add an Authorized redirect URI for your OAuth client:
  - Production (Railway): `https://your-railway-backend-url.up.railway.app/auth/google/callback`
  - Local testing: `http://localhost:10000/auth/google/callback`
- Ensure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are set in your Railway project (the `GOOGLE_CALLBACK_URL` must exactly match the redirect URI registered in Google Cloud).

### Railway env variables reminder
- Set the following env vars in your Railway project settings for the backend service:
  - `NODE_ENV=production`
  - `PORT` (Railway provides this automatically)
  - `MONGO_URI` (the Atlas URI)
  - `SESSION_SECRET`
  - `CLIENT_URL` and `CLIENT_URLS` (your frontend URL)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Any API keys (e.g., `OPENAI_API_KEY`, `GROQ_API_KEY`)

### Database (MongoDB Atlas)
- Create a free Atlas cluster.
- Create a database user.
- Allow access from 0.0.0.0/0 for easy deployment.
- Use the connection string in MONGO_URI.

### Important notes
- The frontend now uses REACT_APP_API_URL instead of localhost.
- The backend now supports production CORS and secure cookies for deployed environments.