const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true
  })
);

// db is imported from ./db adapter (supports sqlite or Postgres via Supabase)

const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const jwtExpires = "2h";

function runMigrations() {
  const isPg = !!process.env.DATABASE_URL;
  db.exec(`
    ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
  `, () => {});
  db.exec(`
    ALTER TABLE users ADD COLUMN lock_until TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE users ADD COLUMN last_access_at TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE microareas ADD COLUMN cnes TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE microareas ADD COLUMN ine TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE appointments ADD COLUMN full_name TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE appointments ADD COLUMN cpf TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE appointments ADD COLUMN sus_card TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE appointments ADD COLUMN request_type TEXT;
  `, () => {});
  db.exec(`
    ALTER TABLE appointments ADD COLUMN turn TEXT;
  `, () => {});
  if (isPg) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS children (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, sus_card TEXT, cpf TEXT, birth_date TEXT NOT NULL, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS vitamin_doses (id SERIAL PRIMARY KEY, child_id INTEGER NOT NULL, vitamin_type TEXT NOT NULL, dose_number INTEGER NOT NULL, administered_at TEXT NOT NULL, acs_user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS vitamin_monthly_control (id SERIAL PRIMARY KEY, microarea_id INTEGER NOT NULL, month TEXT NOT NULL, vitamin_type TEXT NOT NULL, saldo_anterior INTEGER NOT NULL DEFAULT 0, administradas INTEGER NOT NULL DEFAULT 0, perdas INTEGER NOT NULL DEFAULT 0, solicitacao_proximo_mes INTEGER NOT NULL DEFAULT 0, estoque_atual INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vit_monthly_unique ON vitamin_monthly_control(microarea_id, month, vitamin_type);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS deaths (id SERIAL PRIMARY KEY, date TEXT NOT NULL, name TEXT NOT NULL, mother_name TEXT NOT NULL, address TEXT, municipality TEXT, sex TEXT, age INTEGER, place TEXT, do_number TEXT, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS births (id SERIAL PRIMARY KEY, mother_name TEXT NOT NULL, address TEXT, residence_municipality TEXT, sex TEXT, weight_kg DOUBLE PRECISION, birth_date TEXT NOT NULL, delivery_type TEXT, occurrence_municipality TEXT, registered TEXT, child_sus_card TEXT, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS weekly_slots (id SERIAL PRIMARY KEY, microarea_id INTEGER NOT NULL, week_start TEXT NOT NULL, tipo TEXT NOT NULL, limit INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_slots_unique ON weekly_slots(microarea_id, week_start, tipo);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_extra_slots (id SERIAL PRIMARY KEY, microarea_id INTEGER NOT NULL, week_start TEXT NOT NULL, tipo TEXT NOT NULL, extra INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, login_at TEXT NOT NULL, ip TEXT);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS consents (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, accepted_at TEXT NOT NULL, policy_version TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_resets (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, token TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_fixed_schedule (id SERIAL PRIMARY KEY, microarea_id INTEGER NOT NULL, day_of_week INTEGER NOT NULL, turn TEXT NOT NULL, tipo TEXT NOT NULL, vagas_limitadas INTEGER NOT NULL DEFAULT 0, vagas INTEGER, active INTEGER NOT NULL DEFAULT 1, responsavel TEXT, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_limits (id SERIAL PRIMARY KEY, microarea_id INTEGER NOT NULL, tipo TEXT NOT NULL, period TEXT NOT NULL, limit INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    `, () => {});
  } else {
    db.exec(`
      CREATE TABLE IF NOT EXISTS children (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, sus_card TEXT, cpf TEXT, birth_date TEXT NOT NULL, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS vitamin_doses (id INTEGER PRIMARY KEY AUTOINCREMENT, child_id INTEGER NOT NULL, vitamin_type TEXT NOT NULL, dose_number INTEGER NOT NULL, administered_at TEXT NOT NULL, acs_user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS vitamin_monthly_control (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, month TEXT NOT NULL, vitamin_type TEXT NOT NULL, saldo_anterior INTEGER NOT NULL DEFAULT 0, administradas INTEGER NOT NULL DEFAULT 0, perdas INTEGER NOT NULL DEFAULT 0, solicitacao_proximo_mes INTEGER NOT NULL DEFAULT 0, estoque_atual INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, UNIQUE(microarea_id, month, vitamin_type));
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS deaths (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, name TEXT NOT NULL, mother_name TEXT NOT NULL, address TEXT, municipality TEXT, sex TEXT, age INTEGER, place TEXT, do_number TEXT, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS births (id INTEGER PRIMARY KEY AUTOINCREMENT, mother_name TEXT NOT NULL, address TEXT, residence_municipality TEXT, sex TEXT, weight_kg REAL, birth_date TEXT NOT NULL, delivery_type TEXT, occurrence_municipality TEXT, registered TEXT, child_sus_card TEXT, microarea_id INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS weekly_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, week_start TEXT NOT NULL, tipo TEXT NOT NULL, limit INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(microarea_id, week_start, tipo));
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_extra_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, week_start TEXT NOT NULL, tipo TEXT NOT NULL, extra INTEGER NOT NULL, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, login_at TEXT NOT NULL, ip TEXT);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS consents (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, accepted_at TEXT NOT NULL, policy_version TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_fixed_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, day_of_week INTEGER NOT NULL, turn TEXT NOT NULL, tipo TEXT NOT NULL, vagas_limitadas INTEGER NOT NULL DEFAULT 0, vagas INTEGER, active INTEGER NOT NULL DEFAULT 1, responsavel TEXT, created_at TEXT NOT NULL);
    `, () => {});
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_limits (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, tipo TEXT NOT NULL, period TEXT NOT NULL, limit INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    `, () => {});
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_limits_unique ON activity_limits(microarea_id, tipo, period);
  `, () => {});
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_extra_turn_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, week_start TEXT NOT NULL, day_of_week INTEGER NOT NULL, turn TEXT NOT NULL, tipo TEXT NOT NULL, extra INTEGER NOT NULL, created_at TEXT NOT NULL);
  `, () => {});
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, microarea_id INTEGER NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, unread INTEGER NOT NULL DEFAULT 1);
  `, () => {});
  db.exec(`
    ALTER TABLE microareas ADD COLUMN identifier TEXT;
  `, () => {});
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_microareas_identifier ON microareas(identifier);
  `, () => {});
}
runMigrations();

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "token_required" });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: "invalid_token" });
  }
}

function authorizeRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}

function authorizeMicroareaAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  if (req.user.role === "admin") return next();
  const requestedMicroareaId = Number(req.query.microarea_id || req.body.microarea_id || req.user.microarea_id);
  if (requestedMicroareaId !== req.user.microarea_id) {
    return res.status(403).json({ error: "microarea_forbidden" });
  }
  next();
}

