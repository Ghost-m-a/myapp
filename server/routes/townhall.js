const router = require("express").Router();
const { asyncHandler } = require("../utils/http");
const requireAuth = require("../middleware/auth");
const c = require("../controllers/townhallController");

router.use(requireAuth);
router.get("/posts", asyncHandler(c.posts));
router.post("/posts", asyncHandler(c.createPost));
router.delete("/posts/:id", asyncHandler(c.deletePost));
router.post("/posts/:id/like", asyncHandler(c.like));
router.get("/posts/:id/comments", asyncHandler(c.comments));
router.post("/posts/:id/comments", asyncHandler(c.addComment));
router.get("/users", asyncHandler(c.popularUsers));
router.post("/follow/:id", asyncHandler(c.follow));

module.exports = router;
