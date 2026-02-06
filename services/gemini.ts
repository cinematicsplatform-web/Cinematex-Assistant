
import { GoogleGenAI, Type } from "@google/genai";
import { AiMediaResponse, ListingExtractionResponse } from "../types";

const mediaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    seriesTitle: { type: Type.STRING },
    seasonNumber: { type: Type.NUMBER },
    episodeNumber: { type: Type.NUMBER },
    originalTitle: { type: Type.STRING },
    year: { type: Type.STRING },
    plot: { type: Type.STRING },
    posterUrl: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Movie", "Series"] },
    rating: { type: Type.STRING },
    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
    cast: { type: Type.ARRAY, items: { type: Type.STRING } },
    watchServers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING },
          quality: { type: Type.STRING },
        },
        required: ["name", "url"]
      }
    },
    downloadLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING },
          quality: { type: Type.STRING },
        },
        required: ["name", "url"]
      }
    },
    directSourceLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING },
          format: { type: Type.STRING },
          quality: { type: Type.STRING }
        },
        required: ["name", "url", "format"]
      }
    },
    activeVideoUrl: { type: Type.STRING, description: "The direct MP4/M3U8 link of the player video. THIS IS THE LIVE VIEWING SERVER." },
    mainDownloadButtonUrl: { type: Type.STRING, description: "The URL of the big red 'تحميل الحلقة' button." },
    downloadPageUrl: { type: Type.STRING },
    watchPageUrl: { type: Type.STRING },
    nextEpisodeUrl: { type: Type.STRING },
    episodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING },
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          thumbnail: { type: Type.STRING },
          duration: { type: Type.STRING },
          plot: { type: Type.STRING },
          isActive: { type: Type.BOOLEAN }
        },
        required: ["number"]
      }
    },
    gallery: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "type", "watchServers"]
};

const listingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    categoryTitle: { type: Type.STRING },
    links: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["links"]
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeHtmlWithGemini = async (htmlContent: string, isSpecialPage: boolean = false, retryCount = 0): Promise<AiMediaResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are an expert cinema web scraper.
    CRITICAL RULES:
    1. A 'Watch Server' or 'Player' MUST be a video link (iframe, embed, or .mp4). 
    2. THE VIDEO PRESENT ON THE PAGE IS THE LIVE VIEWING SERVER.
    3. DO NOT include image URLs (.jpg, .png) in 'watchServers'. Images are NOT viewing servers.
    4. Find the direct MP4/M3U8 video file URL inside player scripts and put it in 'activeVideoUrl'.
    5. Find the actual link inside the big red 'Download Episode' (تحميل الحلقة) button and put it in 'mainDownloadButtonUrl'.
    6. Return valid JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: "Extract data. The video file is the LIVE VIEWING SERVER. The red button is the download link." }, { text: htmlContent.substring(0, 800000) }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mediaResponseSchema,
      },
    });
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    if ((error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) && retryCount < 3) {
      await wait((retryCount + 1) * 2000);
      return analyzeHtmlWithGemini(htmlContent, isSpecialPage, retryCount + 1);
    }
    throw error;
  }
};

export const extractLinksFromListing = async (htmlContent: string, retryCount = 0): Promise<ListingExtractionResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: "Find detail page URLs." }, { text: htmlContent.substring(0, 600000) }] }],
      config: {
        systemInstruction: "Identify movie links only.",
        responseMimeType: "application/json",
        responseSchema: listingResponseSchema,
      },
    });
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    if (error?.message?.includes('429') && retryCount < 3) {
      await wait((retryCount + 1) * 2000);
      return extractLinksFromListing(htmlContent, retryCount + 1);
    }
    throw error;
  }
};