app.post("/auth/login", (req, res) => {
  const { professionalId, microarea, password, consent } = req.body || {};
  if (!professionalId || !microarea || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }
  db.get(
    `SELECT u.id, u.password_hash, u.role, u.professional_id, u.microarea_id, u.failed_attempts, u.lock_until, m.name AS microarea_name
     FROM users u
     JOIN microareas m ON u.microarea_id = m.id
     WHERE u.professional_id = ?`,
    [professionalId],
    (err, row) => {
      if (err) return res.status(500).json({ error: "db_error" });
      if (!row) return res.status(401).json({ error: "invalid_credentials" });
      if (row.lock_until && Date.now() < Date.parse(row.lock_until)) return res.status(423).json({ error: "locked" });
      const microareaMatch = String(row.microarea_name).toLowerCase() === String(microarea).toLowerCase();
      if (!microareaMatch) return res.status(401).json({ error: "invalid_microarea" });
      const ok = bcrypt.compareSync(password, row.password_hash);
      if (!ok) {
        const fails = (row.failed_attempts || 0) + 1;
        let lockUntil = null;
        if (fails >= 5) lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.run(`UPDATE users SET failed_attempts = ?, lock_until = ? WHERE id = ?`, [fails, lockUntil, row.id]);
        return res.status(lockUntil ? 423 : 401).json({ error: lockUntil ? "locked" : "invalid_credentials" });
      }
      db.run(`UPDATE users SET failed_attempts = 0, lock_until = NULL, last_access_at = datetime('now') WHERE id = ?`, [row.id]);
      if (consent) {
        db.run(`INSERT INTO consents (user_id, accepted_at, policy_version) VALUES (?, datetime('now'), ?)`, [row.id, "v1"]);
      }
      db.run(`INSERT INTO user_sessions (user_id, login_at, ip) VALUES (?, datetime('now'), ?)`, [row.id, (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")]);
      const payload = { id: row.id, role: row.role, microarea_id: row.microarea_id, professional_id: row.professional_id };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpires });
      res.json({ token, user: payload });
    }
  );
});

app.get("/agenda/weekly", authenticateToken, (req, res) => {
  db.all(
    `SELECT id, day_of_week, start_time, end_time, description FROM weekly_agenda ORDER BY day_of_week, start_time`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json(rows || []);
    }
  );
});
app.get("/", (req, res) => {
  res.status(200).send("ACS Backend OK");
});
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function weekStart(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const start = new Date(d.getTime() - diff * 24 * 3600 * 1000);
  return start.toISOString().slice(0, 10);
}
function microPrefix(name) {
  const letters = String(name || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").toUpperCase();
  const ascii = letters.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const pref = (ascii.slice(0, 2) || "XX").padEnd(2, "X");
  return pref;
}
function nextMicroIdentifier(prefix, cb) {
  db.get(`SELECT MAX(CAST(SUBSTR(identifier,3,3) AS INTEGER)) AS maxseq FROM microareas WHERE identifier LIKE ?`, [prefix + "%"], (e, r) => {
    if (e) return cb(e);
    const seq = (r && r.maxseq ? Number(r.maxseq) : 0) + 1;
    const ident = prefix + String(seq).padStart(3, "0");
    cb(null, ident);
  });
}

app.get("/appointments", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT a.id, a.date, a.time, a.subject, a.notes, a.full_name, a.cpf, a.sus_card, a.request_type, a.microarea_id, a.acs_user_id
             FROM appointments a`;
  if (!isAdmin) {
    sql += ` WHERE a.microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  sql += ` ORDER BY a.date, a.time`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/appointments", authenticateToken, authorizeRoles(["acs"]), (req, res) => {
  const { date, time, subject, notes, full_name, cpf, sus_card, request_type, turn } = req.body || {};
  if (!date || !time || !subject || !full_name || !request_type || !turn) return res.status(400).json({ error: "missing_fields" });
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / (24 * 3600 * 1000));
  if (diffDays < 0 || diffDays > 14) return res.status(400).json({ error: "date_out_of_range" });
  const microareaId = req.user.microarea_id;
  const acsUserId = req.user.id;
  const wk = weekStart(date);
  const dow = new Date(date + "T00:00:00").getUTCDay();
  function monthBounds(dateStr) {
    const base = new Date(dateStr + "T00:00:00");
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }
  function enforceActivityLimits(callback) {
    db.all(`SELECT tipo, period, limit, active FROM activity_limits WHERE microarea_id = ? AND tipo = ? AND active = 1`, [microareaId, request_type], (limErr, limits) => {
      if (limErr) return res.status(500).json({ error: "db_error" });
      if (!limits || !limits.length) return callback();
      let remainingChecks = limits.length;
      for (const lim of limits) {
        if (lim.period === "semanal") {
          db.get(`SELECT COALESCE(SUM(1),0) AS cnt FROM appointments WHERE microarea_id = ? AND request_type = ? AND date BETWEEN ? AND date(?,'+6 day')`, [microareaId, request_type, wk, wk], (cErr, cRow) => {
            if (cErr) return res.status(500).json({ error: "db_error" });
            if ((cRow ? cRow.cnt : 0) >= lim.limit) return res.status(400).json({ error: "limit_period_reached", period: "semanal" });
            remainingChecks -= 1;
            if (remainingChecks === 0) callback();
          });
        } else if (lim.period === "mensal") {
          const [mStart, mEnd] = monthBounds(date);
          db.get(`SELECT COALESCE(SUM(1),0) AS cnt FROM appointments WHERE microarea_id = ? AND request_type = ? AND date BETWEEN ? AND ?`, [microareaId, request_type, mStart, mEnd], (cErr, cRow) => {
            if (cErr) return res.status(500).json({ error: "db_error" });
            if ((cRow ? cRow.cnt : 0) >= lim.limit) return res.status(400).json({ error: "limit_period_reached", period: "mensal" });
            remainingChecks -= 1;
            if (remainingChecks === 0) callback();
          });
        } else {
          remainingChecks -= 1;
          if (remainingChecks === 0) callback();
        }
      }
    });
  }
  db.get(`SELECT vagas_limitadas, vagas, active FROM team_fixed_schedule WHERE microarea_id = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [microareaId, dow, turn, request_type], (cfgErr, cfg) => {
    if (cfgErr) return res.status(500).json({ error: "db_error" });
    if (!cfg || !cfg.active) return res.status(400).json({ error: "turno_inativo" });
    if (request_type === "hipertensao" || request_type === "diabetes") {
      db.get(`SELECT COALESCE(SUM(1),0) AS count FROM appointments WHERE acs_user_id = ? AND request_type = ? AND date BETWEEN ? AND date(?,'+6 day')`, [acsUserId, request_type, wk, wk], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        const current = row ? row.count : 0;
        db.get(`SELECT limit FROM weekly_slots WHERE microarea_id = ? AND week_start = ? AND tipo = ?`, [microareaId, wk, request_type], (err2, sl) => {
          if (err2) return res.status(500).json({ error: "db_error" });
          const baseLimit = sl ? sl.limit : 2;
          db.get(`SELECT COALESCE(SUM(extra),0) AS extra FROM admin_extra_slots WHERE microarea_id = ? AND week_start = ? AND tipo = ?`, [microareaId, wk, request_type], (err3, ex) => {
            if (err3) return res.status(500).json({ error: "db_error" });
            const allowed = baseLimit + (ex ? ex.extra : 0);
            if (current >= allowed) return res.status(400).json({ error: "limit_reached" });
            if (cfg.vagas_limitadas) {
              db.get(`SELECT COALESCE(SUM(1),0) AS count FROM appointments WHERE microarea_id = ? AND date = ? AND request_type = ? AND turn = ?`, [microareaId, date, request_type, turn], (ccErr, ccRow) => {
                if (ccErr) return res.status(500).json({ error: "db_error" });
                db.get(`SELECT COALESCE(SUM(extra),0) AS extra FROM admin_extra_turn_slots WHERE microarea_id = ? AND week_start = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [microareaId, wk, dow, turn, request_type], (ee, eeRow) => {
                  const allowedTurn = (cfg.vagas || 0) + (eeRow ? eeRow.extra : 0);
                  if ((ccRow ? ccRow.count : 0) >= allowedTurn) return res.status(400).json({ error: "turn_full" });
                  enforceActivityLimits(() => {
                    db.run(
                      `INSERT INTO appointments (date, time, subject, notes, full_name, cpf, sus_card, request_type, turn, microarea_id, acs_user_id, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                      [date, time, subject, notes || "", full_name, cpf || "", sus_card || "", request_type, turn, microareaId, acsUserId],
                      function (err4) {
                        if (err4) return res.status(500).json({ error: "db_error" });
                        res.status(201).json({ id: this.lastID });
                      }
                    );
                  });
                });
              });
            } else {
              enforceActivityLimits(() => {
                db.run(
                  `INSERT INTO appointments (date, time, subject, notes, full_name, cpf, sus_card, request_type, turn, microarea_id, acs_user_id, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                  [date, time, subject, notes || "", full_name, cpf || "", sus_card || "", request_type, turn, microareaId, acsUserId],
                  function (err4) {
                    if (err4) return res.status(500).json({ error: "db_error" });
                    res.status(201).json({ id: this.lastID });
                  }
                );
              });
            }
          });
        });
      });
    } else {
      if (cfg.vagas_limitadas) {
        db.get(`SELECT COALESCE(SUM(1),0) AS count FROM appointments WHERE microarea_id = ? AND date = ? AND request_type = ? AND turn = ?`, [microareaId, date, request_type, turn], (ccErr, ccRow) => {
          if (ccErr) return res.status(500).json({ error: "db_error" });
          db.get(`SELECT COALESCE(SUM(extra),0) AS extra FROM admin_extra_turn_slots WHERE microarea_id = ? AND week_start = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [microareaId, wk, dow, turn, request_type], (ee, eeRow) => {
            const allowedTurn = (cfg.vagas || 0) + (eeRow ? eeRow.extra : 0);
            if ((ccRow ? ccRow.count : 0) >= allowedTurn) return res.status(400).json({ error: "turn_full" });
            enforceActivityLimits(() => {
              db.run(
                `INSERT INTO appointments (date, time, subject, notes, full_name, cpf, sus_card, request_type, turn, microarea_id, acs_user_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [date, time, subject, notes || "", full_name, cpf || "", sus_card || "", request_type, turn, microareaId, acsUserId],
                function (err) {
                  if (err) return res.status(500).json({ error: "db_error" });
                  res.status(201).json({ id: this.lastID });
                }
              );
            });
          });
        });
      } else {
        enforceActivityLimits(() => {
          db.run(
            `INSERT INTO appointments (date, time, subject, notes, full_name, cpf, sus_card, request_type, turn, microarea_id, acs_user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [date, time, subject, notes || "", full_name, cpf || "", sus_card || "", request_type, turn, microareaId, acsUserId],
            function (err) {
              if (err) return res.status(500).json({ error: "db_error" });
              res.status(201).json({ id: this.lastID });
            }
          );
        });
      }
    }
  });
});

app.post("/admin/weekly-slots", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { microarea_id, week_start, tipo, limit } = req.body || {};
  if (!microarea_id || !week_start || !tipo || typeof limit !== "number") return res.status(400).json({ error: "missing_fields" });
  db.run(
    `INSERT INTO weekly_slots (microarea_id, week_start, tipo, limit, created_at) VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(microarea_id, week_start, tipo) DO UPDATE SET limit = excluded.limit`,
    [microarea_id, week_start, tipo, limit],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });
      db.run(`INSERT INTO notifications (microarea_id, message, created_at) VALUES (?, ?, datetime('now'))`, [microarea_id, `Admin atualizou limite semanal para ${tipo} na semana ${week_start}`], () => {
        res.json({ ok: true });
      });
    }
  );
});

app.post("/admin/extra-slots", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { microarea_id, week_start, tipo, extra } = req.body || {};
  if (!microarea_id || !week_start || !tipo || typeof extra !== "number") return res.status(400).json({ error: "missing_fields" });
  db.run(`INSERT INTO admin_extra_slots (microarea_id, week_start, tipo, extra, created_at) VALUES (?, ?, ?, ?, datetime('now'))`, [microarea_id, week_start, tipo, extra], function (err) {
    if (err) return res.status(500).json({ error: "db_error" });
    db.run(`INSERT INTO notifications (microarea_id, message, created_at) VALUES (?, ?, datetime('now'))`, [microarea_id, `Admin liberou vagas extras (${extra}) para ${tipo} na semana ${week_start}`], () => {
      res.json({ ok: true });
    });
  });
});

app.get("/dashboard", authenticateToken, (req, res) => {
  const wk = weekStart(new Date().toISOString().slice(0, 10));
  const params = req.user.role === "admin" ? [] : [req.user.microarea_id];
  const areaFilter = req.user.role === "admin" ? "" : " WHERE microarea_id = ?";
  db.serialize(() => {
    db.get(`SELECT COUNT(1) AS appt FROM appointments${areaFilter} AND date BETWEEN ? AND date(?,'+6 day')`.replace("appointments WHERE", "appointments WHERE"), params.concat([wk, wk]), (e1, r1) => {
      if (e1) return res.status(500).json({ error: "db_error" });
      db.get(`SELECT COUNT(1) AS doses FROM vitamin_doses`, [], (e2, r2) => {
        if (e2) return res.status(500).json({ error: "db_error" });
        db.get(`SELECT COUNT(1) AS deaths FROM deaths${areaFilter}`, params, (e3, r3) => {
          if (e3) return res.status(500).json({ error: "db_error" });
          db.get(`SELECT COUNT(1) AS births FROM births${areaFilter}`, params, (e4, r4) => {
            if (e4) return res.status(500).json({ error: "db_error" });
            res.json({ appointments: r1 ? r1.appt : 0, doses: r2 ? r2.doses : 0, deaths: r3 ? r3.deaths : 0, births: r4 ? r4.births : 0 });
          });
        });
      });
    });
  });
});

app.post("/profile/save", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { name, microarea_id, sus_card, cnes, ine } = req.body || {};
  if (!name || !microarea_id) return res.status(400).json({ error: "missing_fields" });
  const targetUserId = req.user.role === "admin" ? (req.body.user_id || req.user.id) : req.user.id;
  db.run(`UPDATE users SET name = ? WHERE id = ?`, [name, targetUserId], function (e1) {
    if (e1) return res.status(500).json({ error: "db_error" });
    db.run(`UPDATE microareas SET cnes = COALESCE(?, cnes), ine = COALESCE(?, ine) WHERE id = ?`, [cnes || null, ine || null, microarea_id], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true });
    });
  });
});

app.get("/profile/me", authenticateToken, (req, res) => {
  db.get(`SELECT u.id, u.name, u.professional_id, u.role, u.microarea_id, u.last_access_at, m.cnes, m.ine FROM users u JOIN microareas m ON u.microarea_id = m.id WHERE u.id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: "db_error" });
    res.json(row || {});
  });
});

