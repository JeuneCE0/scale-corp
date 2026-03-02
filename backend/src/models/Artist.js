const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String },
  speciality: { type: String },
  portfolio: [
    {
      title: String,
      imageUrl: String,
      description: String,
    },
  ],
  contact: {
    email: String,
    website: String,
    social: {
      instagram: String,
      twitter: String,
    },
  },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Artist', artistSchema);
