import type { Howl } from 'howler'
import type { Ref } from 'vue'

export interface Map {
  id: string;
  street: string;
  map: string;
}

export interface Metadata {
  albumArtist: string;
  artist: string;
  title: string;
  year: string;
  titleAlt?: string;
}

export interface Source {
  client?: string;
  date?: string;
  structure: string;
  version?: string;
}

export interface MapleBgmData {
  description: string;
  filename: string;
  mark: string;
  metadata: Metadata;
  source: Source;
  youtube: string;
  maps: Map[];
  downloadable: boolean;
}

export interface Song {
  mark: string;
  name: string;
  albumArtist: string;
  artist: string;
  description: string;
  keywords: string;
  music: Howl | null;
}

export type RepeatType = 'none' | 'all' | 'single'

export interface UseMusicPlayer {
  loadSong: (data: MapleBgmData) => Promise<void>;
  isMuted: Ref<boolean>;
  toggleMute: () => boolean;
  volume: Ref<number>;
  isDraggingCurrentTime: Ref<boolean>;
  currentTime: Ref<number>;
  currentTimeText: Ref<string>;
  duration: Ref<number>;
  durationText: Ref<string>;
  isPlaying: Ref<boolean>;
  isLoaded: Ref<boolean>;
  togglePlay: () => void;
  repeatType: Ref<RepeatType>;
  toggleRepeat: () => void;
  isRandomMode: Ref<boolean>;
  toggleRandomMode: () => void;
}

export interface UseSong {
  song: Ref<Song | null>;
  mark: Ref<string | null>;
  name: Ref<string | null>;
  albumArtist: Ref<string | null>;
  artist: Ref<string | null>;
  description: Ref<string | null>;
  keywords: Ref<string | null>;
  music: Ref<Howl | null>;
}
