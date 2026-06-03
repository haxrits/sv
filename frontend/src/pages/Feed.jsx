import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import { DynamicFeed as EmptyIcon } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';
import API from '../api';
import { socket } from '../api/socket';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Intersection Observer element ref for infinite scrolling
  const observerTarget = useRef(null);

  // Fetch Posts Logic
  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const { data } = await API.get(`/posts?page=${pageNum}&limit=10`);

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setHasMore(data.hasMore);
      setError('');
    } catch (err) {
      console.error('Fetch feed error:', err);
      setError('Unable to load feed. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch and Realtime listeners
  useEffect(() => {
    fetchPosts(1);
    setPage(1);

    const handleNewPost = (post) => {
      setPosts((prev) => [post, ...prev]);
    };
    const handleUpdatePost = (updatedPost) => {
      setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
    };
    const handleDeletePost = (postId) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    socket.on('new_post', handleNewPost);
    socket.on('post_updated', handleUpdatePost);
    socket.on('post_deleted', handleDeletePost);

    return () => {
      socket.off('new_post', handleNewPost);
      socket.off('post_updated', handleUpdatePost);
      socket.off('post_deleted', handleDeletePost);
    };
  }, [fetchPosts]);

  // Infinite Scroll Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchPosts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPosts]);

  // Callbacks for post lifecycle
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FA', pb: { xs: 10, sm: 8 } }}>
      <Navbar />

      <Box sx={{ pt: { xs: 9, sm: 11 } }} className="feed-container">
        {/* Create Post Section */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Feed Content */}
        {error && (
          <Fade in>
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 71, 87, 0.06)',
                border: '1px solid rgba(255, 71, 87, 0.1)',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: '#FF4757', fontWeight: 500 }}>
                {error}
              </Typography>
            </Box>
          </Fade>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress size={28} sx={{ color: '#0F1419' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Fade in timeout={500}>
            <Box
              sx={{
                textAlign: 'center',
                mt: 6,
                px: 3,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: '#EFF3F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <EmptyIcon sx={{ fontSize: 32, color: '#536471' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F1419', mb: 1, fontSize: '1.1rem' }}>
                No posts yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#536471', fontSize: '0.88rem', maxWidth: 280, mx: 'auto', lineHeight: 1.5 }}>
                Be the first to share something amazing with the community
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box>
            {posts.map((post, idx) => (
              <Fade in key={post._id} timeout={200 + Math.min(idx * 50, 300)}>
                <div>
                  <Post
                    post={post}
                    onPostUpdate={handlePostUpdate}
                    onPostDelete={handlePostDelete}
                  />
                </div>
              </Fade>
            ))}

            {/* Infinite Scroll trigger element */}
            <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />

            {loadingMore && (
              <Box display="flex" justifyContent="center" my={3}>
                <CircularProgress size={24} sx={{ color: '#536471' }} />
              </Box>
            )}

            {!hasMore && posts.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 3, mb: 4, py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#A0AEC0',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  You're all caught up ✨
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Feed;
