"use client";
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/youtube-player.css';

interface YouTubePlayerProps {
  videoId: string;
  onClose: () => void;
}

export default function YoutubePlayer({ videoId, onClose }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YT.Player | null>(null);
  const apiLoadedRef = useRef(false);

  useEffect(() => {
    // Only load the API once
    if (!apiLoadedRef.current) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      apiLoadedRef.current = true;
    }

    // Initialize player when API is ready
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer;
    }

    function initializePlayer() {
      // Clean up existing player
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }

      // Clean up any existing wrapper
      const existingWrapper = playerRef.current?.querySelector('.youtube-player-wrapper');
      if (existingWrapper) {
        existingWrapper.remove();
      }

      // Create wrapper div
      const wrapper = document.createElement('div');
      wrapper.className = 'youtube-player-wrapper';
      playerRef.current?.appendChild(wrapper);

      // Initialize new player
      playerInstanceRef.current = new YT.Player(wrapper, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: YT.Player }) => {
            console.log('Player ready');
            const iframe = event.target.getIframe();
            iframe.style.opacity = '1';
            iframe.style.visibility = 'visible';
            iframe.style.position = 'relative';
            iframe.style.zIndex = '11';
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === YT.PlayerState.ENDED) {
              console.log('Video ended');
            }
          }
        },
      });
    }

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
      // Clean up wrapper on unmount
      const wrapper = playerRef.current?.querySelector('.youtube-player-wrapper');
      wrapper?.remove();
    };
  }, [videoId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative w-full max-w-4xl aspect-video mx-4"
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div 
          ref={playerRef} 
          className="w-full h-full"
        />
      </motion.div>
    </motion.div>
  );
} 