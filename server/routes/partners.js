const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/partnerController");

router.use(requireAuth);
router.get("/me", asyncHandler(c.me));
router.post("/enroll", asyncHandler(c.enroll));

module.exports = router;
