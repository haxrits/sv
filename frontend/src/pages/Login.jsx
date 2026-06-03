import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade
} from '@mui/material';
import { Mail, Lock, Visibility, VisibilityOff, Favorite, Comment, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      setLoading(false);
    }
  };

  const inputSx = {
    borderRadius: '16px',
    bgcolor: 'rgba(15, 20, 25, 0.03)',
    backdropFilter: 'blur(4px)',
    '& fieldset': { borderColor: 'rgba(15, 20, 25, 0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(15, 20, 25, 0.15) !important' },
    '&.Mui-focused fieldset': { borderColor: '#0F1419 !important', borderWidth: '1.5px !important' },
    '&.Mui-focused': { bgcolor: '#fff' },
    transition: 'all 0.2s ease',
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        bgcolor: '#FAFBFD',
        // Mesh background gradients
        background: `
          radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(244, 63, 94, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          #FAFBFD
        `,
        // Grid pattern overlay
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(15, 20, 25, 0.02) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.8,
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}
    >
      {/* Decorative floating background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          animation: 'floatBg 9s ease-in-out infinite',
          '@keyframes floatBg': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(-20px, 30px) scale(1.1)' },
          },
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '35%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.06) 0%, transparent 70%)',
          animation: 'floatBg 12s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      {/* Parallax SVG Waves Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '22vh',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.65,
        }}
      >
        <svg
          viewBox="0 0 120 28"
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <path
              id="wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g>
            <use
              href="#wave"
              x="48"
              y="0"
              fill="rgba(99, 102, 241, 0.04)"
              style={{
                animation: 'waveMove 14s linear infinite',
              }}
            />
            <use
              href="#wave"
              x="48"
              y="3"
              fill="rgba(244, 63, 94, 0.03)"
              style={{
                animation: 'waveMove 10s linear infinite reverse',
              }}
            />
            <use
              href="#wave"
              x="48"
              y="5"
              fill="rgba(59, 130, 246, 0.05)"
              style={{
                animation: 'waveMove 6s linear infinite',
              }}
            />
          </g>
        </svg>
        <style>{`
          @keyframes waveMove {
            0% { transform: translate3d(-90px, 0, 0); }
            100% { transform: translate3d(85px, 0, 0); }
          }
        `}</style>
      </Box>

      {/* Ambient Drifting Floating Glass Dots */}
      {[...Array(10)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: `${Math.random() * 6 + 4}px`,
            height: `${Math.random() * 6 + 4}px`,
            borderRadius: '50%',
            bgcolor: i % 2 === 0 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(244, 63, 94, 0.1)',
            bottom: -20,
            left: `${Math.random() * 100}%`,
            animation: `driftUp ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            pointerEvents: 'none',
            zIndex: 0,
            '@keyframes driftUp': {
              '0%': { transform: 'translateY(0) scale(1)', opacity: 0 },
              '10%': { opacity: 0.8 },
              '90%': { opacity: 0.8 },
              '100%': { transform: 'translateY(-105vh) scale(0.5)', opacity: 0 }
            }
          }}
        />
      ))}


      {/* Main Grid Split */}
      <Box sx={{ display: 'flex', width: '100%', zIndex: 1 }}>
        {/* Left Side: Brand Visual (Desktop only) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50%',
            p: 8,
            position: 'relative',
            background: 'linear-gradient(135deg, #0F1419 0%, #1A2530 100%)',
            color: '#fff',
            overflow: 'hidden',
            boxShadow: '10px 0 40px rgba(0,0,0,0.15)',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.02) 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
              opacity: 0.7,
              pointerEvents: 'none',
            }
          }}
        >
          {/* Abstract glowing shapes inside left panel */}
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-15%',
              right: '-10%',
              width: 350,
              height: 350,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <Box sx={{ maxWidth: 460, position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                mx: 'auto',
                boxShadow: '0 12px 32px rgba(255, 255, 255, 0.15)',
                animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              }}
            >
              <Typography sx={{ color: '#0F1419', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-1px' }}>
                SV
              </Typography>
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1.15,
                mb: 2,
                background: 'linear-gradient(to right, #FFFFFF, #E2E8F0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Connect. Share. Discover.
            </Typography>
            
            <Typography sx={{ color: '#A0AEC0', fontSize: '1.05rem', lineHeight: 1.6, mb: 6 }}>
              Join a modern, sleek social ecosystem that is crafted for seamless interactions and rich community experiences.
            </Typography>

            {/* Floating Glassmorphic Feed Item Mockup */}
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '24px',
                p: 3,
                textAlign: 'left',
                boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
                animation: 'floatCard 6s ease-in-out infinite',
                '@keyframes floatCard': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-15px) rotate(1deg)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    bgcolor: '#6366F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  JD
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Jane Doe</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#A0AEC0' }}>Product Designer</Typography>
                </Box>
                <AutoAwesome sx={{ color: '#FCD34D', fontSize: 16, ml: 'auto' }} />
              </Box>

              <Typography sx={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.5, mb: 2.5 }}>
                SocialVibe is lookin' extremely gorgeous! Redesigning the mobile view and layout components with sleek glassmorphism and minimal vibes. 🚀✨
              </Typography>

              <Box sx={{ display: 'flex', gap: 2.5, color: '#A0AEC0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Favorite sx={{ fontSize: 15, color: '#EF4444' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#E2E8F0' }}>42</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Comment sx={{ fontSize: 14 }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>8</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Form Container */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 2.5, sm: 4, md: 6 },
            position: 'relative',
          }}
        >
          {/* Main Card */}
          <Fade in timeout={700}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 420,
                bgcolor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                borderRadius: '28px',
                p: { xs: 3.5, sm: 5 },
                boxShadow: '0 20px 40px rgba(15, 20, 25, 0.05), 0 1px 3px rgba(15, 20, 25, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Logo (Mobile display only) */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  bgcolor: '#0F1419',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                  boxShadow: '0 8px 24px rgba(15, 20, 25, 0.12)',
                  animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
                  SV
                </Typography>
              </Box>

              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '1.8rem', sm: '2rem' },
                    letterSpacing: '-0.8px',
                    color: '#0F1419',
                    lineHeight: 1.15,
                    mb: 1,
                  }}
                >
                  Welcome back.
                </Typography>
                <Typography sx={{ color: '#536471', fontSize: '0.9rem', fontWeight: 500 }}>
                  Enter your credentials to enter the vibe.
                </Typography>
              </Box>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#536471', mb: 0.8, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@email.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail sx={{ color: '#A0AEC0', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: inputSx,
                    }}
                  />
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#536471', mb: 0.8, ml: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#A0AEC0', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#A0AEC0' }}>
                            {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: inputSx,
                    }}
                  />
                </Box>

                {error && (
                  <Fade in>
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: '14px',
                        bgcolor: 'rgba(255, 71, 87, 0.05)',
                        border: '1px solid rgba(255, 71, 87, 0.1)',
                      }}
                    >
                      <Typography sx={{ color: '#FF4757', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                        {error}
                      </Typography>
                    </Box>
                  </Fade>
                )}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 3.5,
                    py: 1.6,
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    bgcolor: '#0F1419',
                    color: '#fff',
                    textTransform: 'none',
                    boxShadow: '0 4px 16px rgba(15, 20, 25, 0.15)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#1A2530',
                      boxShadow: '0 6px 24px rgba(15, 20, 25, 0.2)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(15,20,25,0.1)' },
                    '&.Mui-disabled': { bgcolor: '#CFD9DE', boxShadow: 'none', color: '#fff' },
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
                </Button>
              </form>

              {/* Footer */}
              <Box
                sx={{
                  mt: 5,
                  pt: 2.5,
                  textAlign: 'center',
                  borderTop: '1px solid rgba(15, 20, 25, 0.06)',
                }}
              >
                <Typography sx={{ color: '#536471', fontSize: '0.85rem', fontWeight: 500 }}>
                  New to SocialVibe?{' '}
                  <Link to="/signup" style={{ color: '#0F1419', fontWeight: 700, textDecoration: 'none' }}>
                    Create account
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
