import express from "express";
import session from "express-session";
import fs from "fs";

const app = express();
app.use(express.json());

/* ---------------- DB ---------------- */
const DB_FILE = "./data.json";

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ---------------- SESSION ---------------- */
app.use(session({
  secret: "cateract_secret",
  resave: false,
  saveUninitialized: false
}));

/* ---------------- AUTH ---------------- */
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();

  if (!email || !password) return res.json({ ok: false });

  if (db.users[email]) return res.json({ ok: false, error: "exists" });

  db.users[email] = { password, sites: [] };
  saveDB(db);

  res.json({ ok: true });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();

  if (db.users[email]?.password === password) {
    req.session.user = email;
    return res.json({ ok: true });
  }

  res.json({ ok: false });
});

app.get("/api/me", (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    user: req.session.user || null
  });
});

/* ---------------- SITE CREATE ---------------- */
app.post("/api/create-site", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  if (!user) return res.json({ ok: false });

  const { name, content } = req.body;

  const id = `${user}:${name}`;

  db.sites[id] = {
    owner: user,
    name,
    content
  };

  db.users[user].sites.push(id);

  saveDB(db);

  res.json({ ok: true });
});

/* ---------------- SITE VIEW ---------------- */
app.get("/site/:user/:name", (req, res) => {
  const db = loadDB();
  const id = `${req.params.user}:${req.params.name}`;

  const site = db.sites[id];

  if (!site) return res.send("404");

  res.send(`
    <html>
      <body style="font-family:Arial;background:#111;color:white;padding:20px;">
        ${site.content}
      </body>
    </html>
  `);
});

/* ---------------- SEARCH ENGINE ---------------- */
app.get("/api/search", (req, res) => {
  const db = loadDB();
  const q = (req.query.q || "").toLowerCase();

  const results = Object.values(db.sites)
    .filter(s => s.name.toLowerCase().includes(q))
    .map(s => ({
      owner: s.owner,
      name: s.name
    }));

  res.json(results);
});

/* ---------------- STATIC ---------------- */
app.use("/public", express.static("client"));

/* ---------------- LOGIN GATE ---------------- */
app.get("/", (req, res, next) => {
  if (!req.session.user) {
    return res.sendFile(process.cwd() + "/client/login.html");
  }
  next();
});

/* ---------------- START ---------------- */
app.listen(3000, "0.0.0.0", () => {
  console.log("Cateract running");
});

// middleware

app.get("/dashboard.html", requireLogin, (req, res) => {
  res.sendFile(process.cwd() + "/client/dashboard.html");
});

app.get("/builder.html", requireLogin, (req, res) => {
  res.sendFile(process.cwd() + "/client/builder.html");
});

app.get("/dashboard.html", requireLogin, (req, res) => {
  res.sendFile(process.cwd() + "/client/dashboard.html");
});

app.get("/builder.html", requireLogin, (req, res) => {
  res.sendFile(process.cwd() + "/client/builder.html");
});
