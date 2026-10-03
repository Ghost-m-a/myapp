const Notification = require("../models/Notification");

exports.list = async (req, res) => {
   const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
   res.json({ notifications });
};

exports.readAll = async (req, res) => {
   await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true },
   );
   res.json({ ok: true });
};
