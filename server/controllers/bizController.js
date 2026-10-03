const mongoose = require("mongoose");
const Record = require("../models/Record");
const Business = require("../models/Business");
const kinds = require("../utils/kinds");
const { fail } = require("../utils/http");

const MAX_PER_KIND = 300;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bad = (message) => Object.assign(new Error(message), { bad: true });
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

exports.spec = (req, res) => res.json({ kinds });

// Every /api/biz/:businessId/... request must belong to the logged-in owner
exports.load = async (req, res, next) => {
   const business = await Business.findOne({
      _id: req.params.businessId,
      owner: req.user._id,
   });
   if (!business) return fail(res, 404, "Business not found.");
   req.business = business;
   next();
};

// ---------- validation ----------
async function build(kind, body, business, prev = {}) {
   const data = { ...prev };

   for (const fld of kinds[kind].fields) {
      if (!(fld.name in body) && fld.name in prev) continue;
      let v = body[fld.name];

      if (v === undefined || v === null || v === "") {
         if (fld.required) throw bad(`${fld.label} is required.`);
         if (fld.default !== undefined) data[fld.name] = fld.default;
         else delete data[fld.name];
         continue;
      }

      switch (fld.type) {
         case "number":
            v = Number(v);
            if (
               !Number.isFinite(v) ||
               v < (fld.min ?? 0) ||
               v > (fld.max ?? 1e9)
            )
               throw bad(
                  `${fld.label} must be between ${fld.min ?? 0} and ${fld.max ?? 1e9}.`,
               );
            data[fld.name] = round2(v);
            break;
         case "bool":
            data[fld.name] = v === true || v === "true" || v === "on";
            break;
         case "enum":
            if (!fld.options.includes(v))
               throw bad(`Invalid ${fld.label.toLowerCase()}.`);
            data[fld.name] = v;
            break;
         case "ref":
            if (
               !mongoose.isValidObjectId(v) ||
               !(await Record.exists({
                  _id: v,
                  business: business._id,
                  kind: fld.ref,
               }))
            )
               throw bad(`Choose a valid ${fld.label.toLowerCase()}.`);
            data[fld.name] = String(v);
            break;
         default: {
            v = String(v)
               .trim()
               .slice(0, fld.max || 200);
            if (fld.upper) v = v.toUpperCase();
            if (fld.type === "email" && !EMAIL.test(v))
               throw bad(`${fld.label} is not a valid email.`);
            data[fld.name] = v;
         }
      }
   }
   return data;
}

// ---------- money ----------
async function totals(businessId, since) {
   const match = {
      business: businessId,
      kind: "payment",
      "data.status": "succeeded",
   };
   if (since) match.createdAt = { $gte: since };
   const rows = await Record.aggregate([
      { $match: match },
      {
         $group: {
            _id: "$data.type",
            sum: { $sum: "$data.amount" },
            n: { $sum: 1 },
         },
      },
   ]);
   const t = { payment: 0, deposit: 0, withdrawal: 0, count: 0 };
   rows.forEach((r) => {
      t[r._id] = round2(r.sum);
      if (r._id === "payment") t.count = r.n;
   });
   t.balance = round2(t.payment + t.deposit - t.withdrawal);
   return t;
}

// ---------- records ----------
exports.list = async (req, res) => {
   const { kind } = req.params;
   if (!kinds[kind]) return fail(res, 404, "Unknown type.");
   const bid = req.business._id;

   const rows = (
      await Record.find({ business: bid, kind })
         .sort({ createdAt: -1 })
         .limit(200)
   ).map((d) => d.toJSON());

   if (kind === "product" || kinds[kind].fields.some((f) => f.type === "ref")) {
      const products = await Record.find({ business: bid, kind: "product" });
      const names = Object.fromEntries(
         products.map((p) => [p.id, p.data.name]),
      );

      let sold = {};
      if (kind === "product") {
         const agg = await Record.aggregate([
            {
               $match: {
                  business: bid,
                  kind: "payment",
                  "data.status": "succeeded",
                  "data.type": "payment",
               },
            },
            {
               $group: {
                  _id: "$data.product",
                  n: { $sum: 1 },
                  revenue: { $sum: "$data.amount" },
               },
            },
         ]);
         sold = Object.fromEntries(agg.map((a) => [a._id, a]));
      }
      rows.forEach((r) => {
         r.productName = names[r.product] || "";
         if (kind === "product") {
            r.sales = sold[r.id]?.n || 0;
            r.revenue = round2(sold[r.id]?.revenue || 0);
         }
      });
   }
   res.json({ records: rows });
};

