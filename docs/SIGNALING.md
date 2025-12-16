# WebRTC Signaling Server Setup

## The Problem
Public WebRTC signaling servers are unreliable and often down. The app needs a signaling server for peer discovery.

## Quick Start - Local Development

1. **Start the signaling server** (in a separate terminal):
```bash
npm run signaling
```

2. **Start the app**:
```bash
npm start
```

3. **Test with multiple tabs/browsers** - open http://localhost:5173 in multiple tabs and create/join the same list

## How It Works

- **Signaling Server**: Only used for initial peer discovery
- **Data Transfer**: Happens directly peer-to-peer via WebRTC
- **Privacy**: No actual data passes through the signaling server

## Production Deployment

See [KOINONIA_SERVER.md](KOINONIA_SERVER.md) for full Docker Compose setup with:
- nginx reverse proxy
- Let's Encrypt SSL with auto-renewal
- Same y-webrtc signaling server as development

### Quick Options

Deploy `y-webrtc` signaling server to:
- Your own VPS with Docker (recommended - see KOINONIA_SERVER.md)
- Fly.io (free tier)
- Railway (free tier)
- Render (free tier)

Then update `src/services/SettingsService.ts` production signaling servers:
```typescript
signalingServers: ['wss://your-server.com']
```

## Sources
- [y-webrtc GitHub](https://github.com/yjs/y-webrtc)
- [Building a signaling server](https://discuss.yjs.dev/t/building-a-signaling-server-using-y-webrtc/870)
- [Public servers discussion](https://github.com/yjs/y-webrtc/issues/43)
