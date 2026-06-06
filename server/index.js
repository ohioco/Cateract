import express from "express";
import session from "express-session";
import fs from "fs";

const app = express();
app.use(express.json());

/* ---------------- DATABASE ---------------- */
const DB_FILE = "./data.json";

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ---------------- SESSION ---------------- */
app.use(session({
  secret: "cateract_core_secret",
  resave: false,
  saveUninitialized: false
}));

/* ---------------- AUTH SYSTEM ---------------- */

// REGISTER (REAL USER PROFILE)
app.post("/api/register", (req, res) => {
  const { email, password, name, dob } = req.body;

  const db = loadDB();

  if (!email || !password) {
    return res.json({ ok: false, error: "Missing fields" });
  }

  if (db.users[email]) {
    return res.json({ ok: false, error: "User already exists" });
  }

  db.users[email] = {
    email,
    password,
    name: name || "",
    dob: dob || "",
    createdAt: Date.now()
  };

  saveDB(db);

  res.json({ ok: true });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const db = loadDB();
  const user = db.users[email];

  if (user && user.password === password) {
    req.session.user = email;
    return res.json({ ok: true });
  }

  res.json({ ok: false, error: "Invalid login" });
});

// LOGOUT
app.get("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET USER PROFILE
app.get("/api/me", (req, res) => {
  const db = loadDB();

  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }

  const user = db.users[req.session.user];

  res.json({
    loggedIn: true,
    user: {
      email: user.email,
      name: user.name,
      dob: user.dob,
      createdAt: user.createdAt
    }
  });
});

/* ---------------- LOGIN PROTECTION ---------------- */
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

/* ---------------- PAGES ---------------- */

// login page
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard.html");
  }
  res.sendFile(process.cwd() + "/client/login.html");
});

// protected dashboard
app.get("/dashboard.html", requireLogin, (req, res) => {
  res.sendFile(process.cwd() + "/client/dashboard.html");
});

/* ---------------- STATIC FILES ---------------- */
app.use(express.static("client"));

/* ---------------- STATUS ---------------- */
app.get("/api/status", (req, res) => {
  res.json({
    system: "Cateract Phase 1 Core",
    users: Object.keys(loadDB().users).length,
    online: true
  });
});

/* ---------------- START ---------------- */
app.listen(3000, "0.0.0.0", () => {
  console.log("Cateract Phase 1 running");
});
