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
  secret: "cateract_core",
  resave: false,
  saveUninitialized: false
}));

/* ---------------- HELPERS ---------------- */
function getUser(db, email) {
  if (!db.users[email]) {
    db.users[email] = {
      email,
      password: "",
      name: "",
      dob: "",
      drive: {},
      docs: {},
      sites: {}
    };
  }
  return db.users[email];
}

/* ---------------- AUTH ---------------- */

// REGISTER
app.post("/api/register", (req, res) => {
  const db = loadDB();
  const { email, password, name, dob } = req.body;

  if (!email || !password) return res.json({ ok: false });

  if (db.users[email]) {
    return res.json({ ok: false, error: "User exists" });
  }

  db.users[email] = {
    email,
    password,
    name: name || "",
    dob: dob || "",
    drive: {},
    docs: {},
    sites: {}
  };

  saveDB(db);
  res.json({ ok: true });
});

// LOGIN
app.post("/api/login", (req, res) => {
  const db = loadDB();
  const { email, password } = req.body;

  const user = db.users[email];

  if (user && user.password === password) {
    req.session.user = email;
    return res.json({ ok: true });
  }

  res.json({ ok: false });
});

// ME
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
      dob: user.dob
    }
  });
});

// LOGOUT
app.get("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ---------------- CAT SYSTEM ---------------- */
app.get("/api/cat", (req, res) => {
  const db = loadDB();
  const url = req.query.url;

  if (!url) return res.json({ html: "Invalid" });

  const parts = url.replace("cat://", "").split("/");
  const route = parts[0];

  // HOME
  if (route === "home") {
    return res.json({
      html: "<h1>🏠 Cateract Home</h1><p>Welcome to your OS</p>"
    });
  }

  // SEARCH (basic)
  if (route === "search") {
    const q = parts.slice(1).join(" ");
    return res.json({
      html: `<h2>Search: ${q}</h2>`
    });
  }

  return res.json({
    html: "<h1>Unknown cat route</h1>"
  });
});

/* ---------------- DRIVE ---------------- */
app.post("/api/drive/save", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  if (!user) return res.json({ ok: false });

  const { name, content } = req.body;

  db.users[user].drive[name] = content;

  saveDB(db);
  res.json({ ok: true });
});

app.get("/api/drive/list", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  res.json(db.users[user]?.drive || {});
});

/* ---------------- DOCS ---------------- */
app.post("/api/docs/save", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  const { id, content } = req.body;

  db.users[user].docs[id] = content;

  saveDB(db);
  res.json({ ok: true });
});

app.get("/api/docs/:id", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  res.json({
    content: db.users[user]?.docs?.[req.params.id] || ""
  });
});

/* ---------------- SITE BUILDER ---------------- */
app.post("/api/sites/create", (req, res) => {
  const db = loadDB();
  const user = req.session.user;

  const { name, blocks } = req.body;

  db.users[user].sites[name] = { blocks };

  saveDB(db);
  res.json({ ok: true });
});

app.get("/site/:user/:name", (req, res) => {
  const db = loadDB();

  const site = db.users?.[req.params.user]?.sites?.[req.params.name];

  if (!site) return res.send("404");

  const html = site.blocks.map(b => {
    if (b.type === "text") return `<p>${b.value}</p>`;
    if (b.type === "title") return `<h1>${b.value}</h1>`;
    return "";
  }).join("");

  res.send(`
    <body style="background:#111;color:white;font-family:Arial;padding:20px;">
      ${html}
    </body>
  `);
});

/* ---------------- STATIC ---------------- */
app.use(express.static("client"));

/* ---------------- START ---------------- */
app.listen(3000, "0.0.0.0", () => {
  console.log("Cateract running");
});
