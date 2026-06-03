const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get total unread message count for the current user
 * @access  Private
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/messages/:userId
 * @desc    Get chat history directly with a user
 * @access  Private
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const isAccepted = currentUser.following.some(id => id.toString() === targetUser._id.toString()) || 
                       currentUser.followers.some(id => id.toString() === targetUser._id.toString());

    if (!isAccepted) {
      return res.status(403).json({ message: 'Chat is only allowed with accepted follow relationships' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/messages
 * @desc    Get list of all conversations for the active user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // Find all unique users the current user has chatted with
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePic')
      .populate('receiver', 'username profilePic');

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Determine the "other" user
      const isSender = msg.sender._id.toString() === req.user._id.toString();
      const otherUser = isSender ? msg.receiver : msg.sender;

      // Group by other user ID, keeping the latest message
      if (!conversationsMap.has(otherUser._id.toString())) {
        conversationsMap.set(otherUser._id.toString(), {
          user: otherUser,
          latestMessage: msg,
          unreadCount: 0,
        });
      }

      // If this message was sent TO the current user and is NOT read, increment unread count
      if (msg.receiver._id.toString() === req.user._id.toString() && !msg.read) {
        const conv = conversationsMap.get(otherUser._id.toString());
        conv.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/messages/mark-read/:senderId
 * @desc    Mark all messages from senderId to current user as read
 * @access  Private
 */
router.put('/mark-read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   PUT /api/messages/:messageId/like
 * @desc    Toggle like on a message
 * @access  Private
 */
router.put('/:messageId/like', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow liking messages in conversations involving this user
    const userId = req.user._id.toString();
    if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.liked = !message.liked;
    await message.save();

    res.json({ success: true, liked: message.liked, messageId: message._id });
  } catch (error) {
    console.error('Like message error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message (only sender can delete)
 * @access  Private
 */
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({ success: true, messageId: req.params.messageId });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   DELETE /api/messages/conversation/:userId
 * @desc    Delete entire conversation with a user
 * @access  Private
 */
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
