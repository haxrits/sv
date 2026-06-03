const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --- Validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} is already taken` });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create user ---
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // --- Developer Seeding Logic & Auto-Follow ---
    try {
      let rithik = await User.findOne({ username: 'rithik' });
      if (!rithik) {
        // Create developer rithik
        const rithikPassword = await bcrypt.hash('rithik_dev_admin_2026', salt);
        rithik = await User.create({
          username: 'rithik',
          email: 'rithik@socialvibe.com',
          password: rithikPassword,
          bio: "Official Developer & Admin of SocialVibe. Let's vibe together! 🚀✨",
          isPrivate: false,
        });
      }

      // Check if rithik has posts
      const rithikPostsCount = await Post.countDocuments({ user: rithik._id });
      if (rithikPostsCount === 0) {
        await Post.create([
          {
            user: rithik._id,
            username: 'rithik',
            text: `Welcome to SocialVibe! 🌟 "Code is like humor. When you have to explain it, it’s bad." - Cory House. I built this space to make connections smooth, visually stunning, and highly secure. Let's start sharing our vibe!`,
          },
          {
            user: rithik._id,
            username: 'rithik',
            text: `Tip from the Developer 💡: SocialVibe now supports Private Accounts! Go to your profile edit settings and check "Private Account" to secure your Creative Board & restrict chats to accepted followers only.`,
          },
          {
            user: rithik._id,
            username: 'rithik',
            text: `About the Project: SocialVibe is built with a modern MERN stack. It features real-time WebSocket chat, typing indicators, online statuses, glassmorphic UI design, parallax wave animations, and instant toast notifications. Handcrafted by Rithik. 💻🚀`,
          }
        ]);
      }

      // Automatically establish follow relationship between new user and rithik
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { following: rithik._id }
      });
      await User.findByIdAndUpdate(rithik._id, {
        $addToSet: { followers: user._id }
      });
    } catch (seedErr) {
      console.error('Failed to seed developer account or auto-follow:', seedErr);
    }

    // --- Generate JWT ---
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // --- Compare passwords ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // --- Generate JWT ---
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (requires JWT)
 */
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    },
  });
});

module.exports = router;