app.post("/auth/request-reset", (req, res) => {
  const { professionalId } = req.body || {};
  if (!professionalId) return res.status(400).json({ error: "missing_fields" });
  db.get(`SELECT id FROM users WHERE professional_id = ?`, [professionalId], (e, u) => {
    if (e) return res.status(500).json({ error: "db_error" });
    if (!u) return res.status(404).json({ error: "not_found" });
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const exp = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.run(`INSERT INTO password_resets (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))`, [u.id, token, exp], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true, token });
    });
  });
});

app.post("/auth/reset", (req, res) => {
  const { token, new_password } = req.body || {};
  if (!token || !new_password) return res.status(400).json({ error: "missing_fields" });
  db.get(`SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?`, [token], (e, r) => {
    if (e) return res.status(500).json({ error: "db_error" });
    if (!r || r.used) return res.status(400).json({ error: "invalid_token" });
    if (Date.now() > Date.parse(r.expires_at)) return res.status(400).json({ error: "expired_token" });
    const hash = bcrypt.hashSync(new_password, 10);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, r.user_id], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      db.run(`UPDATE password_resets SET used = 1 WHERE id = ?`, [r.id], function (e3) {
        if (e3) return res.status(500).json({ error: "db_error" });
        res.json({ ok: true });
      });
    });
  });
});

