# Sentinel AI Deployment Guide

Sentinel AI is designed for robust deployment using standard infrastructure tools. You can deploy it as a monolithic application via Docker Compose, or split the frontend and backend to Edge/Serverless platforms like Vercel and Render.

---

## Option 1: Docker Compose (Monolith)

This is the easiest way to deploy the entire stack to a single VPS (e.g., DigitalOcean Droplet, AWS EC2, or Railway).

1. Clone the repository to your server.
2. Create an `.env` file at the root:
```env
JWT_SECRET=your_secure_random_string
OPENAI_API_KEY=sk-...
```
3. Run the production build:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
The frontend will be available on port `80`, the backend on `8080`, and the database on `5432`.

---

## Option 2: Serverless/Edge (Vercel + Render + Neon)

For maximum scalability, split the components across managed PaaS providers.

### 1. Database (Neon PostgreSQL)
1. Go to [Neon.tech](https://neon.tech/) and create a free Serverless Postgres database.
2. Get the connection string (e.g., `postgres://user:pass@ep-cool-db.us-east-2.aws.neon.tech/neondb`).
3. Run the migrations in `database/migrations` against this database using `psql` or a tool like DBeaver.

### 2. Backend (Render / Railway)
1. Create a new Web Service pointing to your GitHub repository.
2. Set the Root Directory to `server`.
3. Set the Build Command to `npm install`.
4. Set the Start Command to `node src/server.js`.
5. Add Environment Variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` (from Neon)
   - `JWT_SECRET` (generate a secure random string)
   - `CLIENT_URL` (the URL of your Vercel frontend, e.g., `https://sentinel-ai.vercel.app`)
   - `OPENAI_API_KEY` (Optional, for real AI generation)

### 3. Frontend (Vercel)
1. Import your GitHub repository to Vercel.
2. Set the Framework Preset to `Vite`.
3. Set the Root Directory to `client`.
4. Add the Environment Variable:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
5. Click **Deploy**.

*(Note: Vercel handles Nginx/rewrites automatically for Single Page Applications, so `nginx.conf` is not needed when using Vercel).*
