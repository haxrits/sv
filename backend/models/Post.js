const mongoose = require('mongoose');

/**
 * Comment sub-document schema.
 * Embedded within each Post to track who commented and what they said.
 */
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Like sub-document schema.
 * Stores user ID and username of each person who liked the post.
 */
const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
});

/**
 * Post Schema — Collection 2 of 2
 * Stores posts with embedded likes and comments arrays.
 * A post must have either text, an image, or both.
 */
const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    maxlength: [2000, 'Post text cannot exceed 2000 characters'],
  },
  image: {
    type: String, // Base64 data URL for deployment compatibility
  },
  likes: [likeSchema],
  comments: [commentSchema],
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validation: post must have at least text or an image
postSchema.pre('validate', function (next) {
  if (!this.text && !this.image) {
    next(new Error('Post must contain either text or an image'));
  } else {
    next();
  }
});

// Index for efficient feed queries (newest first)
postSchema.index({ createdAt: -1 });
// Index for efficient user-specific posts queries (newest first)
postSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
