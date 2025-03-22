import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
  youtubeLink?: string;
  thumbnail?: string;
}

interface PlaylistProps {
  songs: Song[];
  currentSongIndex: number | null;
  onSongSelect: (index: number) => void;
  theme: {
    primary: string;
    glow: string;
    gradient: string;
  };
}

export function Playlist({ songs, currentSongIndex, onSongSelect, theme }: PlaylistProps) {
  return (
    <div className="space-y-2 p-2">
      {songs.map((song, index) => (
        <button
          key={index}
          onClick={() => onSongSelect(index)}
          className={cn(
            "w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
            "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20",
            currentSongIndex === index && "bg-white/20"
          )}
        >
          <div className="relative w-16 h-16 flex-shrink-0">
            <img
              src={song.thumbnail || 'https://i.ytimg.com/vi/default/hqdefault.jpg'}
              alt={song.title}
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 hover:opacity-100 transition-opacity">
              {currentSongIndex === index ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-medium text-white truncate">{song.title}</h3>
            <p className="text-sm text-gray-400 truncate">{song.artist}</p>
          </div>
        </button>
      ))}
    </div>
  );
} 