import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, IconButton, Avatar, CircularProgress,
  Paper, AppBar, Toolbar, Menu, MenuItem, ListItemIcon, ListItemText,
  Snackbar, Fade, Tooltip, Slide
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  DeleteOutline as DeleteIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  DeleteSweep as DeleteSweepIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import API from '../api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { id: receiverId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null); // { anchorEl, message }
  const [headerMenu, setHeaderMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // typing & online status states
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [receiverTyping, setReceiverTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
    fetchReceiverProfile();
    markMessagesAsRead();

    const handleReceiveMsg = (newMsg) => {
      if (
        (newMsg.sender._id === receiverId && newMsg.receiver === user._id) ||
        (newMsg.sender._id === user._id && newMsg.receiver === receiverId) ||
        (newMsg.sender === receiverId && newMsg.receiver === user._id) ||
        (newMsg.sender === user._id && newMsg.receiver === receiverId)
      ) {
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender === receiverId || newMsg.sender._id === receiverId) {
          markMessagesAsRead();
        }
      }
    };

    const handleDisplayTyping = ({ senderId }) => {
      if (senderId === receiverId) {
        setReceiverTyping(true);
      }
    };

    const handleHideTyping = ({ senderId }) => {
      if (senderId === receiverId) {
        setReceiverTyping(false);
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleChatBlocked = ({ message }) => {
      setSnackbar({ open: true, message });
    };

    socket.on('receive_message', handleReceiveMsg);
    socket.on('display_typing', handleDisplayTyping);
    socket.on('hide_typing', handleHideTyping);
    socket.on('online_users', handleOnlineUsers);
    socket.on('chat_blocked', handleChatBlocked);

    // Register immediately to get active online list
    socket.emit('register_user', user._id);

    return () => {
      socket.off('receive_message', handleReceiveMsg);
      socket.off('display_typing', handleDisplayTyping);
      socket.off('hide_typing', handleHideTyping);
      socket.off('online_users', handleOnlineUsers);
      socket.off('chat_blocked', handleChatBlocked);
    };
  }, [receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user) {
        socket.emit('stop_typing', { senderId: user._id, receiverId });
      }
    };
  }, [receiverId, user]);

  const fetchChatHistory = async () => {
    try {
      const { data } = await API.get(`/messages/${receiverId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await API.put(`/messages/mark-read/${receiverId}`);
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const fetchReceiverProfile = async () => {
    try {
      const { data } = await API.get(`/users/${receiverId}`);
      setReceiver(data);
    } catch (err) {
      console.error('Failed to load receiver', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit('send_message', {
      sender: user._id,
      receiver: receiverId,
      text: inputText.trim()
    });

    setInputText('');
    inputRef.current?.focus();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    socket.emit('stop_typing', { senderId: user._id, receiverId });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (!socket.connected) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { senderId: user._id, receiverId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { senderId: user._id, receiverId });
    }, 1500);
  };

  const isOnline = onlineUsers.includes(receiverId);
  const isAccepted = receiver && user && (
    receiver.followers.some(f => (f._id || f) === user._id) ||
    receiver.following.some(f => (f._id || f) === user._id)
  );

  // Like / Unlike a message
  const handleLike = async (msg) => {
    try {
      const { data } = await API.put(`/messages/${msg._id}/like`);
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, liked: data.liked } : m))
      );
    } catch (err) {
      console.error('Like failed', err);
    }
    setContextMenu(null);
  };

  // Delete a single message
  const handleDelete = async (msg) => {
    try {
      await API.delete(`/messages/${msg._id}`);
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      setSnackbar({ open: true, message: 'Message deleted' });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete';
      setSnackbar({ open: true, message: errorMsg });
    }
    setContextMenu(null);
  };

  // Copy message text
  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.text);
    setSnackbar({ open: true, message: 'Copied to clipboard' });
    setContextMenu(null);
  };

  // Delete entire conversation
  const handleDeleteConversation = async () => {
    try {
      await API.delete(`/messages/conversation/${receiverId}`);
      setSnackbar({ open: true, message: 'Conversation deleted' });
      navigate('/chat');
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete conversation' });
    }
    setHeaderMenu(null);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDateDivider = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  // Group messages by date for date dividers
  const getDateKey = (dateStr) => new Date(dateStr).toDateString();

  if (loading || !receiver) {
    return (
      <Box display="flex" justifyContent="center" height="100vh" alignItems="center" sx={{ bgcolor: '#F7F8FA' }}>
        <CircularProgress size={32} sx={{ color: '#0F1419' }} />
      </Box>
    );
  }

  // Render messages with date dividers
  let lastDateKey = null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F7F8FA' }}>
      {/* Chat Header */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EFF3F4',
          zIndex: 10,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' }, px: { xs: 1, sm: 2 } }}>
          <IconButton
            edge="start"
            onClick={() => navigate('/chat')}
            sx={{
              mr: 0.5,
              color: '#0F1419',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: '#EFF3F4' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Avatar
            src={receiver.profilePic}
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              mr: 1.5,
              bgcolor: '#0F1419',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: '2px solid #EFF3F4',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
            onClick={() => navigate(`/profile/${receiverId}`)}
          >
            {receiver.username[0].toUpperCase()}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                color: '#0F1419',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={() => navigate(`/profile/${receiverId}`)}
            >
              {receiver.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: isOnline ? '#10B981' : '#A0AEC0',
                  boxShadow: isOnline ? '0 0 8px #10B981' : 'none',
                }}
              />
              <Typography variant="caption" sx={{ color: '#536471', fontSize: '0.75rem', fontWeight: 600 }}>
                {receiverTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={(e) => setHeaderMenu(e.currentTarget)}
            sx={{ color: '#536471', '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' } }}
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={headerMenu}
            open={Boolean(headerMenu)}
            onClose={() => setHeaderMenu(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #EFF3F4',
              },
            }}
          >
            <MenuItem onClick={() => { navigate(`/profile/${receiverId}`); setHeaderMenu(null); }}>
              <ListItemIcon><Avatar src={receiver.profilePic} sx={{ width: 24, height: 24, bgcolor: '#0F1419', fontSize: '0.6rem' }}>{receiver.username[0]}</Avatar></ListItemIcon>
              <ListItemText primary="View Profile" />
            </MenuItem>
            <MenuItem onClick={handleDeleteConversation} sx={{ color: '#FF4757' }}>
              <ListItemIcon><DeleteSweepIcon fontSize="small" sx={{ color: '#FF4757' }} /></ListItemIcon>
              <ListItemText primary="Delete Conversation" primaryTypographyProps={{ color: '#FF4757', fontWeight: 600 }} />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: { xs: 1.5, sm: 3 },
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#C4C4C4', borderRadius: 2 },
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Avatar
              src={receiver.profilePic}
              sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: '#0F1419', fontSize: '1.5rem', fontWeight: 700, border: '3px solid #EFF3F4' }}
            >
              {receiver.username[0].toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.05rem' }}>
              {receiver.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Say hello to start the conversation 👋
            </Typography>
          </Box>
        )}

        {messages.map((msg, idx) => {
          const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
          const isSender = senderId === user._id;
          const currentDateKey = getDateKey(msg.createdAt);
          const showDateDivider = currentDateKey !== lastDateKey;
          lastDateKey = currentDateKey;

          return (
            <Box key={msg._id || idx}>
              {/* Date Divider */}
              {showDateDivider && (
                <Fade in timeout={300}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2.5 }}>
                    <Box
                      sx={{
                        bgcolor: '#EFF3F4',
                        color: '#536471',
                        px: 2,
                        py: 0.5,
                        borderRadius: 50,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {formatDateDivider(msg.createdAt)}
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Message Bubble */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isSender ? 'flex-end' : 'flex-start',
                  mb: 0.8,
                  px: { xs: 0, sm: 1 },
                  animation: 'slideUp 0.2s ease-out',
                  '@keyframes slideUp': {
                    from: { opacity: 0, transform: 'translateY(8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Box
                  sx={{
                    maxWidth: { xs: '82%', sm: '65%' },
                    position: 'relative',
                    group: 'message',
                  }}
                >
                  <Paper
                    elevation={0}
                    onClick={(e) => {
                      setContextMenu({ anchorEl: e.currentTarget, message: msg });
                    }}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: isSender ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      bgcolor: isSender ? '#0F1419' : '#FFFFFF',
                      color: isSender ? '#fff' : '#0F1419',
                      border: isSender ? 'none' : '1px solid #EFF3F4',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        transform: 'scale(1.01)',
                        boxShadow: isSender ? '0 4px 16px rgba(15,20,25,0.2)' : '0 4px 16px rgba(0,0,0,0.06)',
                      },
                      '&:active': { transform: 'scale(0.99)' },
                      position: 'relative',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '0.92rem' },
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </Typography>

                    {/* Time + Status Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        mt: 0.3,
                      }}
                    >
                      {msg.liked && (
                        <FavoriteIcon sx={{ fontSize: 12, color: isSender ? '#FF6B81' : '#FF4757' }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: isSender ? 'rgba(255,255,255,0.5)' : '#A0AEC0',
                          fontWeight: 500,
                        }}
                      >
                        {formatTime(msg.createdAt)}
                      </Typography>
                      {isSender && (
                        msg.read
                          ? <DoneAllIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }} />
                          : <DoneIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }} />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Box>
          );
        })}

        {receiverTyping && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              mb: 1.5,
              px: { xs: 0, sm: 1 },
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #EFF3F4',
                px: 2,
                py: 1.2,
                borderRadius: '18px 18px 18px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <Box
                className="typing-dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#536471',
                  animation: 'typingBounce 1.4s infinite both',
                  animationDelay: '0s',
                }}
              />
              <Box
                className="typing-dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#536471',
                  animation: 'typingBounce 1.4s infinite both',
                  animationDelay: '0.2s',
                }}
              />
              <Box
                className="typing-dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#536471',
                  animation: 'typingBounce 1.4s infinite both',
                  animationDelay: '0.4s',
                }}
              />
            </Box>
            <style>{`
              @keyframes typingBounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-5px); }
              }
            `}</style>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Context Menu for Messages */}
      <Menu
        anchorEl={contextMenu?.anchorEl}
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            border: '1px solid #EFF3F4',
            py: 0.5,
          },
        }}
      >
        <MenuItem onClick={() => contextMenu?.message && handleLike(contextMenu.message)}>
          <ListItemIcon>
            {contextMenu?.message?.liked
              ? <FavoriteIcon fontSize="small" sx={{ color: '#FF4757' }} />
              : <FavoriteBorderIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText primary={contextMenu?.message?.liked ? 'Unlike' : 'Like'} />
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.message && handleCopy(contextMenu.message)}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copy Text" />
        </MenuItem>
        {/* Only show delete for own messages */}
        {contextMenu?.message && (typeof contextMenu.message.sender === 'object'
          ? contextMenu.message.sender._id === user._id
          : contextMenu.message.sender === user._id) && (
          <MenuItem onClick={() => handleDelete(contextMenu.message)} sx={{ color: '#FF4757' }}>
            <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#FF4757' }} /></ListItemIcon>
            <ListItemText primary="Delete" primaryTypographyProps={{ color: '#FF4757' }} />
          </MenuItem>
        )}
      </Menu>

      {/* Input Area */}
      {!isAccepted ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            borderTop: '1px solid #EFF3F4',
            bgcolor: 'rgba(255, 241, 242, 0.45)',
            pb: { xs: 5, sm: 3 },
          }}
        >
          <Typography variant="body2" sx={{ color: '#E11D48', fontWeight: 700, mb: 1.5, fontSize: '0.85rem' }}>
            🔒 Chatting is only allowed with accepted follow relationships
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(`/profile/${receiverId}`)}
            sx={{
              borderRadius: 50,
              bgcolor: '#0F1419',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              px: 2.5,
              '&:hover': { bgcolor: '#1A2530' }
            }}
          >
            Go to Profile
          </Button>
        </Paper>
      ) : (
        <Paper
          component="form"
          onSubmit={sendMessage}
          elevation={0}
          sx={{
            px: { xs: 1.5, sm: 2.5 },
            py: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderTop: '1px solid #EFF3F4',
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            pb: { xs: 3.5, sm: 1.2 },
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            autoComplete="off"
            inputRef={inputRef}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 50,
                bgcolor: '#F7F8FA',
                fontSize: '0.9rem',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: '#EFF3F4' },
                '&.Mui-focused fieldset': { borderColor: '#0F1419', borderWidth: 1.5 },
              },
            }}
          />
          <IconButton
            type="submit"
            disabled={!inputText.trim()}
            sx={{
              bgcolor: inputText.trim() ? '#0F1419' : '#EFF3F4',
              color: inputText.trim() ? '#fff' : '#A0AEC0',
              width: 40,
              height: 40,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: inputText.trim() ? '#333' : '#EFF3F4',
                transform: inputText.trim() ? 'scale(1.05)' : 'none',
              },
              '&:active': { transform: 'scale(0.95)' },
              '&.Mui-disabled': {
                bgcolor: '#EFF3F4',
                color: '#A0AEC0',
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            bgcolor: '#0F1419',
            borderRadius: 3,
            fontWeight: 600,
            fontSize: '0.85rem',
            minWidth: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
        }}
      />
    </Box>
  );
};

export default Chat;
