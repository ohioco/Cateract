import express from "express";

const app = express();

app.use(express.json());

// This serves your browser UI
app.use(express.static("client"));

// Core “Cateract system”
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


// Status check
app.get("/api/status", (req, res) => {
  res.json({
    system: "Cateract Core",
    online: true
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cateract running on port ${PORT}`);
});
