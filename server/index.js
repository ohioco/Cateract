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

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
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

function parseCat(url) {
  return url.replace("cat://", "").split("/");
}

app.get("/api/cat", (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith("cat://")) {
    return res.json({ ok: false, error: "Invalid cat url" });
  }

  const [_, route, ...rest] = url.replace("cat://", "").split("/");

  const db = loadDB();

  // HOME
  if (route === "home") {
    return res.json({
      title: "Cateract Home",
      html: "<h1>Welcome to Cateract OS</h1>"
    });
  }

  // SEARCH
  if (route === "search") {
    const q = rest.join(" ");

    const results = Object.values(db.sites)
      .filter(s => s.name.includes(q));

    return res.json({
      title: "Search",
      html: `<h2>Results for ${q}</h2>` +
        results.map(r => `<p>${r.name}</p>`).join("")
    });
  }

  // USER SITE
  if (route === "site") {
    const user = rest[0];
    const name = rest[1];

    const id = `${user}:${name}`;
    const site = db.sites[id];

    if (!site) {
      return res.json({
        title: "404",
        html: "<h1>Site not found</h1>"
      });
    }

    return res.json({
      title: site.name,
      html: site.content
    });
  }

  res.json({
    title: "Error",
    html: "<h1>Unknown cat route</h1>"
  });
});

