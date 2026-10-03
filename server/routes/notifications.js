const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/notificationController");

router.use(requireAuth);
router.get("/", asyncHandler(c.list));
router.post("/read-all", asyncHandler(c.readAll));

module.exports = router;
