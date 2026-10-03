const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function requireAuth(req, res, next) {
   const token = req.cookies.token;
   if (!token) return res.status(401).json({ message: "Not logged in." });

   try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(id);
      if (!user) return res.status(401).json({ message: "Account not found." });
      req.user = user;
      next();
   } catch {
      res.status(401).json({
         message: "Session expired. Please log in again.",
      });
   }
};
