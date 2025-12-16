# Koinonia Server

Minimal WebSocket Secure (WSS) signaling server for Koinonia P2P sync.

## Overview

This documents the setup for `koinonia-server` - a separate repository containing:
- **y-webrtc signaling server** - Same as used in development
- **nginx** - Reverse proxy with SSL termination
- **certbot** - Let's Encrypt with auto-renewing certificates
- **Docker Compose** - Container orchestration

## Repository Structure

```
koinonia-server/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── signaling/
│   ├── Dockerfile
│   └── package.json
├── .env.example
└── README.md
```

## Files

### docker-compose.yml

```yaml
version: '3.8'

services:
  signaling:
    build: ./signaling
    restart: unless-stopped
    environment:
      - PORT=4444
    networks:
      - internal

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - certbot-etc:/etc/letsencrypt:ro
      - certbot-var:/var/lib/letsencrypt
      - certbot-webroot:/var/www/certbot
    depends_on:
      - signaling
    networks:
      - internal

  certbot:
    image: certbot/certbot
    restart: unless-stopped
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - certbot-webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  certbot-etc:
  certbot-var:
  certbot-webroot:

networks:
  internal:
```

### signaling/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

EXPOSE 4444

CMD ["node", "node_modules/y-webrtc/bin/server.js"]
```

### signaling/package.json

```json
{
  "name": "koinonia-signaling",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "y-webrtc": "^10.3.0"
  }
}
```

### nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS with WebSocket support
    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

        # WebSocket proxy
        location / {
            proxy_pass http://signaling:4444;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket timeouts
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }
    }
}
```

### .env.example

```bash
DOMAIN=your-domain.com
EMAIL=your-email@example.com
```

### README.md

```markdown
# Koinonia Server

WebSocket Secure signaling server for Koinonia P2P grocery list app.

## Quick Start

1. Clone this repository
2. Copy `.env.example` to `.env` and set your domain/email
3. Update `nginx/nginx.conf` with your domain
4. Get initial certificates (see below)
5. Start the server

## Initial Certificate Setup

Before starting with SSL, get your first certificate:

```bash
# Start nginx temporarily for HTTP challenge
docker compose up -d nginx

# Get certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Restart with full config
docker compose down
docker compose up -d
```

## Running

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Certificate Renewal

Certificates auto-renew via the certbot container (checks every 12 hours).

## Update Koinonia App

Update your Koinonia app settings to use this server:

```typescript
signalingServers: ['wss://your-domain.com']
```
```

## Deployment Steps

1. **Create the repository:**
   ```bash
   mkdir koinonia-server
   cd koinonia-server
   git init
   ```

2. **Create the file structure** as documented above

3. **Deploy to a VPS:**
   - Point your domain's DNS to the server IP
   - SSH into the server
   - Clone the repository
   - Follow the README instructions

4. **Update Koinonia app** to use the new signaling server:
   - Add `wss://your-domain.com` to `SettingsService.ts` production signaling servers

## Recommended Hosting

Free tier options that work well:
- **Oracle Cloud** - Always free tier with 1GB RAM
- **Hetzner** - Cheap VPS starting at ~$4/month
- **DigitalOcean** - $4/month droplet
- **Fly.io** - Free tier available

## Security Notes

- The signaling server only handles peer discovery
- No actual data passes through it
- All grocery list data is P2P via WebRTC
- SSL ensures the signaling connection is encrypted
