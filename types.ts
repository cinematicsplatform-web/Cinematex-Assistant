
export interface ServerInfo {
  name: string;
  url: string;
}

export interface MediaData {
  id: string;
  originalHtmlInputId: string;
  title: string;
  seriesTitle?: string;
  season?: number;
  episode?: number;
  type: 'Movie' | 'Series';
  episodeName?: string;
  servers: ServerInfo[];
  downloadLinks: ServerInfo[];
}

export interface HtmlInput {
  id: string;
  content: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface AppSettings {
  uqloadApiKey: string;
  filenamePrefix: string;
  ignoredKeywords: string[];
}

export interface AiCastMember {
  name: string;
  role?: string;
}

export interface AiEpisode {
  number: string;
  title: string;
  url?: string;
  thumbnail?: string;
  duration?: string;
  plot?: string;
  isActive?: boolean;
}

export interface AiMediaResponse {
  title: string;
  originalTitle?: string;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  year?: string;
  plot?: string;
  posterUrl?: string;
  type: 'Movie' | 'Series';
  rating?: string;
  genres: string[];
  cast: string[];
  watchServers: { name: string; url: string; quality?: string }[];
  downloadLinks: { name: string; url: string; quality?: string }[];
  directSourceLinks?: { name: string; url: string; format: string; quality?: string }[];
  activeVideoUrl?: string; // The URL of the video currently playing in the player
  mainDownloadButtonUrl?: string; // The URL of the primary "Download" red button
  downloadPageUrl?: string; 
  watchPageUrl?: string; 
  nextEpisodeUrl?: string; 
  episodes?: AiEpisode[];
  gallery?: string[];
}

export interface CloneResult {
  id: string;
  originalUrl: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  newCode?: string;
  watchUrl?: string;
  downloadUrl?: string;
  message?: string;
}

export interface ListingExtractionResponse {
  links: string[];
  categoryTitle?: string;
}

export interface ScriptExtractionResult {
  title: string;
  servers: ServerInfo[];
  downloadLinks: ServerInfo[];
  nextUrl?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  activeVideoUrl?: string;
  mainDownloadButtonUrl?: string;
  allEpisodes?: { number: number; url: string }[];
}
