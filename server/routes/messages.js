const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/messageController");

router.use(requireAuth);
router.get("/conversations", asyncHandler(c.list));
router.post("/conversations", asyncHandler(c.start));
router.get("/conversations/:id", asyncHandler(c.thread));
router.post("/conversations/:id", asyncHandler(c.send));

module.exports = router;