exports.create = async (req, res) => {
   const { kind } = req.params;
   if (!kinds[kind]) return fail(res, 404, "Unknown type.");
   const business = req.business;

   try {
      if (
         (await Record.countDocuments({ business: business._id, kind })) >=
         MAX_PER_KIND
      )
         throw bad(
            "You've reached the limit for this page. Delete something first.",
         );

      const data = await build(kind, req.body, business);

      if (kind === "payment") {
         if (data.type === "payment" && !data.email)
            throw bad("Customer email is required for payments.");
         if (data.type === "withdrawal" && data.status === "succeeded") {
            const t = await totals(business._id);
            if (data.amount > t.balance)
               throw bad("Not enough balance for this withdrawal.");
         }
      }

      const record = await Record.create({
         business: business._id,
         kind,
         data,
      });
      res.status(201).json({ record });
   } catch (err) {
      if (err.bad) return fail(res, 400, err.message);
      throw err;
   }
};

exports.update = async (req, res) => {
   const { kind, id } = req.params;
   if (!kinds[kind]) return fail(res, 404, "Unknown type.");
   if (kinds[kind].immutable)
      return fail(
         res,
         403,
         "This can't be edited. Delete it and add a new one.",
      );

   const record = await Record.findOne({
      _id: id,
      business: req.business._id,
      kind,
   });
   if (!record) return fail(res, 404, "Not found.");

   try {
      const before = record.data;
      const data = await build(kind, req.body, req.business, before);

      // Marking an invoice as paid books the money
      if (
         kind === "invoice" &&
         before.status !== "paid" &&
         data.status === "paid"
      ) {
         await Record.create({
            business: req.business._id,
            kind: "payment",
            data: {
               type: "payment",
               amount: data.amount,
               email: data.email,
               method: "manual",
               status: "succeeded",
            },
         });
      }

      record.data = data;
      record.markModified("data");
      await record.save();
      res.json({ record });
   } catch (err) {
      if (err.bad) return fail(res, 400, err.message);
      throw err;
   }
};

exports.remove = async (req, res) => {
   const { kind, id } = req.params;
   if (!kinds[kind]) return fail(res, 404, "Unknown type.");
   const record = await Record.findOneAndDelete({
      _id: id,
      business: req.business._id,
      kind,
   });
   if (!record) return fail(res, 404, "Not found.");
   res.json({ ok: true });
};

// ---------- stats ----------
exports.stats = async (req, res) => {
   const bid = req.business._id;
   const days = Math.min(365, Math.max(1, Number(req.query.days) || 14));

   const since = new Date();
   since.setUTCHours(0, 0, 0, 0);
   since.setUTCDate(since.getUTCDate() - (days - 1));

   const [all, win, daily, customerEmails, kindCounts] = await Promise.all([
      totals(bid),
      totals(bid, since),
      Record.aggregate([
         {
            $match: {
               business: bid,
               kind: "payment",
               "data.status": "succeeded",
               createdAt: { $gte: since },
            },
         },
         {
            $group: {
               _id: {
                  d: {
                     $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  t: "$data.type",
               },
               sum: { $sum: "$data.amount" },
            },
         },
      ]),
      Record.distinct("data.email", {
         business: bid,
         kind: "payment",
         "data.status": "succeeded",
         "data.type": "payment",
      }),
      Record.aggregate([
         { $match: { business: bid } },
         { $group: { _id: "$kind", n: { $sum: 1 } } },
      ]),
   ]);

   const byDay = {};
   daily.forEach((r) => {
      const d = (byDay[r._id.d] ||= { in: 0, out: 0 });
      if (r._id.t === "withdrawal") d.out += r.sum;
      else d.in += r.sum;
   });

   const series = [];
   for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000)
         .toISOString()
         .slice(0, 10);
      series.push({
         day: d,
         in: round2(byDay[d]?.in || 0),
         out: round2(byDay[d]?.out || 0),
      });
   }

   const winIn = round2(win.payment + win.deposit);
   const customers = customerEmails.filter(Boolean).length;

   res.json({
      balance: all.balance,
      revenue: all.payment,
      payments: all.count,
      customers,
      avg: customers ? round2(all.payment / customers) : 0,
      today: series[series.length - 1].in,
      window: {
         in: winIn,
         out: win.withdrawal,
         deposits: win.deposit,
         withdrawals: win.withdrawal,
         start: round2(all.balance - (winIn - win.withdrawal)),
      },
      series,
      counts: Object.fromEntries(kindCounts.map((k) => [k._id, k.n])),
   });
};

exports.customers = async (req, res) => {
   const rows = await Record.aggregate([
      {
         $match: {
            business: req.business._id,
            kind: "payment",
            "data.status": "succeeded",
            "data.type": "payment",
            "data.email": { $exists: true, $ne: "" },
         },
      },
      {
         $group: {
            _id: "$data.email",
            spend: { $sum: "$data.amount" },
            payments: { $sum: 1 },
            joined: { $min: "$createdAt" },
            last: { $max: "$createdAt" },
         },
      },
      { $sort: { last: -1 } },
      { $limit: 200 },
   ]);
   res.json({
      customers: rows.map((r) => ({
         email: r._id,
         spend: round2(r.spend),
         payments: r.payments,
         joined: r.joined,
         last: r.last,
      })),
   });
};
