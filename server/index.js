import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Cateract Network Online");
});

app.get("/site/:name", (req, res) => {
  const name = req.params.name;

  res.json({
    site: name,
    content: `Welcome to ${name} inside the Cateract Network`,
    status: "active"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    system: "Cateract Core",
    online: true
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Cateract running on port ${PORT}`);
});
