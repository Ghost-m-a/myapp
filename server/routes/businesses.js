const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/businessController");

router.use(requireAuth);
router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.patch("/:id", asyncHandler(c.update));
router.delete("/:id", asyncHandler(c.remove));

module.exports = router;
