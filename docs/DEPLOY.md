# Deploying ThriftBite

Back to the [README](../README.md).

The live demo runs on free tiers: **Neon** (Postgres, Singapore), **Render** (the API in Docker, Singapore) and **Vercel** (the frontend).

1. **Neon:** create a project in the AWS Singapore region. From *Connect*, copy the Java (JDBC) URL, the user and the password.
2. **Render:** *New > Blueprint*, pick this repo. [`render.yaml`](../render.yaml) defines the service; Render asks for the database URL, user and password, an admin username and password (12+ characters), and the frontend's URL for CORS. It generates the JWT secret itself. It deploys from `main`, and only after CI passes.
3. **Vercel:** import the repo with root directory `frontend` and set `VITE_API_URL` to the Render URL (for example `https://thriftbite-api.onrender.com`).
4. Put the Vercel URL in Render's `APP_CORS_ALLOWED_ORIGINS`.

Notes on the free tiers:

- Render's free service sleeps after 15 minutes without traffic, and the first request after that takes about a minute while Java starts. An uptime monitor pinging `/actuator/health/liveness` every 10 minutes keeps it awake. That check doesn't touch the database, so Neon can still sleep.
- Neon's free compute sleeps after 5 minutes without queries. The connection pool empties when idle and the expiry job runs every 30 minutes, so a quiet demo uses few compute hours.
- Render reaches the app through Cloudflare, so `render.yaml` sets `APP_CLIENT_IP_HEADER=CF-Connecting-IP`. On another host, set it to that host's header, or every visitor shares one rate limit.
- `APP_DEMO_ENABLED=true` adds one-tap demo accounts with sample Baguio data, rebuilt every 6 hours. **A rebuild deletes every account except the admin from `APP_ADMIN_USERNAME`**, so only turn it on for a demo deployment.
