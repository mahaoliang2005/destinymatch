# Destiny Match

AI-powered romance discovery app that generates compatibility analysis and partner visualizations.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   User Browser  │────────▶│  Vite Frontend   │
│                 │         │  (Port 3000)     │
│                 │◀────────│  - No API Keys   │
└─────────────────┘         └──────────────────┘
         │
         │ POST /api/analyze
         ▼
┌─────────────────┐         ┌──────────────────┐
│ Express Backend │────────▶│ SiliconFlow API  │
│ (Port 3001)     │         │ (DeepSeek)       │
│ - API Keys      │◀────────│                  │
│ - Image Proxy   │         └──────────────────┘
│                 │
│                 │────────▶│ Dreamina AI API  │
│                 │         │ (volces.com)     │
│                 │◀────────│                  │
└─────────────────┘         └──────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

Copy `.env.example` to `server/.env` and fill in your API keys:

```bash
cp .env.example server/.env
```

Edit `server/.env`:
```bash
PORT=3001
CLIENT_URL=http://localhost:3000

# Optional - for production API calls (otherwise uses mock mode)
DREAMINA_API_KEY=your_key_here
SILICONFLOW_API_KEY=your_key_here
```

### 3. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run dev:server  # Port 3001
npm run dev:client  # Port 3000
```

## Project Structure

```
destiny-match/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls (destiny.ts only)
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts     # Dev proxy to backend
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # External API calls
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── .env               # API keys (not committed)
│
└── package.json           # Root workspace config
```

## Key Improvements

1. **API Key Security**: Keys only exist in backend environment variables
2. **CORS Solved**: Backend fetches volces.com images and converts to base64
3. **Simplified Frontend**: No complex image conversion logic needed
4. **Share Cards Work**: Partner images display correctly in generated cards

## API Endpoints

### POST /api/analyze

Analyzes user image and generates partner prediction.

**Request:**
```json
{
  "userImageBase64": "data:image/jpeg;base64,...",
  "vibe": "gentle" | "sunny" | "intellectual" | "mysterious"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 87,
    "interpretation": "...",
    "emotionalResonance": "...",
    "communicationStyle": "...",
    "coreValues": "...",
    "partnerType": "...",
    "partnerImageBase64": "data:image/jpeg;base64,..."
  }
}
```

## Deployment

### Development

Frontend dev server proxies `/api/*` to backend (configured in `vite.config.ts`).

### Production (Nginx)

```nginx
server {
    listen 80;
    server_name destiny.app;

    # Frontend static files
    location / {
        root /var/www/destiny-match/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_read_timeout 60s;
    }
}
```

## License

MIT
