const router = require("express").Router();
const { asyncHandler: a } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/bizController");

router.use(requireAuth);
router.get("/spec", c.spec);
router.use("/:businessId", a(c.load));

router.get("/:businessId/stats", a(c.stats));
router.get("/:businessId/customers", a(c.customers));
router.get("/:businessId/records/:kind", a(c.list));
router.post("/:businessId/records/:kind", a(c.create));
router.patch("/:businessId/records/:kind/:id", a(c.update));
router.delete("/:businessId/records/:kind/:id", a(c.remove));

module.exports = router;
