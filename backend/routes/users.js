const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Multer Config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic')
      .populate('followRequestsSent', 'username profilePic')
      .populate('followRequestsReceived', 'username profilePic');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (bio, profile picture)
 * @access  Private
 */
router.put('/profile', auth, upload.single('profilePic'), async (req, res) => {
  try {
    const { bio } = req.body;
    let profilePic = null;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      profilePic = `data:${req.file.mimetype};base64,${base64}`;
    }

    const updateFields = {};
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (profilePic !== null) updateFields.profilePic = profilePic;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/users/:id/follow
 * @desc    Follow / Unfollow / Request a user
 * @access  Private
 */
router.put('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());
    const isRequestSent = currentUser.followRequestsSent.some(id => id.toString() === targetUser._id.toString());

    if (isFollowing) {
      // Unfollow
      await currentUser.updateOne({ $pull: { following: targetUser._id } });
      await targetUser.updateOne({ $pull: { followers: currentUser._id } });
      res.json({ success: true, status: 'unfollowed', isFollowing: false });
    } else if (isRequestSent) {
      // Cancel request
      await currentUser.updateOne({ $pull: { followRequestsSent: targetUser._id } });
      await targetUser.updateOne({ $pull: { followRequestsReceived: currentUser._id } });
      res.json({ success: true, status: 'request_cancelled', isFollowing: false });
    } else {
      // Send follow request
      await currentUser.updateOne({ $push: { followRequestsSent: targetUser._id } });
      await targetUser.updateOne({ $push: { followRequestsReceived: currentUser._id } });
      res.json({ success: true, status: 'request_sent', isFollowing: false });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/users/:id/accept-request
 * @desc    Accept follow request from a user
 * @access  Private
 */
router.put('/:id/accept-request', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasRequest = currentUser.followRequestsReceived.some(id => id.toString() === targetUser._id.toString());
    if (!hasRequest) {
      return res.status(400).json({ message: 'No pending request from this user' });
    }

    // Move from pending to followers/following
    await currentUser.updateOne({
      $pull: { followRequestsReceived: targetUser._id },
      $push: { followers: targetUser._id }
    });
    await targetUser.updateOne({
      $pull: { followRequestsSent: currentUser._id },
      $push: { following: currentUser._id }
    });

    res.json({ success: true, status: 'accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/users/:id/reject-request
 * @desc    Reject follow request from a user
 * @access  Private
 */
router.put('/:id/reject-request', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from pending lists
    await currentUser.updateOne({ $pull: { followRequestsReceived: targetUser._id } });
    await targetUser.updateOne({ $pull: { followRequestsSent: currentUser._id } });

    res.json({ success: true, status: 'rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/users/suggestions
 * @desc    Get suggested users to follow
 * @access  Private
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const excludedIds = [
      req.user._id,
      ...currentUser.following,
      ...currentUser.followRequestsSent,
      ...currentUser.followRequestsReceived
    ];

    const suggestions = await User.find({
      _id: { $nin: excludedIds }
    })
      .select('username profilePic bio')
      .limit(5);

    res.json(suggestions);
  } catch (error) {
    console.error('Fetch suggestions error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/users/search/:query
 * @desc    Search for users
 * @access  Public
 */
router.get('/search/:query', async (req, res) => {
  try {
    const users = await User.find({
      username: { $regex: req.params.query, $options: 'i' },
    })
      .select('username profilePic bio')
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
