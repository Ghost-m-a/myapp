module.exports = (hidden = []) => ({
   virtuals: true,
   versionKey: false,
   transform: (_doc, ret) => {
      delete ret._id;
      hidden.forEach((key) => delete ret[key]);
   },
});
