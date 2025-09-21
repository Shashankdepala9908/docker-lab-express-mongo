import express from "express";
import pino from "pino";
import { MongoClient } from "mongodb";
import os from "os";

const log = pino({ base: null }); // pure JSON, no pid/hostname
const app = express();
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017";
const DB_NAME = process.env.MONGO_DB || "labdb";

let db;
async function connect() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  log.info({ event: "mongo_connected", url: MONGO_URL, db: DB_NAME });
}
await connect();

// request log middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    log.info({
      event: "http_access",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      trace_id: req.header("x-trace-id") || null
    });
  });
  next();
});

app.get("/status", (req, res) => {
  log.info({ event: "status", ok: true });
  res.json({ status: "ok" });
});

app.get("/who", (req, res) => {
  const host = os.hostname();
  log.info({ event: "who", host });
  res.json({ host });
});

// TODO: add minimal validation on req.body.name (string, non-empty)
app.post("/items", async (req, res) => {
  const name = req.body?.name;
  await db.collection("items").insertOne({ name });
  res.status(201).json({ ok: true });
});

app.get("/items", async (req, res) => {
  const items = await db.collection("items").find({}).sort({ _id: 1 }).toArray();
  res.json({ items });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  log.info({ event: "listen", port: PORT });
});
