const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Business = require("../models/Business");
const User = require("../models/User");
const { pub } = require("../utils/shape");
const { fail } = require("../utils/http");

const FIELDS = "name username avatar role isSystem";
const withRefs = (query) =>
   query.populate("author", FIELDS).populate("business", "name");

const shape = (p, meId) => ({
   id: p.id,
   author: pub(p.author),
   business: p.business ? { id: p.business.id, name: p.business.name } : null,
   forum: "Public forum",
   title: p.title,
   body: p.body,
   bounty: p.bounty,
   createdAt: p.createdAt,
   likes: p.likes.length,
   liked: p.likes.some((l) => l.equals(meId)),
   comments: p.commentsCount,
   views: p.views,
});

exports.posts = async (req, res) => {
   const me = req.user;
   const query = {};
   if (req.query.filter === "following")
      query.author = { $in: [...me.following, me._id] };
   if (req.query.filter === "mine") query.author = me._id;

   const posts = await withRefs(
      Post.find(query).sort({ createdAt: -1 }).limit(30),
   );
   Post.updateMany(
      { _id: { $in: posts.map((p) => p._id) } },
      { $inc: { views: 1 } },
   ).catch(() => {});

   res.json({ posts: posts.map((p) => shape(p, me._id)) });
};

exports.createPost = async (req, res) => {
   const me = req.user;
   const body = String(req.body.body || "").trim();
   if (!body || body.length > 1000)
      return fail(res, 400, "Post must be 1 to 1000 characters.");

   let business = null;
   if (req.body.businessId) {
      business = await Business.findOne({
         _id: req.body.businessId,
         owner: me._id,
      });
      if (!business) return fail(res, 400, "Business not found.");
   }

   const bounty = Math.max(0, Math.min(100000, Number(req.body.bounty) || 0));
   const post = await Post.create({
      author: me._id,
      business: business?._id || null,
      body,
      title: String(req.body.title || "")
         .trim()
         .slice(0, 100),
      bounty,
   });

   const full = await withRefs(Post.findById(post._id));
   res.status(201).json({ post: shape(full, me._id) });
};

exports.deletePost = async (req, res) => {
   const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
   });
   if (!post) return fail(res, 404, "Post not found.");
   await Comment.deleteMany({ post: post._id });
   res.json({ ok: true });
};

exports.like = async (req, res) => {
   const me = req.user;
   const post = await Post.findById(req.params.id);
   if (!post) return fail(res, 404, "Post not found.");

   const liked = post.likes.some((l) => l.equals(me._id));
   await Post.updateOne(
      { _id: post._id },
      liked ? { $pull: { likes: me._id } } : { $addToSet: { likes: me._id } },
   );
   res.json({ liked: !liked, likes: post.likes.length + (liked ? -1 : 1) });
};

exports.comments = async (req, res) => {
   const list = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("author", FIELDS);
   res.json({
      comments: list.map((c) => ({
         id: c.id,
         author: pub(c.author),
         text: c.text,
         createdAt: c.createdAt,
      })),
   });
};

exports.addComment = async (req, res) => {
   const text = String(req.body.text || "").trim();
   if (!text || text.length > 500)
      return fail(res, 400, "Comment must be 1 to 500 characters.");

   const post = await Post.findById(req.params.id);
   if (!post) return fail(res, 404, "Post not found.");

   const c = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
   });
   await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });

   res.status(201).json({
      comment: {
         id: c.id,
         author: pub(req.user),
         text: c.text,
         createdAt: c.createdAt,
      },
   });
};

exports.popularUsers = async (req, res) => {
   const me = req.user;
   const users = await User.find({
      _id: { $ne: me._id },
      isSystem: { $ne: true },
   })
      .sort({ createdAt: -1 })
      .limit(50);
   const ids = users.map((u) => u._id);

   const counts = await User.aggregate([
      { $match: { following: { $in: ids } } },
      { $unwind: "$following" },
      { $match: { following: { $in: ids } } },
      { $group: { _id: "$following", n: { $sum: 1 } } },
   ]);
   const followers = Object.fromEntries(
      counts.map((c) => [String(c._id), c.n]),
   );

   const list = users
      .map((u) => ({
         ...pub(u),
         followers: followers[u.id] || 0,
         following: me.following.some((f) => f.equals(u._id)),
      }))
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 8);

   res.json({ users: list });
};

exports.follow = async (req, res) => {
   const me = req.user;
   const target = await User.findById(req.params.id);
   if (!target || target.isSystem) return fail(res, 404, "User not found.");
   if (target.id === me.id) return fail(res, 400, "You can't follow yourself.");

   const following = me.following.some((f) => f.equals(target._id));
   await User.updateOne(
      { _id: me._id },
      following
         ? { $pull: { following: target._id } }
         : { $addToSet: { following: target._id } },
   );
   res.json({ following: !following });
};
