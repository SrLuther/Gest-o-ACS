PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS microareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  cnes TEXT,
  ine TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','acs')),
  microarea_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lock_until TEXT,
  last_access_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  notes TEXT NOT NULL,
  full_name TEXT,
  cpf TEXT,
  sus_card TEXT,
  request_type TEXT CHECK (request_type IN ('hipertensao','diabetes','citopatologico','visita_domiciliar')),
  microarea_id INTEGER NOT NULL,
  acs_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (acs_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS team_fixed_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  turn TEXT NOT NULL CHECK (turn IN ('manha','tarde')),
  tipo TEXT NOT NULL CHECK (tipo IN ('saude_mental','puericultura','reuniao_equipe','citopatologico','demanda_espontanea','hipertensao','diabetes','pre_natal_acomp','pre_natal_cadastro','pse')),
  vagas_limitadas INTEGER NOT NULL DEFAULT 0,
  vagas INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  responsavel TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id),
  UNIQUE(microarea_id, day_of_week, turn, tipo)
);

CREATE TABLE IF NOT EXISTS activity_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('reuniao_equipe','pse')),
  period TEXT NOT NULL CHECK (period IN ('weekly','monthly')),
  limit INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(microarea_id, tipo, period),
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS admin_extra_turn_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  week_start TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  turn TEXT NOT NULL CHECK (turn IN ('manha','tarde')),
  tipo TEXT NOT NULL CHECK (tipo IN ('saude_mental','puericultura','reuniao_equipe','citopatologico','demanda_espontanea','hipertensao','diabetes','pre_natal_acomp','pre_natal_cadastro','pse')),
  extra INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  sus_card TEXT,
  cpf TEXT,
  birth_date TEXT NOT NULL,
  microarea_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS vitamin_doses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL,
  vitamin_type TEXT NOT NULL CHECK (vitamin_type IN ('100000','200000')),
  dose_number INTEGER NOT NULL CHECK (dose_number BETWEEN 1 AND 10),
  administered_at TEXT NOT NULL,
  acs_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id),
  FOREIGN KEY (acs_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vitamin_monthly_control (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  vitamin_type TEXT NOT NULL CHECK (vitamin_type IN ('100000','200000')),
  saldo_anterior INTEGER NOT NULL DEFAULT 0,
  administradas INTEGER NOT NULL DEFAULT 0,
  perdas INTEGER NOT NULL DEFAULT 0,
  solicitacao_proximo_mes INTEGER NOT NULL DEFAULT 0,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(microarea_id, month, vitamin_type),
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS deaths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  address TEXT,
  municipality TEXT,
  sex TEXT CHECK (sex IN ('M','F')),
  age INTEGER,
  place TEXT CHECK (place IN ('hospital','residencia')),
  do_number TEXT,
  microarea_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS births (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mother_name TEXT NOT NULL,
  address TEXT,
  residence_municipality TEXT,
  sex TEXT CHECK (sex IN ('M','F')),
  weight_kg REAL,
  birth_date TEXT NOT NULL,
  delivery_type TEXT CHECK (delivery_type IN ('hospitalar','residencial')),
  occurrence_municipality TEXT,
  registered TEXT CHECK (registered IN ('sim','nao')),
  child_sus_card TEXT,
  microarea_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS weekly_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  week_start TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('hipertensao','diabetes')),
  limit INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(microarea_id, week_start, tipo),
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS admin_extra_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microarea_id INTEGER NOT NULL,
  week_start TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('hipertensao','diabetes')),
  extra INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_at TEXT NOT NULL,
  ip TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  accepted_at TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
