# 🚀 Flanvo Deployment Guide

Guida completa al deployment di Flanvo su diverse piattaforme.

## 📋 Indice

- [Prerequisiti](#prerequisiti)
- [Deployment su Vercel](#deployment-su-vercel)
- [Deployment su AWS](#deployment-su-aws)
- [Deployment su DigitalOcean](#deployment-su-digitalocean)
- [Deployment con Docker](#deployment-con-docker)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS](#sslhttps)
- [Monitoring](#monitoring)
- [Backup](#backup)

## ✅ Prerequisiti

Prima del deployment, assicurati di avere:

- [ ] Repository Git configurato
- [ ] Database PostgreSQL/MySQL pronto
- [ ] Account Stripe configurato
- [ ] API keys per servizi esterni (Aviation Stack, Google Maps)
- [ ] Dominio registrato (opzionale ma consigliato)
- [ ] SSL Certificate (fornito automaticamente da molti provider)

---

## 🟢 Deployment su Vercel

Vercel è la piattaforma consigliata per Next.js - deployment automatico e gratuito per progetti hobby.

### 1. Preparazione

```bash
# Assicurati che il progetto sia pronto
npm run build
npm run test
```

### 2. Deploy con Vercel CLI

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 3. Deploy da GitHub

**Metodo Consigliato** ✅

1. Push del codice su GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Vai su [vercel.com](https://vercel.com)
3. Click su "New Project"
4. Importa il repository **ls-flanvo/FLV** da GitHub
5. Configura le variabili d'ambiente
6. Click su "Deploy"

### 4. Configurazione Variabili d'Ambiente

Nel dashboard Vercel → Settings → Environment Variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/flanvo_db"

# JWT
JWT_SECRET="your-super-secret-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# APIs
AVIATION_STACK_API_KEY="your-key"
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.your-token"

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@flanvo.com"

# App
NEXT_PUBLIC_APP_URL="https://flanvo.com"
```

### 5. Database su Vercel

**Opzione A: Vercel Postgres** (Consigliato)

```bash
# Installa Vercel Postgres
vercel postgres create flanvo-db

# Collega al progetto
vercel link
```

**Opzione B: Database Esterno**

Usa Supabase, PlanetScale o Railway per il database PostgreSQL.

### 6. Configurazione Dominio

1. Dashboard Vercel → Settings → Domains
2. Aggiungi il tuo dominio
3. Configura DNS:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 7. Webhook Stripe

Dopo il deployment, configura il webhook Stripe:

```
URL: https://your-domain.com/api/webhooks/stripe
Eventi: payment_intent.succeeded, payment_intent.payment_failed
```

---

## ☁️ Deployment su AWS

### Architettura AWS

```
┌─────────────────────────────────────┐
│         CloudFront (CDN)            │
│         + SSL Certificate           │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     Elastic Load Balancer (ALB)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         ECS Fargate Cluster         │
│    (Next.js App in Container)       │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         RDS PostgreSQL              │
│         (Multi-AZ)                  │
└─────────────────────────────────────┘
```

### 1. Setup Database (RDS)

```bash
# Crea database RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier flanvo-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

### 2. Build Docker Image

```bash
# Build immagine
docker build -t flanvo:latest .

# Tag per ECR
docker tag flanvo:latest your-account-id.dkr.ecr.region.amazonaws.com/flanvo:latest

# Push su ECR
docker push your-account-id.dkr.ecr.region.amazonaws.com/flanvo:latest
```

### 3. Deploy su ECS Fargate

**task-definition.json:**

```json
{
  "family": "flanvo",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "flanvo-app",
      "image": "your-account-id.dkr.ecr.region.amazonaws.com/flanvo:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        },
        {
          "name": "JWT_SECRET",
          "value": "your-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/flanvo",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Crea task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Crea service
aws ecs create-service \
  --cluster flanvo-cluster \
  --service-name flanvo-service \
  --task-definition flanvo:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### 4. Setup CloudFront

```bash
# Crea distribuzione CloudFront
aws cloudfront create-distribution \
  --origin-domain-name your-alb.amazonaws.com \
  --default-root-object index.html
```

### 5. Costi Stimati AWS

| Servizio | Costo Mensile |
|----------|---------------|
| ECS Fargate (2 task) | ~$30 |
| RDS PostgreSQL (t3.micro) | ~$15 |
| ALB | ~$16 |
| CloudFront | ~$5-10 |
| **Totale** | **~$66-71/mese** |

---

## 🌊 Deployment su DigitalOcean

### 1. Setup Droplet

```bash
# Crea droplet
doctl compute droplet create flanvo \
  --size s-1vcpu-1gb \
  --image ubuntu-22-04-x64 \
  --region fra1 \
  --ssh-keys your-ssh-key-id

# SSH nel droplet
ssh root@your-droplet-ip
```

### 2. Installazione

```bash
# Update sistema
apt update && apt upgrade -y

# Installa Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installa PostgreSQL
apt install -y postgresql postgresql-contrib

# Installa Nginx
apt install -y nginx

# Installa PM2
npm install -g pm2
```

### 3. Setup Database

```bash
# Accedi a PostgreSQL
sudo -u postgres psql

# Crea database e utente
CREATE DATABASE flanvo_db;
CREATE USER flanvo WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE flanvo_db TO flanvo;
\q
```

### 4. Deploy App

```bash
# Clone repository
git clone https://github.com/your-username/flanvo.git
cd flanvo

# Installa dipendenze
npm install

# Crea file .env
nano .env.local
# (Incolla le variabili d'ambiente)

# Build
npm run build

# Avvia con PM2
pm2 start npm --name "flanvo" -- start

# Salva configurazione PM2
pm2 save
pm2 startup
```

### 5. Configurazione Nginx

```nginx
# /etc/nginx/sites-available/flanvo

server {
    listen 80;
    server_name flanvo.com www.flanvo.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Abilita sito
ln -s /etc/nginx/sites-available/flanvo /etc/nginx/sites-enabled/

# Test configurazione
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 6. SSL con Let's Encrypt

```bash
# Installa Certbot
apt install -y certbot python3-certbot-nginx

# Ottieni certificato SSL
certbot --nginx -d flanvo.com -d www.flanvo.com

# Auto-renewal (crontab)
crontab -e
# Aggiungi:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Costi DigitalOcean

| Piano | CPU/RAM | Storage | Costo |
|-------|---------|---------|-------|
| Basic | 1 CPU / 1GB | 25GB SSD | $6/mese |
| **General Purpose** | 2 CPU / 4GB | 80GB SSD | **$24/mese** ⭐ |
| CPU-Optimized | 2 CPU / 4GB | 50GB SSD | $42/mese |

**Database separato:**
- Managed PostgreSQL (1GB RAM): $15/mese

**Totale consigliato**: ~$39/mese

---

## 🐳 Deployment con Docker

### Dockerfile

```dockerfile
# Dockerfile

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://flanvo:password@db:5432/flanvo_db
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - AVIATION_STACK_API_KEY=${AVIATION_STACK_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=flanvo
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=flanvo_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Comandi Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f app

# Rebuild dopo modifiche
docker-compose up -d --build
```

---

## 🗄️ Database Setup

### Migrazione Produzione

```bash
# 1. Backup database locale
pg_dump flanvo_dev > backup.sql

# 2. Applica migrazioni su produzione
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 3. (Opzionale) Seed dati iniziali
DATABASE_URL="postgresql://..." npx prisma db seed
```

### Database Providers Consigliati

| Provider | Piano Free | Piano Paid | Caratteristiche |
|----------|------------|------------|-----------------|
| **Supabase** | 500MB | Da $25/mese | PostgreSQL, Real-time, Auth incluso |
| **PlanetScale** | 5GB | Da $29/mese | MySQL serverless, branching |
| **Railway** | $5 credito/mese | Da $20/mese | PostgreSQL + Redis |
| **Neon** | 3GB | Da $19/mese | PostgreSQL serverless |

---

## 🔐 Environment Variables

### Production Checklist

```bash
# Sicurezza
✅ JWT_SECRET generato con: openssl rand -base64 32
✅ Database password forte (min 16 caratteri)
✅ API keys production (non test)

# Services
✅ Stripe live keys (pk_live_, sk_live_)
✅ Email service configurato
✅ Flight API con piano adeguato
✅ Mapbox token con limiti appropriati

# App
✅ NEXT_PUBLIC_APP_URL con dominio production
✅ NODE_ENV=production
```

---

## 🔒 SSL/HTTPS

### Let's Encrypt (Gratuito)

```bash
# Con Certbot
certbot certonly --webroot -w /var/www/html -d flanvo.com -d www.flanvo.com
```

### CloudFlare (Gratuito + CDN)

1. Aggiungi dominio su CloudFlare
2. Cambia nameserver sul registrar
3. SSL/TLS → Full (strict)
4. Ottieni SSL automaticamente

---

## 📊 Monitoring

### Setup con PM2

```bash
# PM2 Monitoring
pm2 plus

# Link app
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

### Log Aggregation

**Opzioni:**
- **Logtail**: Logging semplice
- **Datadog**: Monitoring completo
- **New Relic**: APM
- **Sentry**: Error tracking

### Esempio Sentry

```bash
npm install @sentry/nextjs

# next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // Next.js config
  },
  {
    silent: true,
    org: "your-org",
    project: "flanvo"
  }
);
```

---

## 💾 Backup

### Database Backup Automatico

```bash
# Script backup (backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
FILENAME="flanvo_backup_$DATE.sql"

pg_dump $DATABASE_URL > "$BACKUP_DIR/$FILENAME"

# Upload su S3
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://flanvo-backups/

# Rimuovi backup locali vecchi (>7 giorni)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
# Cron job (ogni giorno alle 2 AM)
0 2 * * * /usr/local/bin/backup.sh
```

---

## 🎯 Performance Optimization

### Next.js Config

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Pulizia cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Database Connection Error

```bash
# Test connessione
npx prisma db pull

# Verifica variabile d'ambiente
echo $DATABASE_URL
```

### Out of Memory

```bash
# Aumenta memoria Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 📞 Support

Per problemi di deployment:
- **Email**: devops@flanvo.com
- **Docs**: https://docs.flanvo.com/deployment
- **Status**: https://status.flanvo.com

---

**Deployment Guide v1.0 - Last Updated: October 2025**