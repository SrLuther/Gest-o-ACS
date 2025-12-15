const path = require("path");
const fs = require("fs");
const usePg = !!process.env.DATABASE_URL;
let pool = null;
let sqlite = null;

if (usePg) {
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  const sqlite3 = require("sqlite3").verbose();
  const dbPath = process.env.DB_PATH || path.join(__dirname, "database", "acs_gestao_geral.db");
  try { fs.mkdirSync(path.dirname(dbPath), { recursive: true }); } catch {}
  sqlite = new sqlite3.Database(dbPath);
}

function run(sql, params, cb) {
  if (!usePg) return sqlite.run(sql, params, cb);
  let text = sql;
  const needsReturning = /^insert\s+/i.test(text) && !/returning\s+/i.test(text);
  if (needsReturning) text = text.replace(/;?\s*$/," RETURNING id");
  pool.query(text, params)
    .then((res) => {
      const id = res.rows && res.rows[0] && res.rows[0].id;
      if (typeof cb === "function") cb.call({ lastID: id }, null);
    })
    .catch((err) => {
      if (typeof cb === "function") cb(err);
    });
}
function get(sql, params, cb) {
  if (!usePg) return sqlite.get(sql, params, cb);
  pool.query(sql, params)
    .then((res) => cb(null, res.rows[0] || null))
    .catch((err) => cb(err));
}
function all(sql, params, cb) {
  if (!usePg) return sqlite.all(sql, params, cb);
  pool.query(sql, params)
    .then((res) => cb(null, res.rows || []))
    .catch((err) => cb(err));
}
function exec(sql, cb) {
  if (!usePg) return sqlite.exec(sql, cb);
  const parts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  (async () => {
    try {
      for (const p of parts) {
        await pool.query(p);
      }
      cb && cb(null);
    } catch (e) {
      cb && cb(e);
    }
  })();
}

module.exports = { run, get, all, exec };
