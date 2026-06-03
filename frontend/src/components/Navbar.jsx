import { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem,
  IconButton, Divider, ListItemIcon, ListItemText, BottomNavigation, BottomNavigationAction, Paper, Badge,
  Snackbar, Slide, Dialog, DialogContent, TextField, List, ListItem, CircularProgress
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  HomeRounded as HomeIcon,
  ChatBubbleRounded as ChatIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { socket } from '../api/socket';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Global toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('message'); // 'message' or 'post'
  const [toastSender, setToastSender] = useState(null); // { id, username, profilePic }

  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await API.get(`/users/search/${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/messages/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (newMsg) => {
      const senderId = typeof newMsg.sender === 'object' ? newMsg.sender._id : newMsg.sender;
      if (senderId !== user._id) {
        const isOnChatWithSender = location.pathname === `/chat/${senderId}`;
        if (!isOnChatWithSender) {
          setUnreadCount((prev) => prev + 1);
          setToastSender({
            id: senderId,
            username: newMsg.sender.username || 'Someone',
            profilePic: newMsg.sender.profilePic
          });
          setToastMessage(newMsg.text);
          setToastType('message');
          setToastOpen(true);
        }
      }
    };

    const handleNewPost = (post) => {
      if (post.user !== user._id) {
        setToastSender({
          id: post.user,
          username: post.username,
          profilePic: null
        });
        setToastMessage(`${post.username} just shared a new post! ✨`);
        setToastType('post');
        setToastOpen(true);
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('new_post', handleNewPost);
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('new_post', handleNewPost);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const currentNav = location.pathname.startsWith('/profile') ? 2 :
                     location.pathname.startsWith('/chat') ? 1 : 0;

  return (
    <>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #EFF3F4',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 580, width: '100%', mx: 'auto', minHeight: { xs: '52px !important', sm: '60px !important' }, px: { xs: 2, sm: 2 } }}>
          {/* Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.75 },
              '&:active': { opacity: 0.5 },
            }}
            onClick={() => navigate('/feed')}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: '#0F1419',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15,20,25,0.15)',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.78rem', letterSpacing: '-0.5px' }}>
                SV
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.5px',
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                color: '#0F1419',
                display: 'block',
              }}
            >
              SocialVibe
            </Typography>
          </Box>

          {/* User Section (Desktop) */}
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5, mr: 1 }}>
                <IconButton
                  onClick={() => setSearchOpen(true)}
                  sx={{
                    color: '#536471',
                    width: 38,
                    height: 38,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 22 }} />
                </IconButton>
                <IconButton
                  onClick={() => navigate('/chat')}
                  sx={{
                    color: location.pathname.startsWith('/chat') ? '#0F1419' : '#536471',
                    width: 38,
                    height: 38,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: '#FF3040',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.6rem',
                        minWidth: 17,
                        height: 17,
                        borderRadius: '9px',
                        border: '2px solid #fff',
                        boxShadow: unreadCount > 0 ? '0 2px 6px rgba(255,48,64,0.35)' : 'none',
                        animation: unreadCount > 0 ? 'badgePop 2s ease-in-out infinite' : 'none',
                        '@keyframes badgePop': {
                          '0%, 100%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                        },
                      },
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 22 }} />
                  </Badge>
                </IconButton>
                <IconButton
                  onClick={() => navigate(`/profile/${user._id}`)}
                  sx={{
                    color: location.pathname.startsWith('/profile') ? '#0F1419' : '#536471',
                    width: 38,
                    height: 38,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
                  }}
                >
                  <PersonIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Box>

              {/* Mobile Search Icon */}
              <IconButton
                onClick={() => setSearchOpen(true)}
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  color: '#536471',
                  width: 38,
                  height: 38,
                  mr: 0.5,
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
                }}
              >
                <SearchIcon sx={{ fontSize: 22 }} />
              </IconButton>

              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  p: 0.3,
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#0F1419',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {user.username[0].toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    border: '1px solid #EFF3F4',
                    py: 0.5,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F1419' }}>
                    {user.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#536471' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => { navigate(`/profile/${user._id}`); setAnchorEl(null); }}
                  sx={{ py: 1.3, px: 2, fontSize: '0.88rem', '&:hover': { bgcolor: '#F7F8FA' } }}
                >
                  <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#536471' }} /></ListItemIcon>
                  <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.88rem' }} />
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  sx={{ py: 1.3, px: 2, '&:hover': { bgcolor: 'rgba(255,71,87,0.04)' } }}
                >
                  <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#FF4757' }} /></ListItemIcon>
                  <ListItemText primary="Log out" primaryTypographyProps={{ color: '#FF4757', fontWeight: 600, fontSize: '0.88rem' }} />
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="text"
                sx={{
                  color: '#536471',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  borderRadius: 50,
                  px: 2,
                  '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
                }}
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#0F1419',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  borderRadius: 50,
                  px: 2.5,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#1A2530', boxShadow: 'none' },
                }}
                onClick={() => navigate('/signup')}
              >
                Sign up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Bottom Navigation */}
      {user && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: { sm: 'none' },
            zIndex: 1100,
            borderTop: '1px solid #EFF3F4',
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            pb: 'env(safe-area-inset-bottom)',
          }}
          elevation={0}
        >
          <BottomNavigation
            showLabels={false}
            value={currentNav}
            onChange={(event, newValue) => {
              if (newValue === 0) navigate('/feed');
              if (newValue === 1) navigate('/chat');
              if (newValue === 2) navigate(`/profile/${user._id}`);
            }}
            sx={{
              bgcolor: 'transparent',
              height: 52,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                color: '#A0AEC0',
                transition: 'color 0.15s ease',
                '&.Mui-selected': {
                  color: '#0F1419',
                },
              },
            }}
          >
            <BottomNavigationAction icon={<HomeIcon sx={{ fontSize: 26 }} />} />
            <BottomNavigationAction
              icon={
                <Badge
                  badgeContent={unreadCount}
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#FF3040',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.55rem',
                      minWidth: 15,
                      height: 15,
                      borderRadius: '8px',
                      border: '1.5px solid #fff',
                      top: 2,
                      right: 0,
                    },
                  }}
                >
                  <ChatIcon sx={{ fontSize: 24 }} />
                </Badge>
              }
            />
            <BottomNavigationAction icon={<PersonIcon sx={{ fontSize: 26 }} />} />
          </BottomNavigation>
        </Paper>
      )}

      {/* Toast Notification Popup */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
      >
        <Paper
          onClick={() => {
            setToastOpen(false);
            if (toastType === 'message' && toastSender) {
              navigate(`/chat/${toastSender.id}`);
            } else if (toastType === 'post' && toastSender) {
              navigate(`/profile/${toastSender.id}`);
            }
          }}
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2.5,
            py: 1.5,
            borderRadius: '18px',
            bgcolor: 'rgba(15, 20, 25, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            maxWidth: 380,
            width: 'calc(100vw - 32px)',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.02)',
              bgcolor: '#0F1419',
            }
          }}
        >
          <Avatar
            src={toastSender?.profilePic}
            sx={{ width: 34, height: 34, bgcolor: '#fff', color: '#0F1419', fontWeight: 700, fontSize: '0.8rem' }}
          >
            {toastSender?.username?.[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
              {toastType === 'message' ? `New message from ${toastSender?.username}` : 'New post shared'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#A0AEC0', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toastMessage}
            </Typography>
          </Box>
        </Paper>
      </Snackbar>
      {/* Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(15, 20, 25, 0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            p: 1.5,
            m: { xs: 2, sm: 4 },
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search people..."
            variant="standard"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <SearchIcon sx={{ color: '#536471', mr: 1.5, fontSize: 22 }} />
              ),
              sx: {
                fontSize: '1rem',
                py: 1,
                color: '#0F1419',
                '& input::placeholder': { color: '#536471', opacity: 0.8 },
              }
            }}
          />
          {searchQuery && (
            <IconButton 
              size="small" 
              onClick={() => setSearchQuery('')}
              sx={{ color: '#536471' }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ my: 1, borderColor: '#EFF3F4' }} />

        <DialogContent sx={{ p: 0, maxHeight: 350, minHeight: searchQuery ? 150 : 80, overflowY: 'auto' }}>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
              <CircularProgress size={24} sx={{ color: '#0F1419' }} />
            </Box>
          ) : !searchQuery.trim() ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 80, color: '#536471' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Type to find other users on SocialVibe
              </Typography>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: '#536471', px: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F1419', mb: 0.5 }}>
                No results for "{searchQuery}"
              </Typography>
              <Typography variant="caption">
                Make sure the name is spelled correctly or try another search.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {searchResults.map((u) => (
                <ListItem
                  key={u._id}
                  disablePadding
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: 50,
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0F1419',
                        borderColor: '#CFD9DE',
                        '&:hover': { bgcolor: '#EFF3F4', borderColor: '#0F1419' }
                      }}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        navigate(`/profile/${u._id}`);
                      }}
                    >
                      View
                    </Button>
                  }
                >
                  <Box
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate(`/profile/${u._id}`);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      width: '100%',
                      py: 1.2,
                      px: 1.5,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: '#F7F8FA' },
                    }}
                  >
                    <Avatar
                      src={u.profilePic}
                      sx={{ bgcolor: '#0F1419', width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      {u.username ? u.username[0].toUpperCase() : '?'}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1, pr: 7 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F1419', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.username}
                      </Typography>
                      <Typography sx={{ color: '#536471', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.bio || 'No bio yet'}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
