import React, { useEffect, useRef } from 'react';
import { PlayerState } from '../types';
import { getOfflineAudioTrackUrl } from '../utils/offlineStorage';

interface AudioEngineProps {
  playerState: PlayerState;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onBuffering: (isBuffering: boolean) => void;
  onError: (err: string) => void;
}

export const AudioEngine: React.FC<AudioEngineProps> = ({
  playerState,
  onTimeUpdate,
  onEnded,
  onBuffering,
  onError,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio graph lazily on first user interaction to avoid audio context warnings
  const initAudioGraph = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceNodeRef.current = source;
      biquadFilterRef.current = filter;
      gainNodeRef.current = gain;
    } catch {
      // If Web Audio routing is restricted, native audio element is used safely
    }
  };

  // Sync audio source when track or book changes (checking offline cache first)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = playerState.currentTrack;
    const book = playerState.currentBook;
    if (!track) return;

    let isSubscribed = true;

    async function loadAudioSource() {
      let finalUrl = track!.audioUrl;

      // Check if offline cached copy is available
      if (book) {
        const offlineUrl = await getOfflineAudioTrackUrl(book.id, track!.id);
        if (offlineUrl && isSubscribed) {
          finalUrl = offlineUrl;
        }
      }

      if (!isSubscribed) return;

      if (audio!.src !== finalUrl) {
        audio!.src = finalUrl;
        audio!.load();
        if (playerState.isPlaying) {
          initAudioGraph();
          audio!.play().catch(() => {
            // Autoplay policies
          });
        }
      }
    }

    loadAudioSource();

    return () => {
      isSubscribed = false;
    };
  }, [playerState.currentTrack?.id, playerState.currentBook?.id]);

  // Sync play / pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (playerState.isPlaying) {
      initAudioGraph();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      audio.play().catch(() => {
        // Ignored
      });
    } else {
      audio.pause();
    }
  }, [playerState.isPlaying]);

  // Sync Equalizer / Voice Enhancer filter preset
  useEffect(() => {
    const filter = biquadFilterRef.current;
    if (!filter) return;

    const preset = playerState.voiceEnhancer;
    switch (preset) {
      case 'voice_boost':
        // Peaking filter around vocal frequencies (2.5kHz)
        filter.type = 'peaking';
        filter.frequency.value = 2400;
        filter.Q.value = 1.2;
        filter.gain.value = 6.0; // +6dB clarity boost for voice
        break;
      case 'clarity':
        // High shelf boost for crisp high-end
        filter.type = 'highshelf';
        filter.frequency.value = 4000;
        filter.gain.value = 5.0;
        break;
      case 'bass_warmth':
        // Low shelf boost for warm radio voice
        filter.type = 'lowshelf';
        filter.frequency.value = 200;
        filter.gain.value = 5.5;
        break;
      case 'treble_bright':
        filter.type = 'highshelf';
        filter.frequency.value = 6000;
        filter.gain.value = 6.0;
        break;
      case 'noise_reduce':
        // Gentle lowpass to cut tape/vinyl hiss above 5.5kHz
        filter.type = 'lowpass';
        filter.frequency.value = 5500;
        break;
      case 'off':
      default:
        filter.type = 'allpass';
        filter.gain.value = 0;
        break;
    }
  }, [playerState.voiceEnhancer]);

  // Handle Volume & Sleep Timer Fade-Out
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let targetVolume = playerState.isMuted ? 0 : playerState.volume;

    // If sleep timer is within final 20 seconds, fade volume smoothly to 0
    if (playerState.sleepTimer.isActive && playerState.sleepTimer.remainingSeconds <= 20) {
      const fadeFactor = Math.max(0, playerState.sleepTimer.remainingSeconds / 20);
      targetVolume = targetVolume * fadeFactor;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = targetVolume;
    } else {
      audio.volume = targetVolume;
    }
  }, [playerState.volume, playerState.isMuted, playerState.sleepTimer.isActive, playerState.sleepTimer.remainingSeconds]);

  // Sync playback rate / speed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playerState.playbackSpeed;
  }, [playerState.playbackSpeed]);

  // Sync seek when currentTime differs significantly
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - playerState.currentTime) > 2) {
      audio.currentTime = playerState.currentTime;
    }
  }, [playerState.currentTime]);

  return (
    <audio
      ref={audioRef}
      id="libriaudio-core-audio-element"
      className="hidden"
      crossOrigin="anonymous"
      onTimeUpdate={() => {
        if (audioRef.current) {
          onTimeUpdate(audioRef.current.currentTime, audioRef.current.duration || 0);
        }
      }}
      onWaiting={() => onBuffering(true)}
      onPlaying={() => onBuffering(false)}
      onCanPlay={() => onBuffering(false)}
      onEnded={onEnded}
      onError={() => {
        onBuffering(false);
        onError('Audio source could not be played.');
      }}
    />
  );
};

