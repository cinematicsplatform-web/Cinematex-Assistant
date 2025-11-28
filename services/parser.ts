
import { MediaData, ServerInfo } from '../types';
import { analyzeHtmlWithGemini } from './gemini';

/**
 * Parses a raw HTML string to extract media information.
 * Uses Google Gemini AI to ensure high accuracy in metadata and grouping.
 */
export const parseHtmlContent = async (html: string, inputId: string): Promise<MediaData> => {
  try {
    // Leverage the AI service for parsing
    const aiData = await analyzeHtmlWithGemini(html);

    // Map AI Watch Servers to ServerInfo
    const servers: ServerInfo[] = (aiData.watchServers || []).map(s => ({
      name: s.name + (s.quality ? ` (${s.quality})` : ''),
      url: s.url
    }));

    // Map AI Download Links to ServerInfo
    const downloadLinks: ServerInfo[] = (aiData.downloadLinks || []).map(d => ({
      name: d.name + (d.quality ? ` (${d.quality})` : ''),
      url: d.url
    }));

    // Logic to determine specific episode name for Series
    let episodeName = '';
    if (aiData.type === 'Series') {
      if (aiData.episodeNumber) {
        episodeName = `Episode ${aiData.episodeNumber}`;
      } else {
        // Fallback checks
        const titleMatch = aiData.title.match(/(?:الحلقة|Episode)\s+(\d+)/i);
        if (titleMatch) {
          episodeName = titleMatch[0];
        } else {
          episodeName = aiData.title;
        }
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      originalHtmlInputId: inputId,
      title: aiData.title,
      // Pass the specific AI-extracted grouping and sorting info
      seriesTitle: aiData.seriesTitle,
      season: aiData.seasonNumber,
      episode: aiData.episodeNumber,
      type: aiData.type,
      episodeName: episodeName,
      servers: servers,
      downloadLinks: downloadLinks
    };

  } catch (error) {
    console.error("AI Parsing Error in Batch Extractor:", error);
    
    // Return a fallback object
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalHtmlInputId: inputId,
      title: 'فشل التحليل (AI Error)',
      type: 'Movie',
      servers: [],
      downloadLinks: []
    };
  }
};
