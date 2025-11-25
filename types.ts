
export interface ServerInfo {
  name: string;
  url: string;
}

export interface MediaData {
  id: string;
  originalHtmlInputId: string;
  title: string;
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