app.get("/vitamina/children", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT id, full_name, sus_card, cpf, birth_date, microarea_id FROM children`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/vitamina/children", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { full_name, sus_card, cpf, birth_date, microarea_id } = req.body || {};
  if (!full_name || !birth_date || !microarea_id) return res.status(400).json({ error: "missing_fields" });
  if (req.user.role !== "admin" && microarea_id !== req.user.microarea_id) return res.status(403).json({ error: "microarea_forbidden" });
  db.run(`INSERT INTO children (full_name, sus_card, cpf, birth_date, microarea_id, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`, [full_name, sus_card || "", cpf || "", birth_date, microarea_id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.status(201).json({ id: this.lastID });
  });
});

app.get("/vitamina/doses", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT vd.id, vd.child_id, c.full_name, c.birth_date, vd.vitamin_type, vd.dose_number, vd.administered_at FROM vitamin_doses vd JOIN children c ON vd.child_id = c.id`;
  if (!isAdmin) {
    sql += ` WHERE c.microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/vitamina/doses", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { child_id, vitamin_type, dose_number, administered_at } = req.body || {};
  if (!child_id || !vitamin_type || !dose_number || !administered_at) return res.status(400).json({ error: "missing_fields" });
  db.get(`SELECT birth_date, microarea_id FROM children WHERE id = ?`, [child_id], (e, c) => {
    if (e) return res.status(500).json({ error: "db_error" });
    if (!c) return res.status(404).json({ error: "not_found" });
    if (req.user.role !== "admin" && c.microarea_id !== req.user.microarea_id) return res.status(403).json({ error: "microarea_forbidden" });
    const ageMonths = Math.floor((Date.parse(administered_at) - Date.parse(c.birth_date)) / (30 * 24 * 3600 * 1000));
    if (vitamin_type === "200000" && ageMonths < 6) return res.status(400).json({ error: "dose_incompatible" });
    db.run(`INSERT INTO vitamin_doses (child_id, vitamin_type, dose_number, administered_at, acs_user_id, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`, [child_id, vitamin_type, dose_number, administered_at, req.user.id], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.status(201).json({ id: this.lastID });
    });
  });
});

app.get("/vitamina/mensal", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT id, microarea_id, month, vitamin_type, saldo_anterior, administradas, perdas, solicitacao_proximo_mes, estoque_atual FROM vitamin_monthly_control`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/vitamina/mensal", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { microarea_id, month, vitamin_type, saldo_anterior, administradas, perdas, solicitacao_proximo_mes } = req.body || {};
  if (!microarea_id || !month || !vitamin_type) return res.status(400).json({ error: "missing_fields" });
  if (req.user.role !== "admin" && microarea_id !== req.user.microarea_id) return res.status(403).json({ error: "microarea_forbidden" });
  const estoque = (saldo_anterior || 0) - (administradas || 0) - (perdas || 0);
  if (estoque < 0) return res.status(400).json({ error: "estoque_negativo" });
  db.run(
    `INSERT INTO vitamin_monthly_control (microarea_id, month, vitamin_type, saldo_anterior, administradas, perdas, solicitacao_proximo_mes, estoque_atual, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(microarea_id, month, vitamin_type) DO UPDATE SET saldo_anterior=excluded.saldo_anterior, administradas=excluded.administradas, perdas=excluded.perdas, solicitacao_proximo_mes=excluded.solicitacao_proximo_mes, estoque_atual=excluded.estoque_atual`,
    [microarea_id, month, vitamin_type, saldo_anterior || 0, administradas || 0, perdas || 0, solicitacao_proximo_mes || 0, estoque],
    function (e) {
      if (e) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true });
    }
  );
});

