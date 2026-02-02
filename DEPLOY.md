# Mission Control Dashboard

A React-based Mission Control dashboard for monitoring and controlling AI agents in real-time.

## Features

- 📊 Real-time agent monitoring via WebSocket
- 🎛️ Start/stop agent controls
- 📜 Live log viewing
- 📱 Mobile-optimized responsive design
- 🔄 Auto-reconnection on disconnect

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mission-control.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: `dashboard/myapp`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   In Vercel dashboard → Project Settings → Environment Variables:
   ```
   VITE_WEBSOCKET_URL=wss://your-websocket-server.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WEBSOCKET_URL` | WebSocket server URL | `ws://localhost:8080` |

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Real-time**: WebSocket connection to agent orchestrator
- **Mobile-first**: Responsive design optimized for all screen sizes
- **State Management**: React useState/useEffect hooks

## WebSocket Protocol

### Client → Server Messages
- `start_agent`: Start an agent by ID
- `stop_agent`: Stop an agent by ID  
- `get_logs`: Request logs for an agent

### Server → Client Messages
- `initial_state`: Full state snapshot on connect
- `agent_status_update`: Individual agent status changes
- `activity_update`: New activity log entry
- `agent_logs`: Log data for requested agent

## License

MIT
