const crypto = require("crypto");
const User = require("../models/User");
const Business = require("../models/Business");
const Notification = require("../models/Notification");
const { pub } = require("../utils/shape");

async function ensureCode(user) {
   if (!user.referralCode) {
      user.referralCode = crypto.randomBytes(4).toString("hex");
      await user.save();
   }
   return user.referralCode;
}

exports.me = async (req, res) => {
   const me = req.user;
   const referralCode = await ensureCode(me);

   const referred = await User.find({ referredBy: me._id })
      .sort({ createdAt: -1 })
      .limit(200);
   const businesses = await Business.find({
      owner: { $in: referred.map((u) => u._id) },
   })
      .sort({ createdAt: -1 })
      .populate("owner", "name username avatar role");

   res.json({
      referralCode,
      enrolled: me.partnerVerified,
      earnings: 0, // becomes real when payments exist
      users: referred.map((u) => ({ ...pub(u), createdAt: u.createdAt })),
      businesses: businesses.map((b) => ({
         id: b.id,
         name: b.name,
         createdAt: b.createdAt,
         owner: b.owner ? pub(b.owner) : null,
      })),
   });
};

exports.enroll = async (req, res) => {
   const me = req.user;
   if (!me.partnerVerified) {
      me.partnerVerified = true;
      await me.save();
      await Notification.create({
         user: me._id,
         text: "You're now a Verified Partner.",
      });
   }
   res.json({ user: me });
};
