# Docker Basics Lab — Node.js + Express + MongoDB

A minimal Express API containerized with Docker. Provisioned with Docker Compose alongside MongoDB on a **private network** with a **named volume**. Includes structured JSON logs with `pino`, a liveness endpoint, and a simple `items` collection to demonstrate **persistence**. Supports **horizontal scaling**.

---

## Tech & Tools
- Node.js 20 (Alpine base)
- Express 4.19
- MongoDB driver 6.x
- Pino logger 9.x (structured JSON logs)
- Docker Desktop (Linux engine) + Docker Compose v2
- MongoDB 7

---


---

## Quick Start

> **Windows PowerShell-friendly commands shown.** If `:8080` is busy, change host mapping to `8081:8080` in compose.

```powershell
# 0) From repo root
docker compose up -d --build
docker compose ps

# 1) Liveness
Invoke-WebRequest http://localhost:8080/status | Select-Object -Expand Content
# expected: {"status":"ok"}

# 2) Logs (structured JSON)
docker compose logs -f api

#Endpoints

GET /status – liveness check → {"status":"ok"}

GET /who – shows the container hostname (for scale demo) → {"host":"api-1"...}

POST /items – create an item
Body: {"name":"first item"}

GET /items – list items → {"items":[{"_id":"...","name":"..."}]}

# Create an item
Invoke-RestMethod -Method Post -Uri http://localhost:8080/items `
  -Body (@{name="first item"} | ConvertTo-Json) `
  -ContentType "application/json"

# List items
Invoke-WebRequest http://localhost:8080/items | Select-Object -Expand Content

#logs
docker compose logs -f api

#Persistent
# Insert via API
Invoke-RestMethod -Method Post -Uri http://localhost:8080/items `
  -Body (@{name="persist-demo"} | ConvertTo-Json) `
  -ContentType "application/json"

# Verify via mongo shell inside container
docker compose exec mongo mongosh --eval "db.getSiblingDB('labdb').items.find().toArray()"

# Restart DB, verify item still there
docker compose restart mongo
docker compose exec mongo mongosh --eval "db.getSiblingDB('labdb').items.find().toArray()"
docker compose down
docker compose up -d
docker compose exec mongo mongosh --eval "db.getSiblingDB('labdb').items.find().toArray()"
docker compose down -v

#Scaling
# Scale API replicas
docker compose up -d --scale api=3
docker compose ps

# Hit identity multiple times (different replicas respond)
for ($i=0; $i -lt 6; $i++) { Invoke-WebRequest http://localhost:8080/who | Select-Object -Expand Content }

# Tail logs
docker compose logs -f api

# Scale back down
docker compose up -d --scale api=1

