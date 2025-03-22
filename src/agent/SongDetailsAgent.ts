import { IModel } from './models/IModel';
import { GeminiModel } from './models/GeminiModel';

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
  youtubeLink?: string;
  thumbnail?: string;
}

export class SongDetailsAgent {
  private model: IModel;
  private knownVideoIds: { [key: string]: string };

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
    }
    this.model = new GeminiModel({
      apiKey,
      modelName: 'gemini-2.0-flash'
    });

    // Initialize known video IDs
    this.knownVideoIds = {
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
  }

  public async enrichSongDetails(song: Song): Promise<Song> {
    try {
      // First try to find a direct match in known video IDs
      const cleanQuery = this.cleanQuery(song.youtubeQuery);
      const knownVideoId = this.findKnownVideoId(cleanQuery);
      
      if (knownVideoId) {
        return {
          ...song,
          youtubeLink: `https://www.youtube.com/watch?v=${knownVideoId}`,
          thumbnail: `https://i.ytimg.com/vi/${knownVideoId}/hqdefault.jpg`
        };
      }

      // If no direct match, try to get video ID from YouTube search
      const videoId = await this.searchYouTube(cleanQuery);
      if (videoId) {
        return {
          ...song,
          youtubeLink: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
      }

      // If still no match, try to improve the query using AI
      const improvedQuery = await this.improveQuery(song);
      if (improvedQuery) {
        const improvedVideoId = await this.searchYouTube(improvedQuery);
        if (improvedVideoId) {
          return {
            ...song,
            youtubeQuery: improvedQuery,
            youtubeLink: `https://www.youtube.com/watch?v=${improvedVideoId}`,
            thumbnail: `https://i.ytimg.com/vi/${improvedVideoId}/hqdefault.jpg`
          };
        }
      }

      // If all else fails, return the original song with a search URL
      return {
        ...song,
        youtubeLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(song.youtubeQuery)}`,
        thumbnail: 'https://i.ytimg.com/vi/default/hqdefault.jpg'
      };
    } catch (error) {
      console.error('Error enriching song details:', error);
      return song;
    }
  }

  private cleanQuery(query: string): string {
    return query
      .replace(/official music video/i, '')
      .replace(/official/i, '')
      .replace(/lyrics/i, '')
      .replace(/audio/i, '')
      .trim()
      .toLowerCase();
  }

  private findKnownVideoId(query: string): string | null {
    for (const [songQuery, videoId] of Object.entries(this.knownVideoIds)) {
      if (query.includes(songQuery.toLowerCase())) {
        return videoId;
      }
    }
    return null;
  }

  private async searchYouTube(query: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.videoId || null;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return null;
    }
  }

  private async improveQuery(song: Song): Promise<string | null> {
    try {
      const prompt = `Improve this YouTube search query to find the official music video: "${song.youtubeQuery}"
      
      Requirements:
      - Keep the artist name and song title
      - Add relevant keywords like "official", "music video", "official audio"
      - Remove any unnecessary words
      - Keep it concise but effective
      
      Return ONLY the improved query, no additional text.`;

      const improvedQuery = await this.model.generateContent(prompt);
      return improvedQuery.trim();
    } catch (error) {
      console.error('Error improving query:', error);
      return null;
    }
  }
} 