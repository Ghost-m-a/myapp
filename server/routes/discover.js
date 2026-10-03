const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/discoverController");

router.use(requireAuth);
router.get("/", asyncHandler(c.overview));
router.get("/users", asyncHandler(c.users));

module.exports = router;
