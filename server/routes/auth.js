const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/authController");

router.post("/signup", asyncHandler(c.signup));
router.post("/login", asyncHandler(c.login));
router.post("/logout", c.logout);
router.get("/me", requireAuth, c.me);
router.patch("/me", requireAuth, asyncHandler(c.updateMe));
router.post("/password", requireAuth, asyncHandler(c.changePassword));

module.exports = router;
