const asyncHandler = (fn) => (req, res, next) =>
   Promise.resolve(fn(req, res, next)).catch(next);

const fail = (res, status, message) => res.status(status).json({ message });

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { asyncHandler, fail, escapeRegex };
