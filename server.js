const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "shop.db");
const PASSWORD = process.env.APP_PASSWORD || "";

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, name TEXT, sku TEXT, category TEXT, size TEXT, color TEXT, cost REAL, price REAL, stock INTEGER);
CREATE TABLE IF NOT EXISTS sales(id TEXT PRIMARY KEY, productId TEXT, productName TEXT, qty INTEGER, price REAL, cost REAL, date TEXT, channel TEXT, customer TEXT);
CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY, date TEXT, category TEXT, amount REAL, note TEXT);
`);

const COLS = {
  products: ["id","name","sku","category","size","color","cost","price","stock"],
  sales: ["id","productId","productName","qty","price","cost","date","channel","customer"],
  expenses: ["id","date","category","amount","note"]
};

const app = express();

// Optional password (browser login prompt). Set APP_PASSWORD env var to enable.
app.use((req, res, next) => {
  if (!PASSWORD) return next();
  const pass = Buffer.from((req.headers.authorization || "").slice(6), "base64").toString().split(":").slice(1).join(":");
  if (pass === PASSWORD) return next();
  res.set("WWW-Authenticate", 'Basic realm="Threadline"').status(401).send("Login required");
});

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/db", (req, res) => {
  res.json({
    products: db.prepare("SELECT * FROM products").all(),
    sales: db.prepare("SELECT * FROM sales").all(),
    expenses: db.prepare("SELECT * FROM expenses").all()
  });
});

const replaceAll = db.transaction(body => {
  for (const t of Object.keys(COLS)) {
    db.prepare(`DELETE FROM ${t}`).run();
    const cols = COLS[t];
    const ins = db.prepare(`INSERT INTO ${t}(${cols.join(",")}) VALUES(${cols.map(c => "@" + c).join(",")})`);
    for (const row of body[t] || []) {
      const r = {};
      cols.forEach(c => r[c] = row[c] ?? (typeof row[c] === "number" ? 0 : ""));
      ins.run(r);
    }
  }
});

app.post("/api/db", (req, res) => {
  const b = req.body;
  if (!b || !Array.isArray(b.products) || !Array.isArray(b.sales) || !Array.isArray(b.expenses))
    return res.status(400).json({ error: "Invalid payload" });
  try { replaceAll(b); res.json({ ok: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: "Save failed" }); }
});

app.listen(PORT, () => console.log(`Threadline running on http://localhost:${PORT}`));
