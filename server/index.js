import express from "express";

const app = express();

app.use(express.json());

// This serves your browser UI
app.use(express.static("client"));

// Core “Cateract system”
app.get("/site/:name", (req, res) => {
  const name = req.params.name;

  res.json({
    site: name,
    content: `Welcome to ${name} inside Cateract Network`,
    status: "active"
  });
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
