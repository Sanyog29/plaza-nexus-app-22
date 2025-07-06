import { useState, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export function useVoiceNotes() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  }, [isRecording]);

  const saveVoiceNote = useCallback(async (visitorId: string, noteType: string) => {
    if (!audioBlob) {
      toast.error('No audio recording available');
      return null;
    }

    setIsUploading(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `voice-note-${visitorId}-${noteType}-${timestamp}.wav`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('visitor-photos')
        .upload(filename, audioBlob, {
          contentType: 'audio/wav',
          upsert: false
        });

      if (uploadError) {
        toast.error('Failed to upload voice note');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('visitor-photos')
        .getPublicUrl(filename);

      // Save to database
      const { error: dbError } = await supabase
        .from('visitor_check_logs')
        .insert({
          visitor_id: visitorId,
          action_type: 'voice_note',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Voice note recorded: ${noteType}`,
          metadata: {
            audio_url: urlData.publicUrl,
            note_type: noteType,
            duration: audioBlob.size,
            timestamp: new Date().toISOString()
          }
        });

      if (dbError) {
        toast.error('Failed to save voice note record');
        return null;
      }

      toast.success('Voice note saved successfully');
      setAudioBlob(null);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error('Failed to save voice note');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  }, []);

  return {
    isRecording,
    hasRecording: !!audioBlob,
    isUploading,
    startRecording,
    stopRecording,
    saveVoiceNote,
    clearRecording
  };
}