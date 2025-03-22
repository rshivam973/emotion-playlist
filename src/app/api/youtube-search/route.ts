import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { message: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // For now, we'll use a simple regex to extract video ID from the first result
    // This is a temporary solution until we implement proper YouTube API integration
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const html = await response.text();
    
    // Extract first video ID from the page
    const videoIdMatch = html.match(/videoId":"([^"]+)"/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      throw new Error('No video found');
    }

    return NextResponse.json({ videoId });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch video' },
      { status: 500 }
    );
  }
} 