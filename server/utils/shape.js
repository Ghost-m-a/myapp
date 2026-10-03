// Only the fields that are safe to show to other users
exports.pub = (u) => ({
   id: u.id,
   name: u.name,
   username: u.username,
   avatar: u.avatar,
   role: u.role,
   isSystem: Boolean(u.isSystem),
});
