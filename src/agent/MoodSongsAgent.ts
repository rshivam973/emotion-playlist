import { IModel } from './models/IModel';
import { GeminiModel } from './models/GeminiModel';
import { HuggingFaceModel } from './models/HuggingFaceModel';
import { SongDetailsAgent } from './SongDetailsAgent';

// Define interfaces for song data and mood aspects
interface Song {
    title: string;
    artist: string;
    description: string;
    youtubeQuery: string;
    youtubeLink?: string;
    thumbnail?: string;
  }
  
  interface MoodSongs {
    [key: string]: Song[];
  }
  
  interface MoodAspects {
    [key: string]: string;
  }

  interface AIGeneratedSong {
    title: string;
    artist: string;
  }

  interface AIResponse {
    songs: AIGeneratedSong[];
  }

  interface Location {
    latitude: number;
    longitude: number;
  }
  
  export class MoodSongsAgent {
    private moodSongs: MoodSongs;
    private moodAspects: MoodAspects;
    private model: IModel;
    private songDetailsAgent: SongDetailsAgent;
    private version = '1.0.0';

    constructor() {
      // Initialize the model (you can switch between Gemini and HuggingFace here)
      const useGemini = true; // Set this to false to use HuggingFace
      if (useGemini) {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
        }
        this.model = new GeminiModel({
          apiKey,
          modelName: 'gemini-2.0-flash'
        });
      } else {
        const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN;
        if (!apiKey) {
          throw new Error('NEXT_PUBLIC_HUGGINGFACE_API_TOKEN is not set in environment variables');
        }
        this.model = new HuggingFaceModel({
          apiKey,
          modelName: 'tiiuae/falcon-7b-instruct'
        });
      }
  
      // Initialize the SongDetailsAgent
      this.songDetailsAgent = new SongDetailsAgent();
  
      // Static song data (same as your Python version, abbreviated here)
      this.moodSongs = {
        happy: [
          {
            title: "Don't Stop Believin'",
            artist: "Journey",
            description: "An uplifting anthem that captures the spirit of optimism and perseverance",
            youtubeQuery: "Journey Don't Stop Believin' official",
          },
          {
            title: "Happy",
            artist: "Pharrell Williams",
            description: "A modern pop hit that radiates pure joy and positivity",
            youtubeQuery: "Pharrell Williams Happy official",
          },
          // Add more songs as needed
        ],
        sad: [
          {
            title: "Someone Like You",
            artist: "Adele",
            description: "A powerful ballad about heartbreak and moving forward",
            youtubeQuery: "Adele Someone Like You official",
          },
          // Add more songs
        ],
        angry: [
          {
            title: "Break Stuff",
            artist: "Limp Bizkit",
            description: "A high-energy anthem for releasing frustration",
            youtubeQuery: "Limp Bizkit Break Stuff official",
          },
          // Add more songs
        ],
        neutral: [
          {
            title: "Breathe",
            artist: "Télépopmusik",
            description: "A calming electronic track for peaceful moments",
            youtubeQuery: "Télépopmusik Breathe official",
          },
          // Add more songs
        ],
        // Add other moods (surprised, fearful, disgusted) as needed
      };
  
      this.moodAspects = {
        happy: "Joy, celebration, energy, optimism, and uplift",
        sad: "Melancholy, reflection, emotional depth, and comfort in shared experiences",
        angry: "Intensity, power, catharsis, and emotional release",
        neutral: "Balance, calm, mindfulness, and peaceful reflection",
        surprised: "Excitement, unexpected joy, sudden energy, and wonder",
        fearful: "Comfort, reassurance, hope, and overcoming challenges",
        disgusted: "Intensity, darkness, cynicism, and emotional processing",
      };
    }
  
    // Get mood aspects
    public getMoodAspects(mood: string): string {
      return this.moodAspects[mood.toLowerCase()] || this.moodAspects["neutral"];
    }
  
    // Generate song recommendations with YouTube links
    public async generateSongs(mood: string, location?: Location | null): Promise<Song[]> {
      try {
        // Check if we have API access
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          console.log('No API key found, using fallback songs');
          return this.getDefaultSongs(mood);
        }

        let prompt = `Generate exactly 10 songs that match the mood "${mood}". Return ONLY a JSON array with no additional text.

Each song object in the array must follow this EXACT format:
{
  "title": "Song Title",
  "artist": "Artist Name",
  "description": "Description of why it matches the mood and any regional relevance",
  "youtubeQuery": "Artist Name Song Title official"
}

Requirements:
- Include diverse genres and eras
- Each song must strongly reflect the ${mood} mood
- Make sure the JSON is valid with proper quotes and commas`;

        if (location) {
          // Get region info based on coordinates
          const regionInfo = await this.getRegionInfo(location);
          prompt += `\n\nThe user is located in ${regionInfo}:
- Include 4-5 songs from artists/bands from this region or country
- Include 5-6 international hits that are popular in this region
- For local songs, mention in the description that it's a local/regional artist or band
- For international songs, mention if they are particularly popular in this region
- Focus on both current local hits and classic favorites from the region

Example response format:
[
  {
    "title": "Local Hit",
    "artist": "Local Artist",
    "description": "A ${mood} song by a renowned artist from ${regionInfo}, known for...",
    "youtubeQuery": "Local Artist Local Hit official"
  },
  {
    "title": "Regional Favorite",
    "artist": "International Artist",
    "description": "A ${mood} song that gained massive popularity in ${regionInfo}...",
    "youtubeQuery": "International Artist Regional Favorite official"
  }
]`;
        }

        console.log('Generating songs with prompt:', prompt);
        const generatedText = await this.model.generateContent(prompt);
        
        // Check if the response indicates API exhaustion
        if (generatedText.toLowerCase().includes('resource exhausted') || 
            generatedText.toLowerCase().includes('quota exceeded') ||
            generatedText.toLowerCase().includes('rate limit')) {
          console.log('API resource exhausted, using fallback songs');
          return this.getDefaultSongs(mood);
        }

        console.log('Raw AI response:', generatedText);

        // Clean up the response to ensure valid JSON
        const cleanedText = generatedText
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes with straight quotes
          .replace(/[\u2018\u2019]/g, "'") // Replace smart single quotes with straight single quotes
          .replace(/\n/g, ' ') // Remove newlines
          .trim();
        console.log('Cleaned text:', cleanedText);

        // Extract JSON from the response
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn('No JSON array found in response, using fallback songs');
          return this.getDefaultSongs(mood);
        }

        try {
          const songs = JSON.parse(jsonMatch[0]) as Song[];
          console.log('Parsed songs:', songs);
          
          // Validate the parsed songs
          if (!Array.isArray(songs) || songs.length < 5) {
            console.warn('Invalid or insufficient songs in response, using fallback songs');
            return this.getDefaultSongs(mood);
          }

          // Validate each song object
          const validSongs = songs.filter(song => 
            song.title && 
            song.artist && 
            song.description && 
            song.youtubeQuery &&
            typeof song.title === 'string' &&
            typeof song.artist === 'string' &&
            typeof song.description === 'string' &&
            typeof song.youtubeQuery === 'string'
          );
          console.log('Valid songs:', validSongs);

          if (validSongs.length < 5) {
            console.warn('Not enough valid songs in response, using fallback songs');
            return this.getDefaultSongs(mood);
          }

          // Enrich songs with YouTube details using SongDetailsAgent
          console.log('Enriching songs with YouTube details...');
          const songsWithDetails = await Promise.all(
            validSongs.map(async song => {
              console.log('Enriching song:', song.title);
              const enriched = await this.songDetailsAgent.enrichSongDetails(song);
              console.log('Enriched song:', enriched);
              return enriched;
            })
          );
          console.log('Songs with details:', songsWithDetails);

          // Only fall back if we have no valid songs with YouTube links
          const songsWithValidLinks = songsWithDetails.filter(song => song.youtubeLink && song.thumbnail);
          console.log('Songs with valid links:', songsWithValidLinks);

          // If we have at least 3 songs with valid links, return them
          if (songsWithValidLinks.length >= 3) {
            // Check for local songs if location is provided
            if (location) {
              const localSongCount = songsWithValidLinks.filter(song => {
                const desc = song.description.toLowerCase();
                return (
                  desc.includes('local') || 
                  desc.includes('region') ||
                  desc.includes('from this') ||
                  desc.includes('area') ||
                  desc.includes('country') ||
                  desc.includes('popular in') ||
                  desc.includes('famous in') ||
                  desc.includes('well-known in') ||
                  desc.includes('renowned in') ||
                  desc.includes('celebrated in')
                );
              }).length;
              console.log('Local song count:', localSongCount);

              // If we have at least 2 local songs, return the current songs
              if (localSongCount >= 2) {
                console.log('Returning songs with local content:', songsWithValidLinks);
                return songsWithValidLinks;
              }
            } else {
              // If no location is provided, return the current songs
              console.log('Returning songs without location:', songsWithValidLinks);
              return songsWithValidLinks;
            }
          }

          // If we get here, we need to fall back to default songs
          console.warn('Not enough valid songs with links, using fallback songs');
          return this.getDefaultSongs(mood);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          return this.getDefaultSongs(mood);
        }
      } catch (error) {
        console.error('Error generating songs:', error);
        return this.getDefaultSongs(mood);
      }
    }
  
    // Update getDefaultSongs with more options
    private getDefaultSongs(mood: string): Song[] {
      const defaultSongs: Record<string, Song[]> = {
        happy: [
          {
            title: "Don't Stop Believin'",
            artist: "Journey",
            description: "An uplifting anthem that captures the spirit of optimism",
            youtubeQuery: "Journey Don't Stop Believin' official music",
          },
          {
            title: "Happy",
            artist: "Pharrell Williams",
            description: "A modern pop hit that radiates pure joy and positivity",
            youtubeQuery: "Pharrell Williams Happy official music",
          },
          {
            title: "Walking on Sunshine",
            artist: "Katrina & The Waves",
            description: "A bright and cheerful song that embodies pure happiness",
            youtubeQuery: "Katrina & The Waves Walking on Sunshine official music",
          },
          {
            title: "I Wanna Dance with Somebody",
            artist: "Whitney Houston",
            description: "An energetic pop classic that makes everyone want to dance",
            youtubeQuery: "Whitney Houston I Wanna Dance with Somebody official music",
          },
          {
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            description: "A funky modern hit that brings instant joy",
            youtubeQuery: "Mark Ronson Bruno Mars Uptown Funk official music",
          },
          {
            title: "Can't Stop the Feeling!",
            artist: "Justin Timberlake",
            description: "A feel-good pop song that makes you want to dance",
            youtubeQuery: "Justin Timberlake Can't Stop the Feeling official music",
          },
          {
            title: "Good Vibrations",
            artist: "The Beach Boys",
            description: "A classic that embodies summer happiness",
            youtubeQuery: "The Beach Boys Good Vibrations official music",
          },
          {
            title: "Dancing Queen",
            artist: "ABBA",
            description: "A timeless disco hit that spreads joy",
            youtubeQuery: "ABBA Dancing Queen official music",
          },
          {
            title: "Three Little Birds",
            artist: "Bob Marley",
            description: "A reggae classic about staying positive",
            youtubeQuery: "Bob Marley Three Little Birds official music",
          },
          {
            title: "Shake It Off",
            artist: "Taylor Swift",
            description: "A pop anthem about staying positive despite criticism",
            youtubeQuery: "Taylor Swift Shake It Off official music",
          }
        ],
        sad: [
          {
            title: "Someone Like You",
            artist: "Adele",
            description: "A powerful ballad about heartbreak and moving forward",
            youtubeQuery: "Adele Someone Like You official music",
          },
          {
            title: "Yesterday",
            artist: "The Beatles",
            description: "A timeless melody about longing and regret",
            youtubeQuery: "The Beatles Yesterday official music",
          },
          {
            title: "Hurt",
            artist: "Johnny Cash",
            description: "A haunting cover that explores themes of loss",
            youtubeQuery: "Johnny Cash Hurt official music",
          },
          {
            title: "All By Myself",
            artist: "Celine Dion",
            description: "A powerful vocal performance about loneliness",
            youtubeQuery: "Celine Dion All By Myself official music",
          },
          {
            title: "The Sound of Silence",
            artist: "Simon & Garfunkel",
            description: "A haunting melody about isolation and disconnection",
            youtubeQuery: "Simon & Garfunkel The Sound of Silence official music",
          },
          {
            title: "Nothing Compares 2 U",
            artist: "Sinéad O'Connor",
            description: "An emotional ballad about loss and longing",
            youtubeQuery: "Sinead O'Connor Nothing Compares 2 U official music",
          },
          {
            title: "Mad World",
            artist: "Gary Jules",
            description: "A melancholic interpretation of modern life",
            youtubeQuery: "Gary Jules Mad World official music",
          },
          {
            title: "Fix You",
            artist: "Coldplay",
            description: "A comforting song about helping someone through hard times",
            youtubeQuery: "Coldplay Fix You official music",
          },
          {
            title: "Hallelujah",
            artist: "Jeff Buckley",
            description: "A haunting interpretation of Leonard Cohen's masterpiece",
            youtubeQuery: "Jeff Buckley Hallelujah official music",
          },
          {
            title: "Say Something",
            artist: "A Great Big World & Christina Aguilera",
            description: "A heart-wrenching duet about letting go",
            youtubeQuery: "A Great Big World Christina Aguilera Say Something official music",
          }
        ],
        angry: [
          {
            title: "Break Stuff",
            artist: "Limp Bizkit",
            description: "An intense expression of frustration and anger",
            youtubeQuery: "Limp Bizkit Break Stuff official music",
          },
          {
            title: "Bulls on Parade",
            artist: "Rage Against The Machine",
            description: "A powerful protest song with intense energy",
            youtubeQuery: "Rage Against The Machine Bulls on Parade official music",
          },
          {
            title: "Given Up",
            artist: "Linkin Park",
            description: "An explosive track about reaching breaking point",
            youtubeQuery: "Linkin Park Given Up official music",
          },
          {
            title: "Du Hast",
            artist: "Rammstein",
            description: "An industrial metal anthem with raw power",
            youtubeQuery: "Rammstein Du Hast official music",
          },
          {
            title: "Master of Puppets",
            artist: "Metallica",
            description: "A thrash metal classic about control and anger",
            youtubeQuery: "Metallica Master of Puppets official music",
          },
          {
            title: "Killing in the Name",
            artist: "Rage Against The Machine",
            description: "A protest song with explosive energy",
            youtubeQuery: "Rage Against The Machine Killing in the Name official music",
          },
          {
            title: "Down with the Sickness",
            artist: "Disturbed",
            description: "A nu-metal anthem about unleashing rage",
            youtubeQuery: "Disturbed Down with the Sickness official music",
          },
          {
            title: "I Hate Everything About You",
            artist: "Three Days Grace",
            description: "A hard rock song about conflicted emotions",
            youtubeQuery: "Three Days Grace I Hate Everything About You official music",
          },
          {
            title: "Platypus (I Hate You)",
            artist: "Green Day",
            description: "A fast-paced punk rock expression of hatred",
            youtubeQuery: "Green Day Platypus I Hate You official music",
          },
          {
            title: "People = Shit",
            artist: "Slipknot",
            description: "An extreme metal track about misanthropy",
            youtubeQuery: "Slipknot People Shit official music",
          }
        ],
        neutral: [
          {
            title: "Weightless",
            artist: "Marconi Union",
            description: "A scientifically designed piece to reduce anxiety",
            youtubeQuery: "Marconi Union Weightless official music",
          },
          {
            title: "Breathe",
            artist: "Télépopmusik",
            description: "A calming electronic track for peaceful moments",
            youtubeQuery: "Télépopmusik Breathe official music",
          },
          {
            title: "Clair de Lune",
            artist: "Claude Debussy",
            description: "A serene classical piece that brings tranquility",
            youtubeQuery: "Debussy Clair de Lune official",
          },
          {
            title: "Air on the G String",
            artist: "Johann Sebastian Bach",
            description: "A peaceful baroque piece that soothes the mind",
            youtubeQuery: "Bach Air on the G String official",
          },
          {
            title: "Gymnopédie No.1",
            artist: "Erik Satie",
            description: "A gentle piano piece that creates a calm atmosphere",
            youtubeQuery: "Erik Satie Gymnopédie No.1 official",
          },
          {
            title: "Pure Shores",
            artist: "All Saints",
            description: "A dreamy pop song with a peaceful vibe",
            youtubeQuery: "All Saints Pure Shores official music",
          },
          {
            title: "Porcelain",
            artist: "Moby",
            description: "An ambient electronic track with a neutral mood",
            youtubeQuery: "Moby Porcelain official music",
          },
          {
            title: "Moon River",
            artist: "Henry Mancini",
            description: "A gentle classic that evokes peaceful contemplation",
            youtubeQuery: "Henry Mancini Moon River official",
          },
          {
            title: "The Girl from Ipanema",
            artist: "Stan Getz & João Gilberto",
            description: "A bossa nova classic with a balanced mood",
            youtubeQuery: "Stan Getz João Gilberto The Girl from Ipanema official",
          },
          {
            title: "Comptine d'un autre été",
            artist: "Yann Tiersen",
            description: "A contemplative piano piece that maintains emotional balance",
            youtubeQuery: "Yann Tiersen Comptine d'un autre été official",
          }
        ],
        surprised: [
          {
            title: "Bohemian Rhapsody",
            artist: "Queen",
            description: "An epic journey through different musical styles",
            youtubeQuery: "Queen Bohemian Rhapsody official music",
          },
          {
            title: "Take On Me",
            artist: "a-ha",
            description: "An unexpected blend of synth-pop and unique vocals",
            youtubeQuery: "a-ha Take On Me official music",
          },
          {
            title: "Paranoid Android",
            artist: "Radiohead",
            description: "A multi-part rock odyssey with unexpected turns",
            youtubeQuery: "Radiohead Paranoid Android official music",
          },
          {
            title: "Knights of Shame",
            artist: "AWOLNATION",
            description: "A genre-defying epic with multiple movements",
            youtubeQuery: "AWOLNATION Knights of Shame official music",
          },
          {
            title: "Roundabout",
            artist: "Yes",
            description: "A progressive rock masterpiece with surprising transitions",
            youtubeQuery: "Yes Roundabout official music",
          },
          {
            title: "Get Lucky",
            artist: "Daft Punk ft. Pharrell Williams",
            description: "A surprising fusion of disco and modern electronic",
            youtubeQuery: "Daft Punk Get Lucky official music",
          },
          {
            title: "Feel Good Inc.",
            artist: "Gorillaz",
            description: "A unique blend of hip-hop and alternative rock",
            youtubeQuery: "Gorillaz Feel Good Inc official music",
          },
          {
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            description: "A surprising revival of funk in modern pop",
            youtubeQuery: "Mark Ronson Bruno Mars Uptown Funk official music",
          },
          {
            title: "Black or White",
            artist: "Michael Jackson",
            description: "A pop song with unexpected genre shifts",
            youtubeQuery: "Michael Jackson Black or White official music",
          },
          {
            title: "Supermassive Black Hole",
            artist: "Muse",
            description: "A surprising mix of rock and electronic elements",
            youtubeQuery: "Muse Supermassive Black Hole official music",
          }
        ],
        fearful: [
          {
            title: "Bridge Over Troubled Water",
            artist: "Simon & Garfunkel",
            description: "A comforting song about support during difficult times",
            youtubeQuery: "Simon & Garfunkel Bridge Over Troubled Water official music",
          },
          {
            title: "Everybody Hurts",
            artist: "R.E.M.",
            description: "A reassuring message for difficult times",
            youtubeQuery: "R.E.M. Everybody Hurts official music",
          },
          {
            title: "Lean on Me",
            artist: "Bill Withers",
            description: "A soul classic about finding strength in others",
            youtubeQuery: "Bill Withers Lean on Me official music",
          },
          {
            title: "The Sound of Silence",
            artist: "Disturbed",
            description: "A powerful cover addressing fear and isolation",
            youtubeQuery: "Disturbed The Sound of Silence official music",
          },
          {
            title: "Breathin",
            artist: "Ariana Grande",
            description: "A pop song about overcoming anxiety",
            youtubeQuery: "Ariana Grande Breathin official music",
          },
          {
            title: "Help!",
            artist: "The Beatles",
            description: "A classic about needing support in difficult times",
            youtubeQuery: "The Beatles Help official music",
          },
          {
            title: "Praying",
            artist: "Kesha",
            description: "An emotional song about overcoming fear and trauma",
            youtubeQuery: "Kesha Praying official music",
          },
          {
            title: "Shake It Out",
            artist: "Florence + The Machine",
            description: "An anthem about releasing fear and moving forward",
            youtubeQuery: "Florence + The Machine Shake It Out official music",
          },
          {
            title: "Not Afraid",
            artist: "Eminem",
            description: "A rap song about facing and overcoming fears",
            youtubeQuery: "Eminem Not Afraid official music",
          },
          {
            title: "Brave",
            artist: "Sara Bareilles",
            description: "An empowering song about overcoming fear",
            youtubeQuery: "Sara Bareilles Brave official music",
          }
        ],
        disgusted: [
          {
            title: "Black Hole Sun",
            artist: "Soundgarden",
            description: "A dark grunge classic that captures feelings of disillusionment",
            youtubeQuery: "Soundgarden Black Hole Sun official music",
          },
          {
            title: "Creep",
            artist: "Radiohead",
            description: "A powerful expression of alienation and self-loathing",
            youtubeQuery: "Radiohead Creep official music",
          },
          {
            title: "Loser",
            artist: "Beck",
            description: "A satirical take on societal expectations",
            youtubeQuery: "Beck Loser official music",
          },
          {
            title: "Everything About You",
            artist: "Ugly Kid Joe",
            description: "A song expressing complete disgust with someone",
            youtubeQuery: "Ugly Kid Joe Everything About You official music",
          },
          {
            title: "Hate It Here",
            artist: "Wilco",
            description: "A song about disgust with one's current situation",
            youtubeQuery: "Wilco Hate It Here official music",
          },
          {
            title: "Ignorance",
            artist: "Paramore",
            description: "A pop-punk song about disgust with someone's behavior",
            youtubeQuery: "Paramore Ignorance official music",
          },
          {
            title: "You're So Vain",
            artist: "Carly Simon",
            description: "A classic expression of disgust with narcissism",
            youtubeQuery: "Carly Simon You're So Vain official music",
          },
          {
            title: "Gives You Hell",
            artist: "The All-American Rejects",
            description: "A spiteful song expressing disgust towards an ex",
            youtubeQuery: "The All-American Rejects Gives You Hell official music",
          },
          {
            title: "You Oughta Know",
            artist: "Alanis Morissette",
            description: "An angry expression of disgust towards an ex-lover",
            youtubeQuery: "Alanis Morissette You Oughta Know official music",
          },
          {
            title: "Sick of You",
            artist: "GWAR",
            description: "An extreme metal song expressing universal disgust",
            youtubeQuery: "GWAR Sick of You official music",
          }
        ]
      };
  
      // Get the songs for the requested mood, or happy as fallback
      const moodSongs = defaultSongs[mood.toLowerCase()] || defaultSongs.happy;
      
      // Shuffle the array to get random songs each time
      return this.shuffleArray(moodSongs);
    }
  
    // Add shuffle array method
    private shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  
    // YouTube search with predefined video IDs and fallback behavior
    private async searchYouTube(query: string): Promise<{ url: string; thumbnail: string }> {
      // Default video and thumbnail for fallback
      const defaultVideoId = 'dQw4w9WgXcQ';
      const defaultThumbnail = 'https://i.ytimg.com/vi/default/hqdefault.jpg';

      // Map of known song queries to their actual YouTube video IDs
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

      // Clean up the query to match our keys
      const cleanQuery = query
        .replace(/official music video/i, '')
        .replace(/official/i, '')
        .trim()
        .toLowerCase();

      // Try to find a direct match
      for (const [songQuery, videoId] of Object.entries(knownVideoIds)) {
        if (cleanQuery.includes(songQuery.toLowerCase())) {
          return {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          };
        }
      }

      // If no direct match, try to get video ID from YouTube search
      try {
        const response = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.videoId) {
          return {
            url: `https://www.youtube.com/watch?v=${data.videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`
          };
        }
      } catch (error) {
        console.error('Error searching YouTube:', error);
      }

      // If all else fails, return search URL and default thumbnail
      return {
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        thumbnail: defaultThumbnail
      };
    }

    // Helper method to get region info from coordinates
    private async getRegionInfo(location: Location): Promise<string> {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
        );
        const data = await response.json();
        
        // Extract relevant location info
        const country = data.address?.country;
        const state = data.address?.state;
        const city = data.address?.city;
        
        if (city && state && country) {
          return `${city}, ${state}, ${country}`;
        } else if (state && country) {
          return `${state}, ${country}`;
        } else if (country) {
          return country;
        }
        
        return 'this region';
      } catch (error) {
        console.error('Error getting region info:', error);
        return 'this region';
      }
    }
  }