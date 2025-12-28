import { GoogleGenAI, Type } from "@google/genai";
import { AiMediaResponse, ListingExtractionResponse } from "../types";

const mediaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The full title of the specific page (e.g. 'Breaking Bad Season 1 Episode 5')." },
    seriesTitle: { type: Type.STRING, description: "For Series ONLY: The canonical name of the show without season/episode info (e.g. 'Breaking Bad'). Normalize Arabic (e.g. 'أ' -> 'ا')." },
    seasonNumber: { type: Type.NUMBER, description: "For Series: The season number. Default to 1 if unknown." },
    episodeNumber: { type: Type.NUMBER, description: "For Series: The episode number." },
    originalTitle: { type: Type.STRING, description: "Original title (e.g. English title) if available." },
    year: { type: Type.STRING, description: "Release year." },
    plot: { type: Type.STRING, description: "A brief summary or plot of the content." },
    posterUrl: { type: Type.STRING, description: "URL of the main poster image (og:image or main img)." },
    type: { type: Type.STRING, enum: ["Movie", "Series"], description: "Type of content." },
    rating: { type: Type.STRING, description: "IMDb or site rating (e.g. 8.5/10)." },
    genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of genres (Action, Drama, etc.)." },
    cast: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of main actors." },
    watchServers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the server (e.g. VidFast, UptoBox)." },
          url: { type: Type.STRING, description: "The direct embed or watch URL. MUST NOT be the current page URL or another page on the same domain unless it is a direct iframe source." },
          quality: { type: Type.STRING, description: "Quality (1080p, 720p) if available." },
        },
        required: ["name", "url"]
      }
    },
    downloadLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the host (e.g. Mega, Mediafire)." },
          url: { type: Type.STRING, description: "The direct download URL." },
          quality: { type: Type.STRING, description: "Quality info." },
        },
        required: ["name", "url"]
      }
    },
    downloadPageUrl: { type: Type.STRING, description: "The URL of the dedicated download page if a 'Download' or 'Tahmil' button leads to it." },
    watchPageUrl: { type: Type.STRING, description: "The URL of the player page if a 'Watch' or 'Play' button leads to a separate page (often play.php or similar) containing the actual servers." },
    nextEpisodeUrl: { type: Type.STRING, description: "The URL of the next episode. Look for 'Next Episode', 'الحلقة التالية', or a link following the current sequence." },
    episodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING, description: "Episode number." },
          title: { type: Type.STRING, description: "Episode title." },
          url: { type: Type.STRING, description: "Link to the episode page." },
          thumbnail: { type: Type.STRING, description: "Thumbnail URL specific to this episode." },
          duration: { type: Type.STRING, description: "Duration of the episode (e.g. '45 min')." },
          plot: { type: Type.STRING, description: "Specific plot/summary of the episode if available." }
        },
        required: ["number"]
      }
    },
    gallery: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A comprehensive list of ALL extracted image URLs." }
  },
  required: ["title", "type", "watchServers"],
  propertyOrdering: ["title", "seriesTitle", "seasonNumber", "episodeNumber", "originalTitle", "year", "plot", "posterUrl", "type", "rating", "genres", "cast", "watchServers", "downloadLinks", "downloadPageUrl", "watchPageUrl", "nextEpisodeUrl", "episodes", "gallery"]
};

const listingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    categoryTitle: { type: Type.STRING, description: "The title of the category or page (e.g. 'Arabic Movies')." },
    links: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of all unique URLs pointing to individual movie or series detail pages. Filter out navigation, social, or static page links."
    }
  },
  required: ["links"]
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeHtmlWithGemini = async (htmlContent: string, isSpecialPage: boolean = false, retryCount = 0): Promise<AiMediaResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = isSpecialPage 
    ? `You are analyzing a SECONDARY PAGE (Download or Watch/Player page). 
       Focus solely on extracting the direct server links.
       Return valid JSON only.`
    : `
    You are an expert web scraper for cinema sites. Extract metadata and servers.
    Return the result in valid JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: isSpecialPage ? "Extract direct links from this secondary page." : "Extract all data." },
            { text: htmlContent.substring(0, 800000) } 
          ]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mediaResponseSchema,
      },
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr.trim());

  } catch (error: any) {
    // Handle 429 Quota Exceeded error with retries
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      if (retryCount < 3) {
        const delay = (retryCount + 1) * 3000; // 3s, 6s, 9s delay
        console.warn(`Gemini Quota limit hit. Retrying in ${delay/1000}s... (Attempt ${retryCount + 1})`);
        await wait(delay);
        return analyzeHtmlWithGemini(htmlContent, isSpecialPage, retryCount + 1);
      }
      throw new Error("لقد تجاوزت حصة الاستخدام المجانية لـ Gemini (429 Quota Exceeded). يرجى المحاولة مرة أخرى بعد دقيقة أو استخدام مفتاح API مدفوع.");
    }
    
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const extractLinksFromListing = async (htmlContent: string, retryCount = 0): Promise<ListingExtractionResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Find all URLs that lead to movie or series details. Ignore links to categories, social media, or terms of service. Focus on the main content area." },
            { text: htmlContent.substring(0, 600000) } 
          ]
        }
      ],
      config: {
        systemInstruction: "You are a specialist in identifying movie item links on listing pages. Extract only the detail page URLs.",
        responseMimeType: "application/json",
        responseSchema: listingResponseSchema,
      },
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr.trim());

  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      if (retryCount < 3) {
        const delay = (retryCount + 1) * 3000;
        console.warn(`Gemini Listing Quota limit hit. Retrying in ${delay/1000}s...`);
        await wait(delay);
        return extractLinksFromListing(htmlContent, retryCount + 1);
      }
      throw new Error("تجاوزت حصة الاستخدام لـ Gemini أثناء تحليل روابط القسم. يرجى الانتظار قليلاً.");
    }
    console.error("Gemini Listing Analysis Failed:", error);
    throw error;
  }
};