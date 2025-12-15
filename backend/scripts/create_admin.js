const bcrypt = require("bcryptjs");
const db = require("../db");

function ensureMicroarea(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id FROM microareas WHERE LOWER(name) = LOWER(?)`, [name], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.id);
      db.run(`INSERT INTO microareas (name, created_at) VALUES (?, datetime('now'))`, [name], function (err2) {
        if (err2) return reject(err2);
        resolve(this.lastID);
      });
    });
  });
}

function ensureAdmin(microareaId) {
  return new Promise((resolve, reject) => {
    const professionalId = "ADMIN-0001";
    const password = "admin123";
    db.get(`SELECT id FROM users WHERE professional_id = ?`, [professionalId], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.id);
      const hash = bcrypt.hashSync(password, 10);
      db.run(
        `INSERT INTO users (professional_id, name, role, microarea_id, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [professionalId, "Administrador", "admin", microareaId, hash],
        function (err2) {
          if (err2) return reject(err2);
          resolve(this.lastID);
        }
      );
    });
  });
}

async function main() {
  try {
    const microareaId = await ensureMicroarea("GERAL");
    await ensureAdmin(microareaId);
    console.log("admin_ready");
  } catch (e) {
    console.error("admin_setup_error");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
