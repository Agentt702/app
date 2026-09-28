import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from "expo-audio";
import { useEffect, useState } from "react";

type Listener = () => void;

type PlayerState = {
  loading: boolean;
  playing: boolean;
  positionMillis: number;
  durationMillis: number;
  currentText: string | null;
  currentTitle: string | null;
  currentUrl: string | null;
};

class AudioStore {
  private player: AudioPlayer | null = null;
  private statusSub: { remove: () => void } | null = null;
  private listeners = new Set<Listener>();
  private modeReady = false;

  state: PlayerState = {
    loading: false,
    playing: false,
    positionMillis: 0,
    durationMillis: 0,
    currentText: null,
    currentTitle: null,
    currentUrl: null,
  };

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  async ensureMode() {
    if (this.modeReady) return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        allowsRecording: false,
      } as any);
      this.modeReady = true;
    } catch {}
  }

  private teardownPlayer() {
    try {
      this.statusSub?.remove();
    } catch {}
    this.statusSub = null;
    try {
      this.player?.remove();
    } catch {}
    this.player = null;
  }

  async load(url: string, title: string, text: string) {
    await this.ensureMode();

    if (this.state.currentUrl === url && this.player) {
      try {
        this.player.play();
      } catch {}
      return;
    }

    this.teardownPlayer();
    this.set({
      loading: true,
      playing: false,
      positionMillis: 0,
      durationMillis: 0,
      currentUrl: url,
      currentTitle: title,
      currentText: text,
    });

    try {
      this.player = createAudioPlayer({ uri: url });
      this.statusSub = this.player.addListener("playbackStatusUpdate", (s: AudioStatus) => {
        this.set({
          loading: !s.isLoaded,
          playing: !!s.playing,
          positionMillis: s.currentTime ? s.currentTime * 1000 : 0,
          durationMillis: s.duration ? s.duration * 1000 : 0,
        });
        if (s.didJustFinish) {
          try {
            this.player?.seekTo(0);
          } catch {}
          this.set({ playing: false, positionMillis: 0 });
        }
      });
      this.player.play();
    } catch (e) {
      this.set({ loading: false, playing: false });
      throw e;
    }
  }

  play() {
    try {
      this.player?.play();
    } catch {}
  }
  pause() {
    try {
      this.player?.pause();
    } catch {}
  }
  toggle() {
    if (this.state.playing) this.pause();
    else this.play();
  }
  seekBy(deltaMs: number) {
    if (!this.player) return;
    const next = Math.max(0, (this.state.positionMillis + deltaMs) / 1000);
    try {
      this.player.seekTo(next);
    } catch {}
  }
  seekTo(ms: number) {
    if (!this.player) return;
    try {
      this.player.seekTo(ms / 1000);
    } catch {}
  }
  stopAndClear() {
    this.teardownPlayer();
    this.set({
      loading: false,
      playing: false,
      positionMillis: 0,
      durationMillis: 0,
      currentText: null,
      currentTitle: null,
      currentUrl: null,
    });
  }
}

export const audioStore = new AudioStore();

export function useAudioState() {
  const [, setTick] = useState(0);
  useEffect(() => audioStore.subscribe(() => setTick((n) => n + 1)), []);
  return audioStore.state;
}

export function formatTime(ms: number) {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
