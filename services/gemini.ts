
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiMediaResponse } from "../types";

// Schema definition for the Gemini response
const mediaResponseSchema: Schema = {
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
          url: { type: Type.STRING, description: "The embed or watch URL." },
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
          url: { type: Type.STRING, description: "The download URL." },
          quality: { type: Type.STRING, description: "Quality info." },
        },
        required: ["name", "url"]
      }
    },
    episodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.STRING, description: "Episode number." },
          title: { type: Type.STRING, description: "Episode title if available." },
          url: { type: Type.STRING, description: "Link to the episode page." },
          thumbnail: { type: Type.STRING, description: "Thumbnail URL for this specific episode." }
        },
        required: ["number"]
      }
    },
    gallery: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A comprehensive list of ALL extracted image URLs (posters, backdrops, cast photos, episode thumbnails, related content images, slider images)." }
  },
  required: ["title", "type", "watchServers"]
};

export const analyzeHtmlWithGemini = async (htmlContent: string): Promise<AiMediaResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // System instruction to guide the model's behavior
  const systemInstruction = `
    You are an expert web scraper and HTML parser specialized in video streaming websites.
    Your task is to analyze the provided raw HTML source code and extract structured metadata.

    ### 1. TYPE & IDENTIFICATION (CRITICAL)
    - **Determine Type**: 'Movie' or 'Series'. Look for keywords like "Episode", "Season", "الحلقة", "موسم".
    - **Series Metadata**: If it is a Series, you MUST extract:
      1. \`seriesTitle\`: The clean name of the show. REMOVE all season/episode info. Normalize Arabic characters (unify 'أ/إ/آ' to 'ا', 'ة' to 'ه'). Example: "مسلسل المؤسس عثمان الموسم 4 الحلقة 5" -> "المؤسس عثمان". This is CRITICAL for grouping.
      2. \`seasonNumber\`: The integer of the season.
      3. \`episodeNumber\`: The integer of the episode.

    ### 2. IMAGE EXTRACTION (AGGRESSIVE MODE)
    Your goal is to extract **EVERY SINGLE** image related to the media content found in the code.
    Populate the 'gallery' array with ALL of them.

    **Where to look:**
    1.  **Standard Tags**: \`<img src="..." ...>\`
    2.  **Lazy Loading**: Look for \`data-src\`, \`data-original\`, \`data-lazy-src\`.
    3.  **Scripts & JSON**: deeply analyze \`<script>\` tags for JSON objects containing image lists.
    4.  **Meta Tags**: \`og:image\`, \`twitter:image\`.

    ### 3. SERVER & VIDEO SYSTEM
    - **Watch Servers**: Exhaustively search \`<iframe>\`, \`<button>\` data-attributes, and JavaScript variables.
    - **Download Links**: Look for \`<a>\` tags with text "Download", "Tahmil", "تحميل".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: "Analyze this HTML code and extract metadata, focusing on correct Series Title grouping and Episode numbering:" },
            // Increase input limit significantly to catch scripts and footers where galleries often live
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

    let jsonStr = response.text || "{}";
    
    // Robustness: Clean up any markdown formatting that might accidentally be included
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", jsonStr);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Safety: Ensure all array fields are arrays
    const safeResponse: AiMediaResponse = {
      title: parsed.title || "Unknown Title",
      type: parsed.type || "Movie",
      seriesTitle: parsed.seriesTitle,
      seasonNumber: parsed.seasonNumber,
      episodeNumber: parsed.episodeNumber,
      originalTitle: parsed.originalTitle || "",
      year: parsed.year || "",
      plot: parsed.plot || "",
      posterUrl: parsed.posterUrl || "",
      rating: parsed.rating || "",
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      cast: Array.isArray(parsed.cast) ? parsed.cast : [],
      watchServers: Array.isArray(parsed.watchServers) ? parsed.watchServers : [],
      downloadLinks: Array.isArray(parsed.downloadLinks) ? parsed.downloadLinks : [],
      episodes: Array.isArray(parsed.episodes) ? parsed.episodes : [],
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
    };

    return safeResponse;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
