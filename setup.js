const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeEnvIfMissing() {
  const envPath = path.join(__dirname, "backend", ".env");
  if (!fs.existsSync(envPath)) {
    const secret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    fs.writeFileSync(envPath, `JWT_SECRET=${secret}\nPORT=3001\n`, "utf-8");
  }
}

function installDeps(dir) {
  execSync("npm install", { stdio: "inherit", cwd: dir });
}

function execSchema() {
  const dbPath = path.join(__dirname, "backend", "database", "acs_gestao_geral.db");
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  const sqlite3 = require(path.join(__dirname, "backend", "node_modules", "sqlite3")).verbose();
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        db.close();
        return reject(err);
      }
      db.close();
      resolve();
    });
  });
}

async function runCreateAdmin() {
  execSync("node scripts/create_admin.js", { stdio: "inherit", cwd: path.join(__dirname, "backend") });
}

async function main() {
  ensureDir(path.join(__dirname, "backend"));
  ensureDir(path.join(__dirname, "backend", "database"));
  ensureDir(path.join(__dirname, "backend", "scripts"));
  ensureDir(path.join(__dirname, "backend", "modules"));
  ensureDir(path.join(__dirname, "frontend"));
  ensureDir(path.join(__dirname, "frontend", "public"));
  ensureDir(path.join(__dirname, "frontend", "src"));
  ensureDir(path.join(__dirname, "frontend", "src", "components"));
  ensureDir(path.join(__dirname, "frontend", "src", "pages"));

  writeEnvIfMissing();

  installDeps(path.join(__dirname, "backend"));
  installDeps(path.join(__dirname, "frontend"));

  await execSchema();
  await runCreateAdmin();

  console.log("setup_complete");
}

main().catch((e) => {
  console.error("setup_error", e && e.message ? e.message : e);
  process.exit(1);
});
