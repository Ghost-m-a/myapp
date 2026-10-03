const User = require("../models/User");
const Business = require("../models/Business");
const { pub } = require("../utils/shape");
const { escapeRegex } = require("../utils/http");

exports.overview = async (req, res) => {
   const q = String(req.query.q || "")
      .trim()
      .slice(0, 40);
   const filter = q ? { name: { $regex: escapeRegex(q), $options: "i" } } : {};

   const [users, businessCount, businesses] = await Promise.all([
      User.countDocuments({ isSystem: { $ne: true } }),
      Business.countDocuments(),
      Business.find(filter)
         .sort({ createdAt: -1 })
         .limit(24)
         .populate("owner", "name username avatar role"),
   ]);

   res.json({
      stats: { users, businesses: businessCount, earned: 0 },
      businesses: businesses.map((b) => ({
         id: b.id,
         name: b.name,
         description: b.description,
         createdAt: b.createdAt,
         owner: b.owner ? pub(b.owner) : null,
      })),
   });
};

// Used by "New message" to find people
exports.users = async (req, res) => {
   const q = String(req.query.q || "")
      .trim()
      .slice(0, 40);
   if (q.length < 2) return res.json({ users: [] });

   const rx = { $regex: escapeRegex(q), $options: "i" };
   const users = await User.find({
      _id: { $ne: req.user._id },
      isSystem: { $ne: true },
      $or: [{ name: rx }, { username: rx }],
   }).limit(8);

   res.json({ users: users.map(pub) });
};
