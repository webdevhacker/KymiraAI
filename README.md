# KymiraAI – Fullstack AI Agent Platform

A production-grade fullstack AI agent app similar to ChatGPT, built with:
- **Frontend**: Vite + React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (users, conversations, messages, memory)
- **AI**: OpenAI GPT-4o (streaming) + DALL-E 3 (image gen)
- **Web Search**: Tavily API
- **Auth**: JWT access + refresh tokens
- **Rate Limiting**: express-rate-limit (60/min general, 10/min AI)

## Features

| Feature | Description |
|---------|-------------|
| 💬 **Streaming Chat** | Real-time token streaming via SSE |
| 🌐 **Web Search** | Live web search via Tavily + GPT tool calling |
| 🎨 **Image Generation** | DALL-E 3 image generation (tool + UI) |
| 📎 **File Analysis** | Upload images/text/code → GPT-4o vision |
| 🧠 **AI Memory** | Auto-extracts and stores user facts across sessions |
| 🔐 **Auth** | JWT with access (15m) + refresh (7d) token rotation |
| 🚦 **Rate Limiting** | 60 req/min (general) / 10 req/min (AI) per user |
| 📱 **Responsive** | Works on desktop and mobile |

## Project Structure

```
Kymiraai/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/    # MongoDB connection
│   │   ├── models/    # User, Conversation, Message, Memory
│   │   ├── middleware/ # auth, rateLimiter, upload, errorHandler
│   │   ├── services/  # openaiService, searchService, memoryService
│   │   ├── controllers/ # auth, chat, conversation, memory
│   │   ├── routes/    # auth, chat, conversations, memory
│   │   └── index.ts   # Express entry point
│   └── uploads/       # Uploaded files (created automatically)
│
└── frontend/          # Vite + React UI
    ├── src/
    │   ├── api/        # axios client + API calls
    │   ├── components/ # Sidebar, ChatWindow, MessageBubble, InputBar, ...
    │   ├── contexts/   # AuthContext, ChatContext
    │   ├── pages/      # AuthPage, ChatPage
    │   └── types/      # TypeScript interfaces
    └── ...
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)
- OpenAI API key
- Tavily API key (free at [tavily.com](https://tavily.com))

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open in browser
Navigate to **http://localhost:5173**

## API Keys Required

| Key | Where to get | Required |
|-----|-------------|---------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) | ✅ Yes |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) | ⚠️ Optional (web search disabled without it) |
| `MONGODB_URI` | Local MongoDB or [MongoDB Atlas](https://cloud.mongodb.com) | ✅ Yes |

## Environment Variables (backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kymiraai
JWT_SECRET=your_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/stream` | SSE streaming chat (with optional file) |
| POST | `/api/chat/image` | Generate image with DALL-E 3 |

### Conversations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/conversations` | List all conversations |
| GET | `/api/conversations/:id` | Get conversation + messages |
| PUT | `/api/conversations/:id` | Rename conversation |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Memory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/memory` | Get all stored facts |
| DELETE | `/api/memory/:index` | Delete fact by index |
| DELETE | `/api/memory/clear` | Clear all memories |
