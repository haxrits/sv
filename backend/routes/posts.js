const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// --------------- Multer Config ---------------
// Use memory storage so we can convert to base64 (deployment-friendly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
    }
  },
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post (text, image, or both)
 * @access  Private
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    let image = null;

    // Convert uploaded file buffer to base64 data URL
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      image = `data:${req.file.mimetype};base64,${base64}`;
    }

    // Validate: at least one of text or image is required
    if (!text?.trim() && !image) {
      return res.status(400).json({ message: 'Post must have either text or an image' });
    }

    const post = await Post.create({
      user: req.user._id,
      username: req.user.username,
      text: text?.trim() || undefined,
      image,
      likes: [],
      comments: [],
      likesCount: 0,
      commentsCount: 0,
    });

    // Realtime event
    if (req.io) req.io.emit('new_post', post);

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: error.message || 'Failed to create post' });
  }
});

/**
 * @route   GET /api/posts
 * @desc    Get paginated feed of all posts (newest first)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Run count and fetch in parallel for better performance
    const [total, posts] = await Promise.all([
      Post.countDocuments(),
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // .lean() for faster read-only queries
    ]);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get all posts by a specific user
 * @access  Public
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwnProfile = req.user._id.toString() === targetUser._id.toString();
    const isFollowing = targetUser.followers.some(id => id.toString() === req.user._id.toString());

    if (targetUser.isPrivate && !isOwnProfile && !isFollowing) {
      return res.status(403).json({ message: 'This account is private. Follow to see their posts.' });
    }

    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (error) {
    console.error('Fetch user posts error:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

/**
 * @route   PUT /api/posts/:id/like
 * @desc    Toggle like on a post (like if not liked, unlike if already liked)
 * @access  Private
 */
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already liked this post
    const existingLikeIndex = post.likes.findIndex(
      (like) => like.user.toString() === req.user._id.toString()
    );

    let liked = false;
    if (existingLikeIndex > -1) {
      // User already liked → remove like (unlike)
      post.likes.splice(existingLikeIndex, 1);
    } else {
      // User hasn't liked → add like
      post.likes.push({
        user: req.user._id,
        username: req.user.username,
      });
      liked = true;
    }

    // Update count to stay in sync
    post.likesCount = post.likes.length;
    await post.save();

    if (req.io) req.io.emit('post_updated', post);

    // Send targeted notification to post owner if someone else liked their post
    if (liked && post.user.toString() !== req.user._id.toString()) {
      const targetSocketId = req.onlineUsers?.get(post.user.toString());
      if (targetSocketId) {
        req.io.to(targetSocketId).emit('like_received', {
          sender: {
            _id: req.user._id,
            username: req.user.username,
            profilePic: req.user.profilePic || '',
          },
          post: {
            _id: post._id,
            text: post.text || 'image',
          }
        });
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Failed to update like' });
  }
});

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add comment with user info
    post.comments.push({
      user: req.user._id,
      username: req.user.username,
      text: text.trim(),
    });

    // Update count to stay in sync
    post.commentsCount = post.comments.length;
    await post.save();

    if (req.io) req.io.emit('post_updated', post);

    // Send targeted notification to post owner if someone else commented on their post
    if (post.user.toString() !== req.user._id.toString()) {
      const targetSocketId = req.onlineUsers?.get(post.user.toString());
      if (targetSocketId) {
        req.io.to(targetSocketId).emit('comment_received', {
          sender: {
            _id: req.user._id,
            username: req.user.username,
            profilePic: req.user.profilePic || '',
          },
          post: {
            _id: post._id,
            text: post.text || 'image',
          },
          commentText: text.trim()
        });
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (only by the post author)
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only the post author can delete
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    if (req.io) req.io.emit('post_deleted', req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

module.exports = router;
