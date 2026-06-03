import { useState, useRef } from 'react';
import {
  Card,
  Box,
  Avatar,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Typography,
  Fade,
} from '@mui/material';
import {
  Image as ImageIcon,
  Close as CloseIcon,
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

/**
 * CreatePost — Component for users to compose and submit new posts.
 * @param {Function} onPostCreated - Callback to refresh feed after successful post.
 * @param {Boolean} isModal - Whether this component is rendered inside a dialog.
 */
const CreatePost = ({ onPostCreated, isModal = false }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef(null);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove Selected Image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) {
      setError('Please add some text or an image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (imageFile) formData.append('image', imageFile);

      const { data } = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Clear form
      setText('');
      clearImage();
      setFocused(false);
      
      // Notify parent to append new post
      if (onPostCreated) onPostCreated(data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={isModal ? "" : "fade-in-up"}
      sx={{
        mb: isModal ? 0 : { xs: 0.5, sm: 2.5 },
        p: 0,
        borderRadius: isModal ? 0 : { xs: 0, sm: '20px' },
        overflow: 'hidden',
        border: isModal ? 'none' : { xs: 'none', sm: '1px solid' },
        borderColor: { sm: focused ? '#0F1419' : '#EFF3F4' },
        boxShadow: isModal ? 'none' : { xs: 'none', sm: focused ? '0 4px 20px rgba(15,20,25,0.06)' : '0 2px 12px rgba(0,0,0,0.03)' },
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative' }}>
        
        {/* Input Area */}
        <Box sx={{ display: 'flex', gap: 1.5, p: { xs: 2, sm: 2.5 }, pb: imagePreview ? 1 : { xs: 1, sm: 1.5 } }}>
          <Avatar
            sx={{
              bgcolor: stringToColor(user?.username || 'User'),
              width: 40,
              height: 40,
              fontSize: '0.9rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={5}
            placeholder={`What's happening?`}
            variant="standard"
            value={text}
            onFocus={() => setFocused(true)}
            onBlur={() => !text && !imageFile && setFocused(false)}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError('');
            }}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '0.95rem',
                mt: 0.8,
                lineHeight: 1.5,
                color: '#0F1419',
                '& textarea': { resize: 'none' },
                '& textarea::placeholder': { color: '#A0AEC0', opacity: 1 },
              }
            }}
          />
        </Box>

        {/* Selected Image Preview */}
        {imagePreview && (
          <Fade in>
            <Box sx={{ position: 'relative', mx: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: '16px', overflow: 'hidden' }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block', borderRadius: '16px' }} 
              />
              <IconButton
                size="small"
                onClick={clearImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(255,71,87,0.85)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Fade>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1.5, px: { xs: 2, sm: 2.5 }, fontSize: '0.82rem', fontWeight: 500 }}>
            {error}
          </Typography>
        )}

        {/* Action Bottom Bar */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: { xs: 1.5, sm: 2 },
            py: 1.2,
            borderTop: '1px solid #EFF3F4',
          }}
        >
          <Box>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <IconButton 
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: '#536471',
                width: 36,
                height: 36,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: 'rgba(15,20,25,0.06)', color: '#0F1419' },
              }}
            >
              <ImageIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            disabled={loading || (!text.trim() && !imageFile)}
            sx={{
              borderRadius: 50,
              px: 3,
              py: 0.8,
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#0F1419',
              boxShadow: 'none',
              minWidth: 80,
              transition: 'all 0.15s',
              '&:hover': { bgcolor: '#1A2530', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: '#A0AEC0', color: '#fff' },
            }}
          >
            {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Post'}
          </Button>
        </Box>

      </Box>
    </Card>
  );
};

export default CreatePost;