app.get("/deaths", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT * FROM deaths`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/deaths", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { date, name, mother_name, address, municipality, sex, age, place, do_number, microarea_id } = req.body || {};
  if (!date || !name || !mother_name || !sex || !place || !microarea_id) return res.status(400).json({ error: "missing_fields" });
  if (req.user.role !== "admin" && microarea_id !== req.user.microarea_id) return res.status(403).json({ error: "microarea_forbidden" });
  db.run(`INSERT INTO deaths (date, name, mother_name, address, municipality, sex, age, place, do_number, microarea_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`, [date, name, mother_name, address || "", municipality || "", sex, age || null, place, do_number || "", microarea_id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.status(201).json({ id: this.lastID });
  });
});

app.get("/deaths/export.csv", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  db.all(`SELECT * FROM deaths ORDER BY date DESC`, [], (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    const header = Object.keys(rows[0] || { id: "", date: "", name: "" }).join(",");
    const lines = rows.map(r => Object.values(r).map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=deaths.csv");
    res.send([header].concat(lines).join("\n"));
  });
});

app.get("/births", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT * FROM births`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});

app.post("/births", authenticateToken, authorizeRoles(["acs","admin"]), (req, res) => {
  const { mother_name, address, residence_municipality, sex, weight_kg, birth_date, delivery_type, occurrence_municipality, registered, child_sus_card, microarea_id } = req.body || {};
  if (!mother_name || !sex || !birth_date || !delivery_type || !microarea_id) return res.status(400).json({ error: "missing_fields" });
  if (req.user.role !== "admin" && microarea_id !== req.user.microarea_id) return res.status(403).json({ error: "microarea_forbidden" });
  if (typeof weight_kg === "number" && (weight_kg < 0.5 || weight_kg > 6)) return res.status(400).json({ error: "peso_invalido" });
  db.run(`INSERT INTO births (mother_name, address, residence_municipality, sex, weight_kg, birth_date, delivery_type, occurrence_municipality, registered, child_sus_card, microarea_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`, [mother_name, address || "", residence_municipality || "", sex, weight_kg || null, birth_date, delivery_type, occurrence_municipality || "", registered || "nao", child_sus_card || "", microarea_id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.status(201).json({ id: this.lastID });
  });
});

