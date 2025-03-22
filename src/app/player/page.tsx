"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import YoutubePlayer from '@/components/YouTubePlayer';
import { Playlist } from '@/components/Playlist';
import { moodThemes } from '@/styles/moodThemes';

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
  youtubeLink?: string;
  thumbnail?: string;
}

// Known video IDs for popular songs
const knownVideoIds: { [key: string]: string } = {
  // Happy songs
  "Happy Pharrell Williams": "ZbZSe6N_BXs",
  "Don't Stop Believin' Journey": "1k8craCGpgs",
  "Walking on Sunshine Katrina & The Waves": "iPUmE-tne5U",
  "I Wanna Dance with Somebody Whitney Houston": "eH3giaIzONA",
  "Uptown Funk Mark Ronson Bruno Mars": "OPf0YbXqDm0",
  
  // Sad songs
  "Someone Like You Adele": "hLQl3WQQoQ0",
  "Hallelujah Jeff Buckley": "y8AWFf7EAc4",
  "Yesterday The Beatles": "NrgmdOz227I",
  "Hurt Johnny Cash": "8AHCfZTRGiI",
  "All By Myself Celine Dion": "NGrLb6W5YOM",
  
  // Angry songs
  "Break Stuff Limp Bizkit": "ZpUYjpKg9KY",
  "Bulls on Parade Rage Against The Machine": "3L4YrGaR8E4",
  "Given Up Linkin Park": "0xyxtzD54rM",
  
  // Neutral songs
  "Weightless Marconi Union": "UfcAVejslrU",
  "Breathe Télépopmusik": "vyut3GyQtn0",
  
  // Other moods
  "Bohemian Rhapsody Queen": "fJ9rUzIMcZQ",
  "Bridge Over Troubled Water Simon & Garfunkel": "4G-YQA_bsOU",
  "Black Hole Sun Soundgarden": "3mbBbFH9fAg",
  
  // Additional popular songs
  "Shape of You Ed Sheeran": "JGwWNGJdvx8",
  "Despacito Luis Fonsi": "kJQP7kiw5Fk",
  "See You Again Wiz Khalifa": "RgKAFK5djSk",
  "Gangnam Style PSY": "9bZkp7q19f0",
  "Sugar Maroon 5": "09R8_2nJtjg",
  "Shake It Off Taylor Swift": "nfWlot6h_JM",
  "Hello Adele": "YQHsXMglC9A",
  "Roar Katy Perry": "CevxZvSJLk8",
  "Counting Stars OneRepublic": "hT_nvWreIhg",
  "Stressed Out Twenty One Pilots": "pXRviuL6vMY"
};

export default function PlayerPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [theme, setTheme] = useState(moodThemes.neutral);

  useEffect(() => {
    // Get songs and mood from localStorage
    const savedSongs = localStorage.getItem('moodSongs');
    const savedMood = localStorage.getItem('currentMood');
    
    if (savedSongs && savedMood) {
      setSongs(JSON.parse(savedSongs));
      setCurrentMood(savedMood);
      setTheme(moodThemes[savedMood as keyof typeof moodThemes] || moodThemes.neutral);
    } else {
      // If no songs are saved, redirect back to home
      router.push('/');
    }
  }, [router]);

  const getVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Try to extract from YouTube URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\s]+)/);
    if (match) return match[1];
    
    // If it's a search URL, try to get the first video ID
    if (url.includes('youtube.com/results')) {
      const searchMatch = url.match(/search_query=([^&]+)/);
      if (searchMatch) {
        // For search URLs, we'll use the first video from our known IDs
        const query = decodeURIComponent(searchMatch[1]);
        const knownVideoId = Object.entries(knownVideoIds).find(([songQuery]) => 
          query.toLowerCase().includes(songQuery.toLowerCase())
        );
        return knownVideoId ? knownVideoId[1] : null;
      }
    }
    
    return null;
  };

  // Handle song selection
  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    const song = songs[index];
    if (song?.youtubeLink) {
      const videoId = getVideoId(song.youtubeLink);
      if (videoId) {
        setSelectedVideoId(videoId);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white" style={{ color: theme.primary }}>
              {currentMood ? `${currentMood.charAt(0).toUpperCase() + currentMood.slice(1)} Mood` : 'Mood Music'}
            </h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300"
              style={{
                background: theme.gradient,
                boxShadow: `0 0 10px ${theme.glow}`
              }}
            >
              New Mood
            </button>
          </div>

          {/* Player and Playlist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Video Player */}
            <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
              {selectedVideoId ? (
                <YoutubePlayer
                  videoId={selectedVideoId}
                  onClose={() => setSelectedVideoId(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  <p>Select a song to play</p>
                </div>
              )}
            </div>

            {/* Playlist */}
            <Playlist
              songs={songs}
              currentSongIndex={currentSongIndex}
              onSongSelect={handleSongSelect}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 