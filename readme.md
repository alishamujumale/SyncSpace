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

### Frontend (Vercel)
- Connect the client folder to Vercel.
- Set the environment variable:
  - REACT_APP_API_URL=https://your-render-backend-url.onrender.com
- Build command: npm run build
- Output directory: build

### Backend (Render)
- Connect the server folder to Render.
- Set these environment variables:
  - NODE_ENV=production
  - PORT=10000
  - MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/syncspace?retryWrites=true&w=majority
  - SESSION_SECRET=your-random-secret
  - CLIENT_URL=https://your-vercel-app.vercel.app
  - CLIENT_URLS=https://your-vercel-app.vercel.app
  - GOOGLE_CLIENT_ID=your-google-oauth-client-id
  - GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
  - GOOGLE_CALLBACK_URL=https://your-render-backend-url.onrender.com/auth/google/callback
- Start command: npm start

### Database (MongoDB Atlas)
- Create a free Atlas cluster.
- Create a database user.
- Allow access from 0.0.0.0/0 for easy deployment.
- Use the connection string in MONGO_URI.

### Important notes
- The frontend now uses REACT_APP_API_URL instead of localhost.
- The backend now supports production CORS and secure cookies for deployed environments.