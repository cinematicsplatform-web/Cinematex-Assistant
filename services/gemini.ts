
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiMediaResponse } from "../types";

// Schema definition for the Gemini response
const mediaResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The main title of the movie or series in Arabic or the page language." },
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

  // System instruction to guide the model's behavior with AGGRESSIVE IMAGE ANALYSIS
  const systemInstruction = `
    You are an expert web scraper and HTML parser specialized in video streaming websites.
    Your task is to analyze the provided raw HTML source code and extract structured metadata.

    ### 1. IMAGE EXTRACTION (AGGRESSIVE MODE)
    Your goal is to extract **EVERY SINGLE** image related to the media content found in the code.
    Populate the 'gallery' array with ALL of them.

    **Where to look:**
    1.  **Standard Tags**: \`<img src="..." ...>\`
    2.  **Lazy Loading (Critical)**: Look for attributes like \`data-src\`, \`data-original\`, \`data-lazy-src\`, \`data-bg\`, \`data-image\`. If found, these are the REAL images.
    3.  **CSS Backgrounds**: Look for \`style="background-image: url('...')" \` on divs or spans.
    4.  **Scripts & JSON**: deeply analyze \`<script>\` tags. Websites often store galleries, slider images, and cast photos in JSON objects (e.g., \`"images": ["url1", "url2"]\`). Extract these URLs.
    5.  **Meta Tags**: \`og:image\`, \`twitter:image\`, \`schema.org\` image fields.

    **What to collect (Contexts):**
    -   **Main Poster**: The primary cover.
    -   **Backdrops/Wallpapers**: Large background images.
    -   **Episode Thumbnails**: Images for specific episodes.
    -   **Cast Photos**: Actor portraits.
    -   **Screenshots**: Stills from the movie/series.
    -   **Related/Similar**: Thumbnails of other movies suggested in the "You might like" section.

    **What to Ignore:**
    -   Navigational icons (home, search, user, arrow icons).
    -   Social media logos (FB, Twitter, etc.).
    -   Ad banners or tracking pixels.
    -   Empty or placeholder images (e.g., 'blank.gif').

    ### 2. SERVER & VIDEO SYSTEM
    - **Watch Servers**: Exhaustively search \`<iframe>\`, \`<button>\` data-attributes, and JavaScript variables (e.g., \`player_url\`).
    - **Download Links**: Look for \`<a>\` tags with text "Download", "Tahmil", "تحميل".
    - **Clean URLs**: Remove whitespace. If URL is relative (starts with /), keep it as is.

    ### 3. GENERAL METADATA
    - Detect Type (Movie/Series) based on keywords "Season", "Episode", "الحلقة", "موسم".
    - Clean text content (remove "Watch Online", "EgyBest" from titles).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: "Analyze this HTML code using the Aggressive Image Extraction rules and extract metadata:" },
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

    // Safety: Ensure all array fields are arrays to prevent "undefined reading length" errors
    const safeResponse: AiMediaResponse = {
      title: parsed.title || "Unknown Title",
      type: parsed.type || "Movie",
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
