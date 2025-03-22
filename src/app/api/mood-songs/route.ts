import { NextResponse } from 'next/server';
import { MoodSongsAgent } from '@/agent/MoodSongsAgent';

type Mood = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised' | 'fearful' | 'disgusted';

interface Song {
  title: string;
  artist: string;
  description: string;
  youtubeQuery: string;
  youtubeLink?: string;
}

const moodAgent = new MoodSongsAgent();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood')?.toLowerCase() as Mood;

    if (!mood) {
      return NextResponse.json(
        { message: 'Valid mood parameter is required' },
        { status: 400 }
      );
    }

    const songs = await moodAgent.generateSongs(mood);
    return NextResponse.json({ items: songs });
  } catch (error) {
    console.error('Song generation error:', error);
    return NextResponse.json(
      { message: 'Failed to generate song recommendations' },
      { status: 500 }
    );
  }
} 