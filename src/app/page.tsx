"use client";

import { useState, useEffect, useMemo } from 'react';
import { MoodSongsAgent } from '@/agent/MoodSongsAgent';
import YoutubePlayer from '@/components/YouTubePlayer';
import MoodVisualization from '@/components/MoodVisualization';
import WebcamMoodDetector from '@/components/WebcamMoodDetector';
import { moodThemes } from '@/styles/moodThemes';
import { Playlist } from '@/components/Playlist';
import { useRouter } from 'next/navigation';

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
  youtubeLink?: string;
  thumbnail?: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [moodIntensity, setMoodIntensity] = useState<number>(0.5);
  const [theme, setTheme] = useState(moodThemes.neutral);
  const [showWebcam, setShowWebcam] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);

  const agent = useMemo(() => new MoodSongsAgent(), []);

  const handleLocationToggle = async () => {
    if (!useLocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setUseLocation(true);
        setLocationError(null);
      } catch (err) {
        setLocationError('Location permission denied. Please enable location access in your browser settings.');
        setUseLocation(false);
        setLocation(null);
      }
    } else {
      setUseLocation(false);
      setLocation(null);
    }
  };

  const handleMoodDetected = async (mood: string, intensity: number) => {
    setShowWebcam(false);
    setCurrentMood(mood);
    setMoodIntensity(intensity);
    setTheme(moodThemes[mood as keyof typeof moodThemes] || moodThemes.neutral);
    await generateSongs(mood);
  };

  const generateSongs = async (mood: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const songs = await agent.generateSongs(mood, location);
      setSongs(songs);
      setCurrentMood(mood);
      setTheme(moodThemes[mood as keyof typeof moodThemes] || moodThemes.neutral);
    } catch (err) {
      setError('Failed to generate songs. Please try again.');
      console.error('Song generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDirectVideoLink = (url: string) => {
    return url.includes('youtube.com/watch?v=');
  };

  const getVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <main className="min-h-screen relative bg-gray-900">
      {/* Background with particles */}
      <div className="fixed inset-0 z-0">
        <MoodVisualization mood={currentMood || 'neutral'} intensity={moodIntensity} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white" style={{ color: theme.primary }}>
              Mood Music
            </h1>
            <p className="text-gray-300 mb-6">
              Let your emotions guide your music journey
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={() => setShowWebcam(true)}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2"
                style={{
                  background: theme.gradient,
                  boxShadow: `0 0 10px ${theme.glow}`
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Detect Mood
              </button>

              <button
                onClick={handleLocationToggle}
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2 ${
                  useLocation ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {useLocation ? 'Location Enabled' : 'Enable Location'}
              </button>
            </div>

            {locationError && (
              <div className="text-red-500 bg-red-100/10 backdrop-blur-sm p-4 rounded-lg border border-red-500/20">
                {locationError}
              </div>
            )}

            {error && (
              <div className="text-red-500 bg-red-100/10 backdrop-blur-sm p-4 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white text-lg">Finding the perfect songs for your mood...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          ) : songs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Player */}
              <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden aspect-video">
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
              <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">Playlist</h2>
                </div>
                <div className="h-[calc(100vh-400px)] overflow-y-auto">
                  <Playlist
                    songs={songs}
                    currentSongIndex={currentSongIndex}
                    onSongSelect={(index) => {
                      setCurrentSongIndex(index);
                      const videoId = getVideoId(songs[index].youtubeLink || '');
                      if (videoId) setSelectedVideoId(videoId);
                    }}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showWebcam && (
        <WebcamMoodDetector
          onMoodDetected={handleMoodDetected}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </main>
  );
}