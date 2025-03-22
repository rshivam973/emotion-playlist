"use client";
import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";

export default function WebcamEmotionDetector({ onEmotionDetected }: { onEmotionDetected: (emotion: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        toast.success("Emotion detection models loaded");
      } catch (error) {
        toast.error("Failed to load emotion detection models");
        console.error("Model loading error:", error);
      }
    };
    loadModels();
  }, []);

  // Start webcam and detect emotions
  useEffect(() => {
    if (!modelsLoaded) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          toast.success("Camera access granted");
        }
      } catch (error) {
        setHasPermission(false);
        toast.error("Camera access denied. Please allow camera access to detect emotions.");
        console.error("Camera access error:", error);
      }
    };

    const detectEmotions = async () => {
      if (videoRef.current) {
        try {
          const detections = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          if (detections && detections.expressions) {
            const expressions = detections.expressions;
            const maxExpression = Object.entries(expressions).reduce((a, b) =>
              a[1] > b[1] ? a : b
            )[0];
            onEmotionDetected(maxExpression);
          }
          animationFrameRef.current = requestAnimationFrame(detectEmotions);
        } catch (error) {
          console.error("Emotion detection error:", error);
        }
      }
    };

    startVideo();
    let cleanup = false;
    
    if (videoRef.current) {
      videoRef.current.addEventListener("play", () => {
        if (!cleanup) {
          detectEmotions();
        }
      });
    }

    return () => {
      cleanup = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [modelsLoaded, onEmotionDetected]);

  return (
    <div style={{ position: 'relative' }}>
      {!hasPermission && hasPermission !== null && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Camera access is required for emotion detection
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="320"
        height="240"
        style={{ borderRadius: '8px' }}
      />
    </div>
  );
}