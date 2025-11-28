
export interface ServerInfo {
  name: string;
  url: string;
}

export interface MediaData {
  id: string;
  originalHtmlInputId: string;
  title: string;
  seriesTitle?: string; // New: Clean name for grouping (e.g. "Game of Thrones" without S01E01)
  season?: number;      // New: Explicit season number
  episode?: number;     // New: Explicit episode number
  type: 'Movie' | 'Series';
  episodeName?: string; // For series
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

// --- AI Extractor Types ---

export interface AiCastMember {
  name: string;
  role?: string;
}

export interface AiEpisode {
  number: string;
  title: string;
  url?: string;
  thumbnail?: string;
}

export interface AiMediaResponse {
  title: string;
  originalTitle?: string;
  seriesTitle?: string; // New
  seasonNumber?: number; // New
  episodeNumber?: number; // New
  year?: string;
  plot?: string;
  posterUrl?: string;
  type: 'Movie' | 'Series';
  rating?: string;
  genres: string[];
  cast: string[];
  watchServers: { name: string; url: string; quality?: string }[];
  downloadLinks: { name: string; url: string; quality?: string }[];
  episodes?: AiEpisode[];
  gallery?: string[];
}
