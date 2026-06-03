import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, Button, IconButton, Dialog, TextField, DialogTitle,
  DialogContent, DialogActions, CircularProgress, List, ListItem, ListItemAvatar,
  ListItemText, Fade, Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  CameraAlt as CameraIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  DeleteOutline as DeleteIcon,
  Dashboard as DashboardIcon,
  ViewAgenda as TimelineIcon
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Post';

const stringToColor = (str) => {
  if (!str) return '#0F1419';
  const colors = ['#0F1419', '#1A535C', '#4A4E69', '#2B2D42', '#3D405B', '#264653', '#2C3E50'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getPostColor = (id) => {
  if (!id) return 'linear-gradient(135deg, #EEF2F6 0%, #E3E8F0 100%)';
  const colors = [
    'linear-gradient(135deg, #EEF2F6 0%, #E3E8F0 100%)',
    'linear-gradient(135deg, #FDF4F5 0%, #F8E2E6 100%)',
    'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getPostAccent = (id) => {
  if (!id) return '#64748B';
  const colors = ['#64748B', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [picPreview, setPicPreview] = useState('');
  const [saving, setSaving] = useState(false);

  // List Modal Mode ('followers' or 'following')
  const [listType, setListType] = useState('');

  // Posts State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'timeline'
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailCommentText, setDetailCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProfile(), fetchUserPosts()]);
      } catch (err) {
        console.error('Error loading profile data', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get(`/users/${id}`);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const { data } = await API.get(`/posts/user/${id}`);
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch user posts', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await API.put(`/users/${id}/follow`);
      if (data.status === 'request_sent') {
        setProfile(prev => ({
          ...prev,
          followRequestsReceived: [...prev.followRequestsReceived, { _id: user._id, username: user.username }]
        }));
      } else if (data.status === 'request_cancelled') {
        setProfile(prev => ({
          ...prev,
          followRequestsReceived: prev.followRequestsReceived.filter(r => (r._id || r) !== user._id)
        }));
      } else if (data.status === 'unfollowed') {
        setProfile(prev => ({
          ...prev,
          followers: prev.followers.filter(f => (f._id || f) !== user._id)
        }));
      }
    } catch (err) {
      console.error('Follow error', err);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const { data } = await API.put(`/users/${id}/accept-request`);
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          followRequestsSent: prev.followRequestsSent.filter(r => (r._id || r) !== user._id),
          followers: [...prev.followers, { _id: user._id, username: user.username }]
        }));
      }
    } catch (err) {
      console.error('Accept request error', err);
    }
  };

  const handleRejectRequest = async () => {
    try {
      const { data } = await API.put(`/users/${id}/reject-request`);
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          followRequestsSent: prev.followRequestsSent.filter(r => (r._id || r) !== user._id)
        }));
      }
    } catch (err) {
      console.error('Reject request error', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPicPreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      if (bio !== profile.bio) formData.append('bio', bio);
      if (profilePic) formData.append('profilePic', profilePic);
      
      const { data } = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, bio: data.bio, profilePic: data.profilePic }));
      setEditOpen(false);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setBio(profile.bio || '');
    setPicPreview(profile.profilePic || '');
    setEditOpen(true);
  };

  // Timeline posts updates
  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
    if (selectedPost && selectedPost._id === updatedPost._id) {
      setSelectedPost(updatedPost);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(null);
    }
  };

  // Detail Modal liking/commenting
  const handleLikeDetail = async (postItem) => {
    try {
      const { data } = await API.put(`/posts/${postItem._id}/like`);
      setSelectedPost(data);
      setPosts(prev => prev.map(p => p._id === data._id ? data : p));
    } catch (err) {
      console.error('Failed to like post in detail view', err);
    }
  };

  const handleCommentDetail = async (e) => {
    e.preventDefault();
    if (!detailCommentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const { data } = await API.post(`/posts/${selectedPost._id}/comment`, { text: detailCommentText });
      setSelectedPost(data);
      setDetailCommentText('');
      setPosts(prev => prev.map(p => p._id === data._id ? data : p));
    } catch (err) {
      console.error('Failed to comment', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteDetail = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await API.delete(`/posts/${postId}`);
      setSelectedPost(null);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ bgcolor: '#F7F8FA' }}>
        <CircularProgress size={32} sx={{ color: '#0F1419' }} />
      </Box>
    );
  }
  if (!profile) return <Typography align="center" mt={10}>Profile not found</Typography>;

  const isOwnProfile = user && user._id === profile._id;
  const isFollowing = profile && user && profile.followers.some(f => (f._id || f) === user._id);
  const isRequestSent = profile && user && profile.followRequestsReceived.some(r => (r._id || r) === user._id);
  const isRequestReceived = profile && user && profile.followRequestsSent.some(r => (r._id || r) === user._id);

  return (
    <Box sx={{ minHeight: '100vh', pb: { xs: 10, sm: 8 }, bgcolor: '#F7F8FA' }}>
      <Navbar />
      <Box sx={{ maxWidth: 580, mx: 'auto', mt: { xs: 7, sm: 10 }, px: { xs: 0, sm: 2 } }}>
        
        {/* Profile Card */}
        <Fade in timeout={400}>
          <Box
            sx={{
              bgcolor: '#fff',
              borderRadius: { xs: 0, sm: '24px' },
              overflow: 'hidden',
              border: { xs: 'none', sm: '1px solid #EFF3F4' },
              boxShadow: { xs: 'none', sm: '0 4px 24px rgba(0,0,0,0.04)' },
            }}
          >
            {/* Cover gradient */}
            <Box
              sx={{
                height: { xs: 100, sm: 120 },
                background: 'linear-gradient(135deg, #0F1419 0%, #2D3436 50%, #636E72 100%)',
                position: 'relative',
              }}
            />

            {/* Avatar + Info */}
            <Box sx={{ px: { xs: 3, sm: 4 }, pb: 4, mt: { xs: '-48px', sm: '-52px' } }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={profile.profilePic}
                  sx={{
                    width: { xs: 96, sm: 104 },
                    height: { xs: 96, sm: 104 },
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    bgcolor: '#0F1419',
                    border: '4px solid #fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                >
                  {profile?.username ? profile.username[0].toUpperCase() : '?'}
                </Avatar>
              </Box>

              {/* Name + Bio */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.4rem', sm: '1.5rem' },
                    letterSpacing: '-0.3px',
                    color: '#0F1419',
                  }}
                >
                  {profile.username}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    color: '#536471',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    maxWidth: 400,
                  }}
                >
                  {profile.bio || (isOwnProfile ? 'Add a bio to tell people about yourself' : 'No bio yet')}
                </Typography>
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: { xs: 3, sm: 4 }, mb: 3 }}>
                <Box
                  sx={{
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 0.7 },
                    '&:active': { opacity: 0.5 },
                  }}
                  onClick={() => setListType('followers')}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F1419', lineHeight: 1 }}>
                    {profile.followers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#536471', fontSize: '0.8rem', mt: 0.3 }}>
                    Followers
                  </Typography>
                </Box>
                <Box
                  sx={{
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 0.7 },
                    '&:active': { opacity: 0.5 },
                  }}
                  onClick={() => setListType('following')}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F1419', lineHeight: 1 }}>
                    {profile.following.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#536471', fontSize: '0.8rem', mt: 0.3 }}>
                    Following
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {isOwnProfile ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                    onClick={openEdit}
                    sx={{
                      borderRadius: 50,
                      px: 3,
                      py: 1,
                      borderColor: '#CFD9DE',
                      color: '#0F1419',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textTransform: 'none',
                      '&:hover': { borderColor: '#0F1419', bgcolor: 'rgba(15,20,25,0.03)' },
                    }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    {isRequestReceived ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleAcceptRequest}
                          sx={{
                            borderRadius: 50,
                            px: 3,
                            py: 1,
                            bgcolor: '#10B981',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#059669' },
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleRejectRequest}
                          sx={{
                            borderRadius: 50,
                            px: 3,
                            py: 1,
                            borderColor: '#FF4757',
                            color: '#FF4757',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            '&:hover': { borderColor: '#E11D48', bgcolor: 'rgba(255,71,87,0.04)' },
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant={isFollowing ? 'outlined' : isRequestSent ? 'outlined' : 'contained'}
                        onClick={handleFollow}
                        sx={{
                          borderRadius: 50,
                          px: 3.5,
                          py: 1,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          minWidth: 120,
                          ...(isFollowing
                            ? {
                                borderColor: '#CFD9DE',
                                color: '#0F1419',
                                '&:hover': { borderColor: '#FF4757', color: '#FF4757', bgcolor: 'rgba(255,71,87,0.04)' },
                              }
                            : isRequestSent
                            ? {
                                borderColor: '#A0AEC0',
                                color: '#536471',
                                '&:hover': { borderColor: '#FF4757', color: '#FF4757', bgcolor: 'rgba(255,71,87,0.04)' },
                              }
                            : {
                                bgcolor: '#0F1419',
                                boxShadow: '0 2px 8px rgba(15,20,25,0.15)',
                                '&:hover': { bgcolor: '#1A2530' },
                              }),
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isFollowing ? 'Following' : isRequestSent ? 'Cancel Request' : 'Follow'}
                      </Button>
                    )}
                    
                    {(isFollowing || profile.followers.some(f => (f._id || f) === user?._id)) && (
                      <IconButton
                        onClick={() => navigate(`/chat/${profile._id}`)}
                        sx={{
                          border: '1px solid #CFD9DE',
                          borderRadius: 50,
                          width: 42,
                          height: 42,
                          color: '#0F1419',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: '#0F1419', bgcolor: 'rgba(15,20,25,0.03)' },
                        }}
                      >
                        <ChatIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Tab Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, mb: 2.5, px: { xs: 2, sm: 0 } }}>
          <Button
            onClick={() => setActiveTab('board')}
            startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 50,
              px: 3,
              py: 1,
              bgcolor: activeTab === 'board' ? '#0F1419' : 'rgba(15, 20, 25, 0.04)',
              color: activeTab === 'board' ? '#fff' : '#536471',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'board' ? '0 4px 12px rgba(15,20,25,0.12)' : 'none',
              '&:hover': { bgcolor: activeTab === 'board' ? '#1A2530' : 'rgba(15,20,25,0.08)' }
            }}
          >
            Creative Board
          </Button>
          <Button
            onClick={() => setActiveTab('timeline')}
            startIcon={<TimelineIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 50,
              px: 3,
              py: 1,
              bgcolor: activeTab === 'timeline' ? '#0F1419' : 'rgba(15, 20, 25, 0.04)',
              color: activeTab === 'timeline' ? '#fff' : '#536471',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'timeline' ? '0 4px 12px rgba(15,20,25,0.12)' : 'none',
              '&:hover': { bgcolor: activeTab === 'timeline' ? '#1A2530' : 'rgba(15,20,25,0.08)' }
            }}
          >
            Timeline
          </Button>
        </Box>

        {/* User Posts View */}
        {postsLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={24} sx={{ color: '#0F1419' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: '24px', border: '1px solid #EFF3F4', mt: 1, mx: { xs: 2, sm: 0 }, px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F1419', mb: 1, fontSize: '1rem' }}>
              No posts yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#536471', fontSize: '0.85rem' }}>
              {isOwnProfile ? "You haven't shared any vibes yet. Head to home feed to write one!" : `@${profile.username} hasn't posted anything yet.`}
            </Typography>
          </Box>
        ) : activeTab === 'board' ? (
          /* Creative Board View: masonry-style collage grid */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: { xs: 1.5, sm: 2.5 },
              mt: 1,
              px: { xs: 1.5, sm: 0 },
            }}
          >
            {posts.map((postItem, idx) => (
              <Fade in key={postItem._id} timeout={200 + Math.min(idx * 50, 300)}>
                {postItem.image ? (
                  /* Image Tile */
                  <Box
                    onClick={() => setSelectedPost(postItem)}
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      aspectRatio: '1 / 1',
                      bgcolor: '#fff',
                      border: '1px solid #EFF3F4',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                        '& .board-image': {
                          transform: 'scale(1.05)',
                          filter: 'brightness(0.85)',
                        },
                        '& .board-overlay': {
                          opacity: 1,
                        }
                      }
                    }}
                  >
                    <img
                      className="board-image"
                      src={postItem.image}
                      alt="post tile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'block',
                      }}
                    />
                    {/* Hover Stats Panel */}
                    <Box
                      className="board-overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(15, 20, 25, 0.4)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2.5,
                        opacity: 0,
                        transition: 'opacity 0.25s ease',
                        color: '#fff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <FavoriteIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{postItem.likesCount}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <CommentIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{postItem.commentsCount}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  /* Custom Quote Card Tile */
                  <Box
                    onClick={() => setSelectedPost(postItem)}
                    sx={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      aspectRatio: '1 / 1',
                      background: getPostColor(postItem._id),
                      border: '1px solid rgba(15, 20, 25, 0.03)',
                      p: { xs: 2, sm: 3 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                        '& .quote-mark': {
                          transform: 'scale(1.1) rotate(-5deg)',
                          opacity: 0.12,
                        }
                      }
                    }}
                  >
                    <Typography
                      className="quote-mark"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: 15,
                        fontSize: '7rem',
                        fontWeight: 900,
                        color: getPostAccent(postItem._id),
                        opacity: 0.07,
                        userSelect: 'none',
                        transition: 'all 0.3s ease',
                        lineHeight: 1,
                      }}
                    >
                      “
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.83rem', sm: '0.92rem' },
                        color: '#0F1419',
                        lineHeight: 1.45,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                        zIndex: 1,
                        borderLeft: `3.5px solid ${getPostAccent(postItem._id)}`,
                        pl: 1.2,
                      }}
                    >
                      {postItem.text}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#536471', mt: 1, zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FavoriteIcon sx={{ fontSize: 15, color: '#FF3040' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{postItem.likesCount}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 14 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{postItem.commentsCount}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Fade>
            ))}
          </Box>
        ) : (
          /* Timeline View: Chronological standard list of cards */
          <Box sx={{ px: { xs: 0, sm: 0 }, mt: 1 }}>
            {posts.map((postItem, idx) => (
              <Fade in key={postItem._id} timeout={200 + Math.min(idx * 50, 300)}>
                <div>
                  <Post
                    post={postItem}
                    onPostUpdate={handlePostUpdate}
                    onPostDelete={handlePostDelete}
                  />
                </div>
              </Fade>
            ))}
          </Box>
        )}
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1,
            m: { xs: 2, sm: 'auto' },
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Edit Profile
          <IconButton onClick={() => setEditOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Box sx={{ position: 'relative', mb: 3 }}>
              <Avatar
                src={picPreview}
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: '#0F1419',
                  fontSize: '2rem',
                  fontWeight: 700,
                  border: '3px solid #EFF3F4',
                }}
              >
                {profile?.username ? profile.username[0].toUpperCase() : '?'}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: '#0F1419',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#333' },
                }}
              >
                <CameraIcon sx={{ fontSize: 16 }} />
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              inputProps={{ maxLength: 200 }}
              helperText={`${bio.length}/200`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  '&.Mui-focused fieldset': { borderColor: '#0F1419' },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ borderRadius: 50, color: '#536471', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveProfile}
            variant="contained"
            disabled={saving}
            sx={{
              borderRadius: 50,
              px: 3,
              bgcolor: '#0F1419',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#1A2530' },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Followers / Following List Dialog */}
      <Dialog 
        open={Boolean(listType)} 
        onClose={() => setListType('')} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxHeight: '75vh',
            m: { xs: 2, sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            borderBottom: '1px solid #EFF3F4',
            py: 2,
            position: 'relative',
          }}
        >
          {listType === 'followers' ? 'Followers' : 'Following'}
          <IconButton
            onClick={() => setListType('')}
            sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
            size="small"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List disablePadding>
            {(listType === 'followers' ? profile.followers : profile.following).map((userItem) => (
              <ListItem 
                button 
                key={userItem._id} 
                onClick={() => {
                  setListType('');
                  navigate(`/profile/${userItem._id}`);
                }}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: '#F7F8FA' },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar
                    src={userItem.profilePic}
                    sx={{ bgcolor: '#0F1419', width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    {userItem.username ? userItem.username[0].toUpperCase() : '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {userItem.username}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {(listType === 'followers' ? profile.followers : profile.following).length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.88rem' }}>
                  No {listType} yet
                </Typography>
              </Box>
            )}
          </List>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog Modal (Glassmorphic dashboard) */}
      <Dialog
        open={Boolean(selectedPost)}
        onClose={() => { setSelectedPost(null); setDetailCommentText(''); }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
            m: { xs: 2, sm: 'auto' },
            maxHeight: '90vh',
          }
        }}
      >
        {selectedPost && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: 'auto', md: '560px' } }}>
            {/* Left side panel: Post Content */}
            <Box
              sx={{
                flex: 1.1,
                bgcolor: selectedPost.image ? '#0a0d10' : undefined,
                background: selectedPost.image ? undefined : getPostColor(selectedPost._id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: { xs: '240px', md: '100%' },
                overflow: 'hidden',
              }}
            >
              {selectedPost.image ? (
                <img
                  src={selectedPost.image}
                  alt="Expanded post content"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: '100%',
                  }}
                />
              ) : (
                <Box sx={{ p: 4, position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 25,
                      fontSize: '12rem',
                      fontWeight: 900,
                      color: getPostAccent(selectedPost._id),
                      opacity: 0.08,
                      userSelect: 'none',
                    }}
                  >
                    “
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#0F1419',
                      lineHeight: 1.5,
                      borderLeft: `5px solid ${getPostAccent(selectedPost._id)}`,
                      pl: 3,
                      zIndex: 1,
                    }}
                  >
                    {selectedPost.text}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right side panel: Author, likes, comments thread */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: { xs: 'auto', md: '100%' },
                maxHeight: { xs: '450px', md: '100%' },
                bgcolor: '#fff',
                borderLeft: { xs: 'none', md: '1px solid #EFF3F4' },
                borderTop: { xs: '1px solid #EFF3F4', md: 'none' },
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFF3F4' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={profile.profilePic}
                    sx={{ width: 38, height: 38, bgcolor: '#0F1419', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    {selectedPost?.username ? selectedPost.username[0].toUpperCase() : '?'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F1419' }}>
                      {selectedPost.username}
                    </Typography>
                    <Typography sx={{ color: '#536471', fontSize: '0.72rem' }}>
                      {new Date(selectedPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {user && user._id === selectedPost.user && (
                    <IconButton
                      onClick={() => handleDeleteDetail(selectedPost._id)}
                      size="small"
                      sx={{ color: '#FF4757', '&:hover': { bgcolor: 'rgba(255,71,87,0.06)' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => { setSelectedPost(null); setDetailCommentText(''); }}
                    size="small"
                    sx={{ color: '#536471', '&:hover': { bgcolor: '#EFF3F4' } }}
                  >
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Text text (for posts that have both image and text) */}
              {selectedPost.image && selectedPost.text && (
                <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid #EFF3F4' }}>
                  <Typography variant="body2" sx={{ color: '#0F1419', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedPost.text}
                  </Typography>
                </Box>
              )}

              {/* Comments Thread */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: '#FAFBFC',
                }}
              >
                {selectedPost.comments?.length > 0 ? (
                  selectedPost.comments.map((comment, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1.5 }}>
                      <Avatar
                        sx={{ width: 28, height: 28, bgcolor: stringToColor(comment.username || 'User'), fontWeight: 700, fontSize: '0.7rem' }}
                      >
                        {comment?.username ? comment.username[0].toUpperCase() : '?'}
                      </Avatar>
                      <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: '14px', flex: 1, border: '1px solid #EFF3F4' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#0F1419' }}>
                          {comment.username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#0F1419', mt: 0.3, lineHeight: 1.4 }}>
                          {comment.text}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, color: '#A0AEC0' }}>
                    <CommentIcon sx={{ fontSize: 28, mb: 1, color: '#CFD9DE' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>No comments yet</Typography>
                  </Box>
                )}
              </Box>

              {/* Actions & Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #EFF3F4', bgcolor: '#fff' }}>
                {/* Like Button & Stats */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 0.5 }}>
                  <IconButton
                    onClick={() => handleLikeDetail(selectedPost)}
                    size="small"
                    sx={{
                      color: selectedPost.likes?.some(l => l.user === user?._id) ? '#FF3040' : '#536471',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: selectedPost.likes?.some(l => l.user === user?._id) ? 'rgba(255,48,64,0.06)' : 'rgba(83,100,113,0.06)' }
                    }}
                  >
                    {selectedPost.likes?.some(l => l.user === user?._id) ? (
                      <FavoriteIcon className="like-pulse" sx={{ fontSize: 22 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: selectedPost.likes?.some(l => l.user === user?._id) ? '#FF3040' : '#536471', ml: 1 }}>
                    {selectedPost.likesCount} likes
                  </Typography>
                </Box>

                {/* Comment Input */}
                {user && (
                  <Box component="form" onSubmit={handleCommentDetail} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add a comment..."
                      value={detailCommentText}
                      onChange={(e) => setDetailCommentText(e.target.value)}
                      autoComplete="off"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 50,
                          bgcolor: '#F7F8FA',
                          fontSize: '0.85rem',
                          '& fieldset': { borderColor: 'transparent' },
                          '&:hover fieldset': { borderColor: '#EFF3F4' },
                          '&.Mui-focused fieldset': { borderColor: '#0F1419', borderWidth: 1.5 },
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!detailCommentText.trim() || commentLoading}
                      sx={{
                        borderRadius: 50,
                        minWidth: 72,
                        bgcolor: '#0F1419',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#1A2530', boxShadow: 'none' },
                        '&.Mui-disabled': { bgcolor: '#A0AEC0' },
                      }}
                    >
                      {commentLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Post'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default Profile;
