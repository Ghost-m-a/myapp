const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

app.get("/api/hello", (req, res) =>
   res.json({ message: "Hello from the server!" }),
);

// Every other /api route needs the database
app.use("/api", async (req, res, next) => {
   try {
      await connectDB();
      next();
   } catch (err) {
      next(err);
   }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/businesses", require("./routes/businesses"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/townhall", require("./routes/townhall"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/partners", require("./routes/partners"));
app.use("/api/discover", require("./routes/discover"));
app.use("/api/biz", require("./routes/biz"));
app.use("/api/rewards", require("./routes/rewards"));
app.use("/api", (req, res) => res.status(404).json({ message: "Not found." }));

// One place that turns errors into JSON
app.use((err, req, res, next) => {
   if (err.code === 11000)
      return res.status(409).json({ message: "That value is already taken." });
   if (err.name === "ValidationError")
      return res
         .status(400)
         .json({ message: Object.values(err.errors)[0].message });
   if (err.name === "CastError")
      return res.status(400).json({ message: "Invalid id." });
   if (err.type === "entity.too.large")
      return res.status(413).json({ message: "That image is too large." });

   console.error(err);
   res.status(500).json({ message: "Server error. Please try again." });
});

module.exports = app;
