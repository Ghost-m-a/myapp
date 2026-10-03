const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { welcome, ensureTeam } = require("./messageController");
const { fail } = require("../utils/http");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validAvatar = (a) =>
   typeof a === "string" && a.startsWith("data:image/") && a.length <= 150000;

function sendToken(res, user, remember) {
   const days = remember ? 30 : 1;
   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: `${days}d`,
   });
   const options = {
      httpOnly: true, // JavaScript can't read it
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // https only on Vercel
      path: "/",
   };
   if (remember) options.maxAge = days * 24 * 60 * 60 * 1000; // otherwise a session cookie
   res.cookie("token", token, options);
}

// "John.Doe@x.com" -> "johndoe", then johndoe2, johndoe3... if taken
async function makeUsername(email) {
   const base =
      email
         .split("@")[0]
         .toLowerCase()
         .replace(/[^a-z0-9_]/g, "")
         .slice(0, 20) || "user";
   let username = base;
   let n = 1;
   while (await User.exists({ username })) username = `${base}${++n}`;
   return username;
}

exports.signup = async (req, res) => {
   const name = String(req.body.name || "").trim();
   const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
   const { password, role, avatar, ref } = req.body;

   if (!name || name.length > 60)
      return fail(res, 400, "Please enter your name.");
   if (!EMAIL.test(email)) return fail(res, 400, "Please enter a valid email.");
   if (typeof password !== "string" || password.length < 6)
      return fail(res, 400, "Password must be at least 6 characters.");
   if (password.length > 72) return fail(res, 400, "Password is too long.");
   if (!["advertiser", "creator"].includes(role))
      return fail(res, 400, "Please choose a role.");
   if (avatar && !validAvatar(avatar))
      return fail(res, 400, "Invalid profile picture.");

   if (await User.exists({ email }))
      return fail(res, 409, "An account with this email already exists.");

   await ensureTeam(); // reserves the "team" username before anyone can take it
   const referrer = ref
      ? await User.findOne({ referralCode: String(ref) })
      : null;

   const user = await User.create({
      name,
      email,
      username: await makeUsername(email),
      passwordHash: await bcrypt.hash(password, 10),
      role,
      avatar: avatar || null,
      referredBy: referrer ? referrer._id : null,
      referralCode: crypto.randomBytes(4).toString("hex"),
   });

   await Notification.insertMany([
      { user: user.id, text: "Welcome to MyApp! Your account is ready." },
      { user: user.id, text: "You received 100 free credits." },
   ]);
   if (referrer) {
      await Notification.create({
         user: referrer._id,
         text: `${name} joined using your referral link.`,
      });
   }
   await welcome(user).catch(console.error);

   sendToken(res, user, true);
   res.status(201).json({ user });
};

exports.login = async (req, res) => {
   const id = String(req.body.identifier || "")
      .trim()
      .toLowerCase();
   const password = String(req.body.password || "");

   const user = await User.findOne({ $or: [{ email: id }, { username: id }] });
   const ok =
      user &&
      !user.isSystem &&
      (await bcrypt.compare(password, user.passwordHash));
   if (!ok) return fail(res, 401, "Wrong email/username or password.");

   sendToken(res, user, req.body.remember !== false);
   res.json({ user });
};

exports.logout = (req, res) => {
   res.clearCookie("token", { path: "/" });
   res.json({ ok: true });
};

exports.me = (req, res) => res.json({ user: req.user });

exports.updateMe = async (req, res) => {
   const user = req.user;
   const body = req.body;

   if ("name" in body) {
      const name = String(body.name).trim();
      if (!name || name.length > 60)
         return fail(res, 400, "Please enter a valid name.");
      user.name = name;
   }
   if ("avatar" in body) {
      if (body.avatar !== null && !validAvatar(body.avatar))
         return fail(res, 400, "Invalid profile picture.");
      user.avatar = body.avatar;
   }
   if ("language" in body) user.language = body.language; // validated by the schema enum
   if ("theme" in body) user.theme = body.theme;
   if ("economicIntel" in body)
      user.economicIntel = Boolean(body.economicIntel);

   await user.save();
   res.json({ user });
};

exports.changePassword = async (req, res) => {
   const { current, next } = req.body;

   if (!(await bcrypt.compare(String(current || ""), req.user.passwordHash)))
      return fail(res, 400, "Current password is incorrect.");
   if (typeof next !== "string" || next.length < 6 || next.length > 72)
      return fail(res, 400, "New password must be 6 to 72 characters.");

   req.user.passwordHash = await bcrypt.hash(next, 10);
   await req.user.save();
   res.json({ ok: true });
};
