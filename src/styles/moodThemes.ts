interface MoodTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  gradient: string;
  glow: string;
}

export const moodThemes: { [key: string]: MoodTheme } = {
  happy: {
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    glow: 'rgba(255, 215, 0, 0.5)'
  },
  sad: {
    primary: '#4682B4', // Steel Blue
    secondary: '#1E90FF', // Dodger Blue
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#4682B4',
    gradient: 'linear-gradient(135deg, #4682B4 0%, #1E90FF 100%)',
    glow: 'rgba(70, 130, 180, 0.5)'
  },
  angry: {
    primary: '#FF4500', // Orange Red
    secondary: '#FF0000', // Red
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#FF4500',
    gradient: 'linear-gradient(135deg, #FF4500 0%, #FF0000 100%)',
    glow: 'rgba(255, 69, 0, 0.5)'
  },
  neutral: {
    primary: '#808080', // Gray
    secondary: '#A9A9A9', // Dark Gray
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#808080',
    gradient: 'linear-gradient(135deg, #808080 0%, #A9A9A9 100%)',
    glow: 'rgba(128, 128, 128, 0.5)'
  },
  surprised: {
    primary: '#9370DB', // Medium Purple
    secondary: '#8A2BE2', // Blue Violet
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#9370DB',
    gradient: 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 100%)',
    glow: 'rgba(147, 112, 219, 0.5)'
  },
  fearful: {
    primary: '#32CD32', // Lime Green
    secondary: '#228B22', // Forest Green
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#32CD32',
    gradient: 'linear-gradient(135deg, #32CD32 0%, #228B22 100%)',
    glow: 'rgba(50, 205, 50, 0.5)'
  },
  disgusted: {
    primary: '#800080', // Purple
    secondary: '#4B0082', // Indigo
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
    text: '#ffffff',
    accent: '#800080',
    gradient: 'linear-gradient(135deg, #800080 0%, #4B0082 100%)',
    glow: 'rgba(128, 0, 128, 0.5)'
  }
}; 