const Campaign = require("../models/Campaign");
const Business = require("../models/Business");
const { fail, escapeRegex } = require("../utils/http");

const PLATFORMS = ["tiktok", "instagram", "youtube", "x"];
const CATEGORIES = [
   "gaming",
   "technology",
   "finance",
   "lifestyle",
   "music",
   "other",
];
const txt = (v, max) =>
   String(v ?? "")
      .trim()
      .slice(0, max);

const shape = (c, me) => ({
   id: c.id,
   title: c.title,
   description: c.description,
   category: c.category,
   cpm: c.cpm,
   budget: c.budget,
   spent: 0, // becomes real when clip submissions are tracked
   platforms: c.platforms,
   participants: c.participants.length,
   joined: c.participants.some((p) => p.equals(me._id)),
   mine: Boolean(c.business?.owner && c.business.owner.equals(me._id)),
   business: c.business ? { id: c.business.id, name: c.business.name } : null,
   createdAt: c.createdAt,
});

exports.list = async (req, res) => {
   const q = txt(req.query.q, 40);
   const filter = q ? { title: { $regex: escapeRegex(q), $options: "i" } } : {};
   const sort =
      req.query.sort === "cpm"
         ? { cpm: -1 }
         : req.query.sort === "budget"
           ? { budget: -1 }
           : { createdAt: -1 };

   const list = await Campaign.find(filter)
      .sort(sort)
      .limit(60)
      .populate("business", "name owner");
   res.json({ campaigns: list.map((c) => shape(c, req.user)) });
};

exports.create = async (req, res) => {
   const business = await Business.findOne({
      _id: req.body.businessId,
      owner: req.user._id,
   });
   if (!business) return fail(res, 400, "Choose one of your businesses.");

   const title = txt(req.body.title, 80);
   if (title.length < 3)
      return fail(res, 400, "Title must be at least 3 characters.");

   const cpm = Number(req.body.cpm);
   const budget = Number(req.body.budget);
   if (!(cpm > 0 && cpm <= 1000))
      return fail(res, 400, "Pay per 1K views must be between 0.01 and 1000.");
   if (!(budget >= 1 && budget <= 1000000))
      return fail(res, 400, "Budget must be between 1 and 1,000,000.");

   const platforms = []
      .concat(req.body.platforms || [])
      .filter((p) => PLATFORMS.includes(p));
   if (!platforms.length) return fail(res, 400, "Pick at least one platform.");

   const campaign = await Campaign.create({
      business: business._id,
      title,
      description: txt(req.body.description, 500),
      category: CATEGORIES.includes(req.body.category)
         ? req.body.category
         : "other",
      cpm,
      budget,
      platforms,
   });
   await campaign.populate("business", "name owner");
   res.status(201).json({ campaign: shape(campaign, req.user) });
};

exports.join = async (req, res) => {
   const campaign = await Campaign.findById(req.params.id).populate(
      "business",
      "name owner",
   );
   if (!campaign) return fail(res, 404, "Campaign not found.");
   if (campaign.business?.owner?.equals(req.user._id))
      return fail(res, 400, "You can't join your own campaign.");

   const joined = campaign.participants.some((p) => p.equals(req.user._id));
   await Campaign.updateOne(
      { _id: campaign._id },
      joined
         ? { $pull: { participants: req.user._id } }
         : { $addToSet: { participants: req.user._id } },
   );
   res.json({
      joined: !joined,
      participants: campaign.participants.length + (joined ? -1 : 1),
   });
};

exports.remove = async (req, res) => {
   const campaign = await Campaign.findById(req.params.id).populate(
      "business",
      "owner",
   );
   if (!campaign || !campaign.business?.owner?.equals(req.user._id))
      return fail(res, 404, "Campaign not found.");
   await campaign.deleteOne();
   res.json({ ok: true });
};
