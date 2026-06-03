import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  CircularProgress, Paper, InputBase, IconButton, Divider, Fade, Chip, Slide
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  ChatBubbleOutline as ChatBubbleIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await API.get('/messages');
        setConversations(data);
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get(`/users/search/${searchQuery}`);
        // Filter out the current user from results
        setSearchResults(data.filter((u) => u._id !== user._id));
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user._id]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA', pb: { xs: 10, sm: 4 } }}>
      <Navbar />

      <Box sx={{ maxWidth: 640, mx: 'auto', mt: { xs: 9, sm: 11 }, px: { xs: 0, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              background: 'linear-gradient(135deg, #0F1419 0%, #536471 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Messages
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            {conversations.length > 0
              ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
              : 'Start a conversation'}
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2.5 }}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 50,
              px: 2,
              py: 0.5,
              bgcolor: searchFocused ? '#fff' : '#EFF3F4',
              border: '2px solid',
              borderColor: searchFocused ? '#0F1419' : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: searchFocused ? '0 4px 20px rgba(15, 20, 25, 0.08)' : 'none',
            }}
          >
            <SearchIcon sx={{ color: searchFocused ? '#0F1419' : '#536471', mr: 1, fontSize: 20, transition: 'color 0.2s' }} />
            <InputBase
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => !searchQuery && setSearchFocused(false)}
              sx={{
                flex: 1,
                fontSize: '0.9rem',
                '& ::placeholder': { color: '#536471', opacity: 1 },
              }}
            />
            {searchQuery && (
              <Fade in>
                <IconButton size="small" onClick={clearSearch} sx={{ bgcolor: '#0F1419', color: '#fff', width: 22, height: 22, '&:hover': { bgcolor: '#333' } }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Fade>
            )}
          </Paper>
        </Box>

        {/* Search Results */}
        {searchQuery && (
          <Fade in timeout={200}>
            <Paper
              elevation={0}
              sx={{
                mx: { xs: 2, sm: 0 },
                mb: 2.5,
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid #EFF3F4',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#FAFBFC' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#536471', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                  {isSearching ? 'Searching...' : searchResults.length > 0 ? `${searchResults.length} result${searchResults.length > 1 ? 's' : ''}` : 'No users found'}
                </Typography>
              </Box>
              {isSearching ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} sx={{ color: '#0F1419' }} />
                </Box>
              ) : (
                <List disablePadding>
                  {searchResults.map((u, idx) => (
                    <ListItem
                      key={u._id}
                      button
                      onClick={() => { navigate(`/chat/${u._id}`); clearSearch(); }}
                      divider={idx !== searchResults.length - 1}
                      sx={{
                        py: 1.5,
                        px: 2,
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: '#F7F9FA' },
                        '&:active': { bgcolor: '#EFF3F4' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Avatar
                          src={u.profilePic}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#0F1419',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                          }}
                        >
                           {u.username ? u.username[0].toUpperCase() : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {u.username}
                          </Typography>
                        }
                        secondary={u.bio ? (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.bio}
                          </Typography>
                        ) : null}
                      />
                      <Chip
                        label="Message"
                        size="small"
                        sx={{
                          bgcolor: '#0F1419',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 28,
                          '&:hover': { bgcolor: '#333' },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Fade>
        )}

        {/* Conversations List */}
        {loading ? (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress size={32} sx={{ color: '#0F1419' }} />
          </Box>
        ) : conversations.length === 0 && !searchQuery ? (
          <Paper
            elevation={0}
            sx={{
              mx: { xs: 2, sm: 0 },
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid #EFF3F4',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#F7F8FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <ChatBubbleIcon sx={{ fontSize: 28, color: '#536471' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>
              No messages yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 280, mx: 'auto', lineHeight: 1.5 }}>
              Search for people above to start a new conversation
            </Typography>
          </Paper>
        ) : !searchQuery && (
          <Paper
            elevation={0}
            sx={{
              mx: { xs: 0, sm: 0 },
              borderRadius: { xs: 0, sm: 4 },
              overflow: 'hidden',
              border: { xs: 'none', sm: '1px solid #EFF3F4' },
              boxShadow: { xs: 'none', sm: '0 2px 16px rgba(0,0,0,0.04)' },
            }}
          >
            <List disablePadding>
              {conversations.map((conv, idx) => (
                <Slide key={conv.user._id} direction="up" in timeout={150 + idx * 50}>
                  <ListItem
                    button
                    onClick={() => navigate(`/chat/${conv.user._id}`)}
                    divider={idx !== conversations.length - 1}
                    sx={{
                      py: 2,
                      px: { xs: 2.5, sm: 2.5 },
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F7F9FA' },
                      '&:active': { bgcolor: '#EFF3F4' },
                      borderLeft: conv.unreadCount > 0 ? '3px solid #0F1419' : '3px solid transparent',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={conv.user.profilePic}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: '#0F1419',
                            fontSize: '1rem',
                            fontWeight: 700,
                            border: conv.unreadCount > 0 ? '2.5px solid #0F1419' : '2px solid #EFF3F4',
                            transition: 'border 0.2s ease',
                          }}
                        >
                           {conv?.user?.username ? conv.user.username[0].toUpperCase() : '?'}
                        </Avatar>
                      </Box>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ ml: 0.5 }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: conv.unreadCount > 0 ? 800 : 600,
                              fontSize: '0.95rem',
                              color: '#0F1419',
                            }}
                          >
                            {conv.user.username}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: conv.unreadCount > 0 ? '#0F1419' : '#536471',
                              fontWeight: conv.unreadCount > 0 ? 700 : 400,
                              fontSize: '0.75rem',
                            }}
                          >
                            {formatTime(conv.latestMessage?.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.3 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '82%',
                              color: conv.unreadCount > 0 ? '#0F1419' : '#536471',
                              fontWeight: conv.unreadCount > 0 ? 600 : 400,
                              fontSize: '0.83rem',
                            }}
                          >
                            {conv.latestMessage.sender._id === user._id || conv.latestMessage.sender === user._id
                              ? `You: ${conv.latestMessage.text}`
                              : conv.latestMessage.text}
                          </Typography>
                          {conv.unreadCount > 0 && (
                            <Box
                              sx={{
                                bgcolor: '#0F1419',
                                color: '#fff',
                                borderRadius: 50,
                                minWidth: 22,
                                height: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                px: 0.8,
                                flexShrink: 0,
                                animation: 'fadeIn 0.3s ease',
                                '@keyframes fadeIn': {
                                  from: { opacity: 0, transform: 'scale(0.5)' },
                                  to: { opacity: 1, transform: 'scale(1)' },
                                },
                              }}
                            >
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Slide>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ChatList;
