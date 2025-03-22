"use client";
import { useState, useEffect } from 'react';
import YouTubePlayer from './YouTubePlayer';

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
}

const emotionToSearchQuery = {
  happy: "upbeat happy music",
  sad: "sad emotional music",
  angry: "powerful angry music",
  neutral: "calm relaxing music",
  surprised: "exciting uplifting music",
  fearful: "soft calming music",
  disgusted: "dark intense music"
};

const emotionColors = {
  happy: "bg-yellow-50 border-yellow-200",
  sad: "bg-blue-50 border-blue-200",
  angry: "bg-red-50 border-red-200",
  neutral: "bg-gray-50 border-gray-200",
  surprised: "bg-purple-50 border-purple-200",
  fearful: "bg-green-50 border-green-200",
  disgusted: "bg-slate-50 border-slate-200"
};

type Emotion = keyof typeof emotionToSearchQuery;

// Debounce helper function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

export default function MoodPlayer({ emotion }: { emotion: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [debouncedEmotion, setDebouncedEmotion] = useState(emotion);
  const [currentSong, setCurrentSong] = useState<{
    title: string;
    artist: string;
    youtubeQuery: string;
    isPlaying: boolean;
  } | null>(null);

  const fetchSongs = async (emotionToFetch: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/mood-songs?mood=${encodeURIComponent(emotionToFetch.toLowerCase())}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch songs');
      }

      // Only update if the emotion hasn't changed during the fetch
      if (emotionToFetch === debouncedEmotion) {
        setSongs(data.items);
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to fetch song recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Update current emotion immediately for UI
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);

  // Debounce emotion changes for API calls
  useEffect(() => {
    const debouncedUpdate = debounce((newEmotion: string) => {
      setDebouncedEmotion(newEmotion);
    }, 2000); // Wait for 2 seconds of no changes before updating

    debouncedUpdate(emotion);

    return () => {
      // Clear any pending debounced calls when component unmounts
      debouncedUpdate.apply(null, [emotion]);
    };
  }, [emotion]);

  // Fetch songs when debounced emotion changes
  useEffect(() => {
    if (debouncedEmotion) {
      fetchSongs(debouncedEmotion);
    }
  }, [debouncedEmotion]);

  const handlePlayClick = (song: Song) => {
    setCurrentSong({
      title: song.title,
      artist: song.artist,
      youtubeQuery: song.youtubeQuery,
      isPlaying: true
    });
  };

  const moodColor = emotionColors[currentEmotion.toLowerCase() as Emotion] || emotionColors.neutral;

  return (
    <div className="mt-4 space-y-6">
      {/* Header */}
      <div className={`p-4 ${moodColor} rounded-lg border`}>
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Music for Your {currentEmotion} Mood
        </h2>
        <p className="text-center text-gray-600 mt-2">
          Here are some songs that match how you're feeling
        </p>
        {currentEmotion !== debouncedEmotion && (
          <p className="text-center text-gray-500 text-sm mt-2 italic">
            Updating recommendations in a moment...
          </p>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6">
        {/* YouTube Player */}
        <div className="w-full">
          <YouTubePlayer
            searchQuery={currentSong?.youtubeQuery || ''}
            songTitle={currentSong ? `${currentSong.title} - ${currentSong.artist}` : ''}
            isPlaying={currentSong?.isPlaying || false}
          />
        </div>

        {/* Song List */}
        <div className="w-full">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">
                Finding the perfect songs...
              </span>
            </div>
          )}

          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-center">
                {error}
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {songs.map((song, index) => (
              <div 
                key={index} 
                className={`p-4 ${moodColor} rounded-lg border transition-all duration-300 hover:shadow-md hover:scale-[1.01] group cursor-pointer ${
                  currentSong?.title === song.title ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handlePlayClick(song)}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-gray-700">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <button
                    className={`flex-shrink-0 p-2 rounded-full ${
                      currentSong?.title === song.title
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-600 text-white'
                    } hover:opacity-90 transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 