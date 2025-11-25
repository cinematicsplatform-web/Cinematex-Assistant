
import { MediaData, ServerInfo } from '../types';
import { analyzeHtmlWithGemini } from './gemini';

/**
 * Parses a raw HTML string to extract media information.
 * Now uses Google Gemini AI (via analyzeHtmlWithGemini) to ensure high accuracy
 * and consistency with the "Smart Extractor" tool.
 */
export const parseHtmlContent = async (html: string, inputId: string): Promise<MediaData> => {
  try {
    // Leverage the AI service for parsing instead of brittle DOM manipulation
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
      // 1. Try to extract "Episode X" from the main title
      const titleMatch = aiData.title.match(/(?:الحلقة|Episode)\s+(\d+)/i);
      
      if (titleMatch) {
        episodeName = titleMatch[0];
      } else if (aiData.episodes && aiData.episodes.length === 1) {
        // 2. If the AI found exactly one episode listed (often the current one), use that
        episodeName = `Episode ${aiData.episodes[0].number}`;
      } else {
        // 3. Fallback: Use the full title which often contains the episode info
        episodeName = aiData.title;
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      originalHtmlInputId: inputId,
      title: aiData.title,
      type: aiData.type,
      episodeName: episodeName,
      servers: servers,
      downloadLinks: downloadLinks
    };

  } catch (error) {
    console.error("AI Parsing Error in Batch Extractor:", error);
    
    // Return a fallback object so the entire batch process doesn't crash
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
