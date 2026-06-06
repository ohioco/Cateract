import express from "express";

const app = express();

app.use(express.json());

// Serve browser UI
app.use(express.static("client"));

/* -----------------------------
   Cateract dynamic sites
------------------------------*/
app.get("/site/:name", (req, res) => {
  const name = req.params.name;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} - Cateract</title>
      <style>
        body {
          font-family: Arial;
          background: #111;
          color: white;
          text-align: center;
          padding: 50px;
        }
        .box {
          background: #222;
          padding: 20px;
          border-radius: 10px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>${name}</h1>
        <p>Welcome to ${name} inside the Cateract Network</p>
      </div>
    </body>
    </html>
  `);
});

/* Home */
app.get("/site/home", (req, res) => {
  res.send(`
    <h1>Cateract Home</h1>
    <p>This is your main network hub</p>
  `);
});

/* API */
app.get("/api/status", (req, res) => {
  res.json({
    system: "Cateract Core",
    online: true
  });
});

/* Start server */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cateract running on port ${PORT}`);
});

// Session support 

import session from "express-session";

app.use(session({
  secret: "cateract_secret",
  resave: false,
  saveUninitialized: true
}));


const users = {};

app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ ok: false });
  }

  users[username] = password;

  res.json({ ok: true });
});

//Login System 

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] === password) {
    req.session.user = username;
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

// site creation 

app.post("/api/create-site", (req, res) => {
  const { name, content } = req.body;

  sites[name] = content;

  res.json({ ok: true });
});

// Server User Website 

app.get("/site/:name", (req, res) => {
  const name = req.params.name;

  const content = sites[name];

  if (!content) {
    return res.send("<h1>404 Site Not Found</h1>");
  }

  res.send(`
    <html>
      <body style="font-family:Arial;background:#111;color:white;padding:20px;">
        ${content}
      </body>
    </html>
  `);
});
