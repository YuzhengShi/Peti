#!/bin/bash
set -euo pipefail
exec > /var/log/peti-setup.log 2>&1

# ── System packages ──
dnf update -y
dnf install -y docker git nginx postgresql16-server postgresql16

# ── PostgreSQL ──
postgresql-setup --initdb
systemctl enable postgresql --now

sudo -u postgres psql -c "CREATE USER peti WITH PASSWORD '${postgres_password}';"
sudo -u postgres psql -c "CREATE DATABASE peti OWNER peti;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE peti TO peti;"

# Allow password auth for local connections
sed -i 's/ident$/md5/' /var/lib/pgsql/data/pg_hba.conf
sed -i 's/peer$/md5/' /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

# ── Node.js 20 ──
dnf install -y nodejs20 npm

# ── Clone repo ──
cd /opt
git clone https://github.com/YuzhengShi/Peti.git peti || true
cd /opt/peti

# ── API setup ──
cd /opt/peti/api
npm install

cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://peti:${postgres_password}@localhost:5432/peti
JWT_SECRET=${jwt_secret}
OPENWEATHERMAP_API_KEY=${openweathermap_api_key}
FRONTEND_URL=http://localhost
PORT=3001
NODE_ENV=production
ENVEOF

npx prisma generate
npx prisma migrate deploy
npx prisma db seed || true
npm run build

# ── Client build ──
cd /opt/peti/client
npm install
npm run build

# ── Nginx config ──
cat > /etc/nginx/conf.d/peti.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Client static files
    root /opt/peti/client/dist;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Remove default nginx config if it conflicts
rm -f /etc/nginx/conf.d/default.conf

systemctl enable nginx --now

# ── Systemd service for API ──
cat > /etc/systemd/system/peti-api.service << 'SVCEOF'
[Unit]
Description=Peti API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/peti/api
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=/opt/peti/api/.env

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable peti-api --now

echo "=== Peti deployment complete ==="
