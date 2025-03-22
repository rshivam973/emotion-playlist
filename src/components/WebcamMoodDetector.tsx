'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebcamMoodDetectorProps {
  onMoodDetected: (mood: string, intensity: number) => void;
  onClose: () => void;
}

const WebcamMoodDetector = ({ onMoodDetected, onClose }: WebcamMoodDetectorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsLoading(false);
      } catch (err) {
        setError('Failed to access webcam. Please make sure you have granted camera permissions.');
        setIsLoading(false);
      }
    };

    startWebcam();

    return () => {
      stopWebcam();
    };
  }, []);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    // Simulate mood detection
    const moods = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomIntensity = Math.random();
    onMoodDetected(randomMood, randomIntensity);
  };

  const handleClose = () => {
    setIsClosing(true);
    stopWebcam();
    onClose();
  };

  if (isClosing) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-500 text-center p-4">
              <p>{error}</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <button
                onClick={handleCapture}
                className="w-full py-3 px-6 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Capture Mood
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default WebcamMoodDetector; 