app.get("/births/export.csv", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  db.all(`SELECT * FROM births ORDER BY birth_date DESC`, [], (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    const header = Object.keys(rows[0] || { id: "", birth_date: "", mother_name: "" }).join(",");
    const lines = rows.map(r => Object.values(r).map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=births.csv");
    res.send([header].concat(lines).join("\n"));
  });
});
app.get("/schedule/fixed", authenticateToken, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT * FROM team_fixed_schedule`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});
app.post("/schedule/fixed", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { microarea_id, day_of_week, turn, tipo, vagas_limitadas, vagas, active, responsavel } = req.body || {};
  if (microarea_id == null || day_of_week == null || !turn || !tipo) return res.status(400).json({ error: "missing_fields" });
  db.run(`INSERT INTO team_fixed_schedule (microarea_id, day_of_week, turn, tipo, vagas_limitadas, vagas, active, responsavel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`, [microarea_id, day_of_week, turn, tipo, vagas_limitadas ? 1 : 0, vagas || null, active ? 1 : 1, responsavel || ""], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    db.run(`INSERT INTO notifications (microarea_id, message, created_at) VALUES (?, ?, datetime('now'))`, [microarea_id, `Admin configurou agenda fixa: ${tipo} (${turn}) no dia ${day_of_week}`], () => {
      res.status(201).json({ id: this.lastID });
    });
  });
});
app.put("/schedule/fixed/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const { vagas_limitadas, vagas, active, responsavel } = req.body || {};
  db.run(`UPDATE team_fixed_schedule SET vagas_limitadas = COALESCE(?, vagas_limitadas), vagas = COALESCE(?, vagas), active = COALESCE(?, active), responsavel = COALESCE(?, responsavel) WHERE id = ?`, [typeof vagas_limitadas === "boolean" ? (vagas_limitadas ? 1 : 0) : null, typeof vagas === "number" ? vagas : null, typeof active === "boolean" ? (active ? 1 : 0) : null, typeof responsavel === "string" ? responsavel : null, id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    db.get(`SELECT microarea_id, tipo, turn, day_of_week FROM team_fixed_schedule WHERE id = ?`, [id], (gErr, r) => {
      if (gErr || !r) return res.json({ ok: true });
      db.run(`INSERT INTO notifications (microarea_id, message, created_at) VALUES (?, ?, datetime('now'))`, [r.microarea_id, `Admin atualizou turno: ${r.tipo} (${r.turn}) dia ${r.day_of_week}`,], () => {
        res.json({ ok: true });
      });
    });
  });
});
app.post("/schedule/limits", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { microarea_id, tipo, period, limit, active } = req.body || {};
  if (!microarea_id || !tipo || !period || typeof limit !== "number") return res.status(400).json({ error: "missing_fields" });
  db.run(
    `INSERT INTO activity_limits (microarea_id, tipo, period, limit, active, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(microarea_id, tipo, period) DO UPDATE SET limit = excluded.limit, active = excluded.active`,
    [microarea_id, tipo, period, limit, active ? 1 : 1],
    function (e) {
      if (e) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true });
    }
  );
});
app.post("/admin/extra-turn-slots", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { microarea_id, week_start, day_of_week, turn, tipo, extra } = req.body || {};
  if (!microarea_id || !week_start || day_of_week == null || !turn || !tipo || typeof extra !== "number") return res.status(400).json({ error: "missing_fields" });
  db.run(`INSERT INTO admin_extra_turn_slots (microarea_id, week_start, day_of_week, turn, tipo, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`, [microarea_id, week_start, day_of_week, turn, tipo, extra], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    db.run(`INSERT INTO notifications (microarea_id, message, created_at) VALUES (?, ?, datetime('now'))`, [microarea_id, `Admin liberou vagas extras (${extra}) para ${tipo} • ${turn} • dia ${day_of_week}`], () => {
      res.json({ ok: true });
    });
  });
});
app.get("/schedule/view", authenticateToken, (req, res) => {
  const week = req.query.week || weekStart(new Date().toISOString().slice(0, 10));
  const isAdmin = req.user.role === "admin";
  const params = [];
  let sql = `SELECT * FROM team_fixed_schedule`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    const out = rows.map(r => ({ ...r, remaining: null }));
    let pending = out.length;
    if (!pending) return res.json(out);
    out.forEach((r, i) => {
      const startDate = new Date(week + "T00:00:00");
      const targetDate = new Date(startDate.getTime() + r.day_of_week * 24 * 3600 * 1000);
      const dateStr = targetDate.toISOString().slice(0, 10);
      db.get(`SELECT COALESCE(SUM(1),0) AS count FROM appointments WHERE microarea_id = ? AND date = ? AND request_type = ? AND turn = ?`, [r.microarea_id, dateStr, r.tipo, r.turn], (ccErr, ccRow) => {
        if (ccErr) {
          out[i].remaining = null;
        } else {
          db.get(`SELECT COALESCE(SUM(extra),0) AS extra FROM admin_extra_turn_slots WHERE microarea_id = ? AND week_start = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [r.microarea_id, week, r.day_of_week, r.turn, r.tipo], (ee, eeRow) => {
            const capacity = r.vagas_limitadas ? (r.vagas || 0) + (eeRow ? eeRow.extra : 0) : null;
            out[i].remaining = capacity == null ? null : Math.max(0, capacity - (ccRow ? ccRow.count : 0));
            pending -= 1;
            if (pending === 0) res.json(out);
          });
        }
      });
    });
  });
});
app.get("/appointments/export.csv", authenticateToken, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const microParam = req.query.microarea_id ? Number(req.query.microarea_id) : null;
  const week = req.query.week || null;
  const params = [];
  let sql = `SELECT id, date, time, full_name, cpf, sus_card, request_type, turn, microarea_id, acs_user_id FROM appointments`;
  const filters = [];
  if (isAdmin) {
    if (microParam) {
      filters.push(`microarea_id = ?`);
      params.push(microParam);
    }
  } else {
    filters.push(`microarea_id = ?`);
    params.push(req.user.microarea_id);
  }
  if (week) {
    filters.push(`date BETWEEN ? AND date(?,'+6 day')`);
    params.push(week, week);
  }
  if (filters.length) sql += ` WHERE ` + filters.join(" AND ");
  sql += ` ORDER BY date, time`;
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    const header = "id,date,time,full_name,cpf,sus_card,request_type,turn,microarea_id,acs_user_id";
    const lines = (rows || []).map(r => [r.id, r.date, r.time, r.full_name, r.cpf, r.sus_card, r.request_type, r.turn, r.microarea_id, r.acs_user_id].map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=appointments.csv");
    res.send([header].concat(lines).join("\n"));
  });
});
app.get("/schedule/export.csv", authenticateToken, (req, res) => {
  const isAdmin = req.user.role === "admin";
  const microParam = req.query.microarea_id ? Number(req.query.microarea_id) : null;
  const params = [];
  let sql = `SELECT id, microarea_id, day_of_week, turn, tipo, vagas_limitadas, vagas, active, responsavel FROM team_fixed_schedule`;
  if (!isAdmin) {
    sql += ` WHERE microarea_id = ?`;
    params.push(req.user.microarea_id);
  } else if (microParam) {
    sql += ` WHERE microarea_id = ?`;
    params.push(microParam);
  }
  db.all(sql, params, (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    const header = "id,microarea_id,day_of_week,turn,tipo,vagas_limitadas,vagas,active,responsavel";
    const lines = (rows || []).map(r => [r.id, r.microarea_id, r.day_of_week, r.turn, r.tipo, r.vagas_limitadas, r.vagas, r.active, r.responsavel].map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=fixed_schedule.csv");
    res.send([header].concat(lines).join("\n"));
  });
});
app.get("/notifications", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const areaId = req.user.role === "admin" ? Number(req.query.microarea_id || req.user.microarea_id) : req.user.microarea_id;
  db.all(`SELECT id, microarea_id, message, created_at, unread FROM notifications WHERE microarea_id = ? ORDER BY created_at DESC`, [areaId], (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});
app.post("/notifications/read", authenticateToken, authorizeMicroareaAccess, (req, res) => {
  const areaId = req.user.role === "admin" ? Number(req.body.microarea_id || req.user.microarea_id) : req.user.microarea_id;
  db.run(`UPDATE notifications SET unread = 0 WHERE microarea_id = ?`, [areaId], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json({ ok: true });
  });
});
app.get("/microareas", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  db.all(`SELECT id, name, cnes, ine FROM microareas ORDER BY name`, [], (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});
app.post("/admin/microareas", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "missing_fields" });
  const prefix = microPrefix(name);
  nextMicroIdentifier(prefix, (idErr, ident) => {
    if (idErr) return res.status(500).json({ error: "db_error" });
    db.run(`INSERT INTO microareas (name, identifier, created_at) VALUES (?, ?, datetime('now'))`, [name, ident], function (e) {
      if (e) return res.status(500).json({ error: "db_error" });
      res.status(201).json({ id: this.lastID, identifier: ident });
    });
  });
});
app.put("/admin/microareas/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const { name, cnes, ine } = req.body || {};
  db.run(`UPDATE microareas SET name = COALESCE(?, name), cnes = COALESCE(?, cnes), ine = COALESCE(?, ine) WHERE id = ?`, [typeof name === "string" ? name : null, typeof cnes === "string" ? cnes : null, typeof ine === "string" ? ine : null, id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json({ ok: true });
  });
});
app.delete("/admin/microareas/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  db.run(`DELETE FROM microareas WHERE id = ?`, [id], function (e) {
    if (e) return res.status(500).json({ error: "db_error_or_in_use" });
    res.json({ ok: true });
  });
});
app.get("/admin/users", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  db.all(`SELECT u.id, u.name, u.professional_id, u.role, u.microarea_id, m.name AS microarea_name FROM users u JOIN microareas m ON u.microarea_id = m.id ORDER BY u.name`, [], (e, rows) => {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json(rows || []);
  });
});
app.post("/admin/users", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const { name, microarea_id, role, password } = req.body || {};
  if (!name || !microarea_id || !role || !password) return res.status(400).json({ error: "missing_fields" });
  if (!["admin","acs"].includes(role)) return res.status(400).json({ error: "invalid_role" });
  const hash = bcrypt.hashSync(password, 10);
  const loginId = String(name).trim();
  db.run(`INSERT INTO users (professional_id, name, role, microarea_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`, [loginId, name, role, microarea_id, hash], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.status(201).json({ id: this.lastID });
  });
});
app.put("/admin/users/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  const { name, microarea_id, role, password } = req.body || {};
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, id], function (e) {
      if (e) return res.status(500).json({ error: "db_error" });
      // continue with other fields
      const loginId = typeof name === "string" ? String(name).trim() : null;
      db.run(`UPDATE users SET professional_id = COALESCE(?, professional_id), name = COALESCE(?, name), microarea_id = COALESCE(?, microarea_id), role = COALESCE(?, role) WHERE id = ?`, [loginId, typeof name === "string" ? name : null, typeof microarea_id === "number" ? microarea_id : null, ["admin","acs"].includes(role) ? role : null, id], function (e2) {
        if (e2) return res.status(500).json({ error: "db_error" });
        res.json({ ok: true });
      });
    });
  } else {
    const loginId = typeof name === "string" ? String(name).trim() : null;
    db.run(`UPDATE users SET professional_id = COALESCE(?, professional_id), name = COALESCE(?, name), microarea_id = COALESCE(?, microarea_id), role = COALESCE(?, role) WHERE id = ?`, [loginId, typeof name === "string" ? name : null, typeof microarea_id === "number" ? microarea_id : null, ["admin","acs"].includes(role) ? role : null, id], function (e2) {
      if (e2) return res.status(500).json({ error: "db_error" });
      res.json({ ok: true });
    });
  }
});
app.delete("/admin/users/:id", authenticateToken, authorizeRoles(["admin"]), (req, res) => {
  const id = Number(req.params.id);
  db.run(`DELETE FROM users WHERE id = ?`, [id], function (e) {
    if (e) return res.status(500).json({ error: "db_error" });
    res.json({ ok: true });
  });
});
// Serve frontend build if present
try {
  const clientDir = path.join(__dirname, "..", "frontend", "dist");
  if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  }
} catch {}
app.get("/schedule/availability", authenticateToken, (req, res) => {
  const { date, turn, tipo, microarea_id } = req.query || {};
  const areaId = req.user.role === "admin" ? Number(microarea_id || req.user.microarea_id) : req.user.microarea_id;
  const wk = weekStart(date);
  const dow = new Date(date + "T00:00:00").getUTCDay();
  db.get(`SELECT vagas_limitadas, vagas, active FROM team_fixed_schedule WHERE microarea_id = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [areaId, dow, turn, tipo], (cfgErr, cfg) => {
    if (cfgErr || !cfg || !cfg.active) return res.status(200).json({ remaining: 0 });
    db.get(`SELECT COALESCE(SUM(1),0) AS count FROM appointments WHERE microarea_id = ? AND date = ? AND request_type = ? AND turn = ?`, [areaId, date, tipo, turn], (ccErr, ccRow) => {
      db.get(`SELECT COALESCE(SUM(extra),0) AS extra FROM admin_extra_turn_slots WHERE microarea_id = ? AND week_start = ? AND day_of_week = ? AND turn = ? AND tipo = ?`, [areaId, wk, dow, turn, tipo], (ee, eeRow) => {
        const capacity = cfg.vagas_limitadas ? (cfg.vagas || 0) + (eeRow ? eeRow.extra : 0) : null;
        const remaining = capacity == null ? null : Math.max(0, capacity - (ccRow ? ccRow.count : 0));
        res.json({ remaining });
      });
    });
  });
});
const port = process.env.PORT || 3001;
app.listen(port, () => {});
try {
  const http = require("http");
  setInterval(() => {
    const req = http.request({ hostname: "localhost", port, path: "/health", method: "GET" }, (res) => { /* noop */ });
    req.on("error", () => {});
    req.end();
  }, Number(process.env.KEEPALIVE_INTERVAL_MS || 300000));
} catch {}
