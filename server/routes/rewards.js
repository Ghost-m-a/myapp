const router = require("express").Router();
const { asyncHandler: a } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/rewardController");

router.use(requireAuth);
router.get("/", a(c.list));
router.post("/", a(c.create));
router.post("/:id/join", a(c.join));
router.delete("/:id", a(c.remove));

module.exports = router;
