const path = require("path");
const express = require("express");
const app = require("./app");

// Serve the frontend locally (on Vercel, public/ is served automatically)
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
   console.log(`Server running at http://localhost:${PORT}`);
});
