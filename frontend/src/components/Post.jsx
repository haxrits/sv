import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Button,
  Dialog,
  Menu,
  MenuItem,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  MoreHoriz as MoreHorizIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const stringToColor = (str) => {
  if (!str) return '#0F1419';
  const colors = ['#0F1419', '#1A535C', '#4A4E69', '#2B2D42', '#3D405B', '#264653', '#2C3E50'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
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

/**
 * Post Component — Displays a single post, handles liking, commenting, and deleting.
 */
const Post = ({ post, onPostUpdate, onPostDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Local state to handle optimistic UI updates
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Keep local state in sync with parent updates (like socket broadcasts)
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Image zoom modal state
  const [zoomImage, setZoomImage] = useState(false);
  
  // Options menu (for delete)
  const [anchorEl, setAnchorEl] = useState(null);

  const isLiked = localPost.likes?.some((like) => like.user === user?._id);
  const isAuthor = user?._id === localPost.user;

  // Toggle Like
  const handleLike = async () => {
    if (isLiking || !user) return;
    setIsLiking(true);
    
    // Optimistic update
    const wasLiked = isLiked;
    const previousPost = { ...localPost };
    
    setLocalPost(prev => ({
      ...prev,
      likesCount: prev.likesCount + (wasLiked ? -1 : 1),
      likes: wasLiked 
        ? prev.likes.filter(l => l.user !== user._id)
        : [...prev.likes, { user: user._id, username: user.username }]
    }));

    try {
      const { data } = await API.put(`/posts/${localPost._id}/like`);
      setLocalPost(data);
      if (onPostUpdate) onPostUpdate(data);
    } catch (err) {
      setLocalPost(previousPost);
      console.error('Like failed', err);
    } finally {
      setIsLiking(false);
    }
  };

  // Add Comment
  const handleComment = async (e) => {
    e.preventDefault();
    const trimmedComment = commentText.trim();
    if (!trimmedComment || isCommenting || !user) return;
    
    setIsCommenting(true);
    const previousPost = { ...localPost };
    
    // Optimistic comment object
    const tempComment = {
      _id: `temp-${Date.now()}`,
      user: user._id,
      username: user.username,
      text: trimmedComment,
      createdAt: new Date().toISOString(),
    };
    
    setLocalPost(prev => ({
      ...prev,
      commentsCount: prev.commentsCount + 1,
      comments: [...(prev.comments || []), tempComment]
    }));
    setCommentText('');
    
    try {
      const { data } = await API.post(`/posts/${localPost._id}/comment`, { text: trimmedComment });
      setLocalPost(data);
      if (onPostUpdate) onPostUpdate(data);
    } catch (err) {
      setLocalPost(previousPost);
      setCommentText(trimmedComment);
      console.error('Comment failed', err);
    } finally {
      setIsCommenting(false);
    }
  };

  // Delete Post
  const handleDelete = async () => {
    setAnchorEl(null);
    try {
      await API.delete(`/posts/${localPost._id}`);
      if (onPostDelete) onPostDelete(localPost._id);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <Card
      className="post-card fade-in-up"
      sx={{
        mb: { xs: 0.5, sm: 2.5 },
        p: 0,
        borderRadius: { xs: 0, sm: '20px' },
        overflow: 'hidden',
        border: { xs: 'none', sm: '1px solid #EFF3F4' },
        boxShadow: { xs: 'none', sm: '0 2px 12px rgba(0,0,0,0.03)' },
      }}
    >
      
      {/* Header */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            '&:hover': { opacity: 0.75 },
            '&:active': { opacity: 0.5 },
          }}
          onClick={() => navigate(`/profile/${localPost.user}`)}
        >
          <Avatar
            sx={{
              bgcolor: stringToColor(localPost.username || 'User'),
              width: 40,
              height: 40,
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            {localPost.username ? localPost.username[0].toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.9rem' }}>
                {localPost.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#A0AEC0', fontSize: '0.75rem', lineHeight: 1.2 }}
              >
                · {formatDate(localPost.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {isAuthor && (
          <>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                color: '#A0AEC0',
                width: 32,
                height: 32,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: '#EFF3F4', color: '#0F1419' },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  minWidth: 160,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  border: '1px solid #EFF3F4',
                },
              }}
            >
              <MenuItem onClick={handleDelete} sx={{ color: '#FF4757', fontWeight: 600, fontSize: '0.88rem', py: 1.2 }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 1 }}>
        {localPost.text && (
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              mb: localPost.image ? 1.5 : 0.5,
              fontSize: '0.92rem',
              lineHeight: 1.55,
              color: '#0F1419',
            }}
          >
            {localPost.text}
          </Typography>
        )}
      </Box>

      {/* Image */}
      {localPost.image && (
        <>
          <Box 
            className="post-image-container"
            onClick={() => setZoomImage(true)}
            sx={{ mx: { xs: 0, sm: 2.5 }, mb: 1.5, borderRadius: { xs: 0, sm: '16px' } }}
          >
            <img 
              src={localPost.image} 
              alt="Post content" 
              style={{ borderRadius: 'inherit' }}
              loading="lazy"
            />
          </Box>
          <Dialog
            open={zoomImage}
            onClose={() => setZoomImage(false)}
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', m: 2 } }}
          >
            <img src={localPost.image} alt="Zoom" style={{ width: '100%', display: 'block' }} />
          </Dialog>
        </>
      )}

      {/* Actions (Like / Comment) */}
      <Box sx={{ px: { xs: 1, sm: 1.5 }, py: 0.5, display: 'flex', alignItems: 'center', gap: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleLike}
            disabled={!user}
            sx={{
              color: isLiked ? '#FF3040' : '#536471',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: isLiked ? 'rgba(255,48,64,0.06)' : 'rgba(83,100,113,0.06)' },
            }}
          >
            {isLiked ? <FavoriteIcon className="like-pulse" sx={{ fontSize: 22 }} /> : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.82rem',
              color: isLiked ? '#FF3040' : '#536471',
              minWidth: 16,
              transition: 'color 0.15s',
            }}
          >
            {localPost.likesCount > 0 ? localPost.likesCount : ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <IconButton
            onClick={() => setShowComments(!showComments)}
            sx={{
              color: '#536471',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'rgba(83,100,113,0.06)' },
            }}
          >
            <CommentIcon sx={{ fontSize: 21 }} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: '0.82rem', color: '#536471', minWidth: 16 }}
          >
            {localPost.commentsCount > 0 ? localPost.commentsCount : ''}
          </Typography>
        </Box>
      </Box>

      {/* Comments Section */}
      <Collapse in={showComments} timeout={250}>
        <Box
          sx={{
            bgcolor: '#FAFBFC',
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderTop: '1px solid #EFF3F4',
          }}
        >
          {/* List existing comments */}
          {localPost.comments?.length > 0 ? (
            <Box sx={{ mb: 2, maxHeight: 280, overflowY: 'auto' }}>
              {localPost.comments.map((comment, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  <Avatar 
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: stringToColor(comment.username || 'User'),
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'opacity 0.15s',
                      '&:hover': { opacity: 0.7 },
                    }}
                    onClick={() => navigate(`/profile/${comment.user}`)}
                  >
                    {comment.username ? comment.username[0].toUpperCase() : '?'}
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      p: 1.5,
                      borderRadius: '14px',
                      flex: 1,
                      border: '1px solid #EFF3F4',
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#0F1419',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => navigate(`/profile/${comment.user}`)}
                    >
                      {comment.username}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#0F1419', mt: 0.2, lineHeight: 1.4 }}>
                      {comment.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#A0AEC0', textAlign: 'center', mb: 2, fontSize: '0.85rem' }}>
              No comments yet
            </Typography>
          )}

          {/* Add comment input */}
          {user && (
            <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                autoComplete="off"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 50,
                    bgcolor: '#fff',
                    fontSize: '0.85rem',
                    '& fieldset': { borderColor: '#EFF3F4' },
                    '&:hover fieldset': { borderColor: '#CFD9DE' },
                    '&.Mui-focused fieldset': { borderColor: '#0F1419', borderWidth: 1.5 },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!commentText.trim() || isCommenting}
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
                {isCommenting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Post'}
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};

export default Post;
