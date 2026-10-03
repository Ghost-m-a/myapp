const Business = require("../models/Business");
const Notification = require("../models/Notification");
const { fail } = require("../utils/http");
const Record = require("../models/Record");
const Campaign = require("../models/Campaign");

const MAX_BUSINESSES = 5;
const text = (v, max) =>
   String(v ?? "")
      .trim()
      .slice(0, max);

exports.list = async (req, res) => {
   const businesses = await Business.find({ owner: req.user.id }).sort({
      createdAt: 1,
   });
   res.json({ businesses });
};

exports.create = async (req, res) => {
   const name = text(req.body.name, 40);
   if (name.length < 2)
      return fail(res, 400, "Business name must be at least 2 characters.");

   const count = await Business.countDocuments({ owner: req.user.id });
   if (count >= MAX_BUSINESSES)
      return fail(
         res,
         403,
         `You can create up to ${MAX_BUSINESSES} businesses.`,
      );

   const business = await Business.create({
      owner: req.user.id,
      name,
      description: text(req.body.description, 200),
   });
   await Notification.create({
      user: req.user.id,
      text: `Your business "${name}" was created.`,
   });

   res.status(201).json({ business });
};

exports.update = async (req, res) => {
   const business = await Business.findOne({
      _id: req.params.id,
      owner: req.user.id,
   });
   if (!business) return fail(res, 404, "Business not found.");

   if ("name" in req.body) {
      const name = text(req.body.name, 40);
      if (name.length < 2)
         return fail(res, 400, "Business name must be at least 2 characters.");
      business.name = name;
   }
   if ("description" in req.body)
      business.description = text(req.body.description, 200);
   if ("affiliateCommission" in req.body) {
      const n = Number(req.body.affiliateCommission);
      if (!(n >= 0 && n <= 90))
         return fail(res, 400, "Commission must be between 0 and 90.");
      business.affiliateCommission = n;
   }
   await business.save();
   res.json({ business });
};

exports.remove = async (req, res) => {
   const business = await Business.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
   });
   if (!business) return fail(res, 404, "Business not found.");
   res.json({ ok: true });
   await Promise.all([
      Record.deleteMany({ business: business._id }),
      Campaign.deleteMany({ business: business._id }),
   ]);
};
