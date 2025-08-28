import { useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export type FacingMode = 'user' | 'environment';

export interface CameraOptions {
  facingMode?: FacingMode;
}

export interface CameraDiagnostics {
  isSecureContext: boolean;
  isNative: boolean;
  hasGetUserMedia: boolean;
  lastError: string | null;
  activeTracks: number;
}

export function useCamera() {
  const streamRef = useRef<MediaStream | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  const getDiagnostics = useCallback((): CameraDiagnostics => {
    return {
      isSecureContext: window.isSecureContext,
      isNative: Capacitor.isNativePlatform(),
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      lastError: lastErrorRef.current,
      activeTracks: streamRef.current?.getTracks().length || 0,
    };
  }, []);

  const start = useCallback(
    async (videoEl: HTMLVideoElement, opts?: CameraOptions) => {
      lastErrorRef.current = null;

      if (!navigator.mediaDevices?.getUserMedia) {
        const error = 'Camera API not available in this browser.';
        lastErrorRef.current = error;
        throw new Error(error);
      }

      const isSecure = window.isSecureContext || location.hostname === 'localhost';
      const isNative = Capacitor.isNativePlatform();

      if (!isSecure && !isNative) {
        const error = 'Camera requires HTTPS or http://localhost in the browser.';
        lastErrorRef.current = error;
        throw new Error(error);
      }

      // Progressive constraints: modest first to avoid OverconstrainedError
      const facingMode = opts?.facingMode ?? 'user';
      const candidates: MediaStreamConstraints[] = [
        { video: { facingMode }, audio: false },
        { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' }, audio: false },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;

      for (const constraints of candidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastErr = err;
          console.warn('Camera constraint failed:', constraints, err);
        }
      }

      if (!stream) {
        const error = `Unable to access camera: ${lastErr}`;
        lastErrorRef.current = error;
        throw new Error(error);
      }

      streamRef.current = stream;

      // Wire up the video element correctly (mobile-safe)
      videoEl.muted = true;
      (videoEl as any).playsInline = true; // iOS Safari requirement
      (videoEl as any).srcObject = stream;

      try {
        await videoEl.play();
      } catch (playError) {
        console.warn('Video play failed (may be autoplay policy):', playError);
        // Some browsers may block autoplay without gesture, but our button click counts as a user gesture.
      }

      return stream;
    },
    []
  );

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped camera track:', track.kind, track.label);
      });
      streamRef.current = null;
    }
  }, []);

  return { 
    start, 
    stop, 
    streamRef, 
    getDiagnostics 
  };
}