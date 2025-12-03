
import { MediaData, CloneResult } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

/**
 * Normalizes text for grouping purposes (Backup if AI seriesTitle is missing).
 * Handles Arabic character variations (Alif, Yeh, Teh Marbuta) and removes 
 * Season/Episode specific text to identify the base Series Name.
 */
const normalizeForGrouping = (text: string): string => {
  if (!text) return "";
  
  // 1. Lowercase
  let normalized = text.toLowerCase();
  
  // 2. Remove Season/Episode patterns (Arabic & English) to extract base title
  // Matches: S01, E01, Season 1, Episode 1, موسم 1, الحلقة 1
  normalized = normalized.replace(/(?:season|موسم|s)\s*\d+/g, '');
  normalized = normalized.replace(/(?:episode|ep|حلقة|e)\s*\d+/g, '');
  
  // 3. Normalize Arabic Characters
  normalized = normalized.replace(/[أإآ]/g, 'ا'); // Normalize Alifs
  normalized = normalized.replace(/[ى]/g, 'ي');   // Normalize Yeh
  normalized = normalized.replace(/ة/g, 'ه');     // Normalize Teh Marbuta
  
  // 4. Remove special chars, punctuation, keep Arabic & English letters & numbers
  normalized = normalized.replace(/[^\w\u0600-\u06FF]/g, ' ');
  
  // 5. Collapse multiple spaces
  return normalized.replace(/\s+/g, ' ').trim();
};

/**
 * Parses episode info from text if AI data is missing
 */
const parseEpisodeInfoFallback = (title: string, episodeName?: string) => {
  const fullText = `${title} ${episodeName || ''}`.toLowerCase();
  
  const seasonMatch = fullText.match(/(?:season|موسم|s)\s*(\d+)/i);
  const season = seasonMatch ? parseInt(seasonMatch[1]) : 1; 

  const episodeMatch = fullText.match(/(?:episode|ep|حلقة|e)\s*(\d+)/i);
  const fallbackMatch = fullText.match(/\s(\d+)$/);
  
  const episode = episodeMatch ? parseInt(episodeMatch[1]) : (fallbackMatch ? parseInt(fallbackMatch[1]) : 1);

  return { season, episode };
};

/**
 * Cleans the Series Title for the Sheet Name (Human readable)
 */
const getCleanSheetName = (title: string): string => {
  let clean = title.replace(/(?:season|موسم|s)\s*\d+.*$/i, '');
  clean = clean.replace(/(?:episode|ep|حلقة|e)\s*\d+.*$/i, '');
  clean = clean.replace(/[:\/\\?*\[\]]/g, ""); 
  return clean.trim().substring(0, 30) || "Series"; 
};

export const generateExcelFile = (data: MediaData[]) => {
  if (!window.XLSX) {
    console.error("XLSX library not loaded");
    alert("مكتبة XLSX غير محملة. تأكد من الاتصال بالإنترنت.");
    return;
  }

  const wb = window.XLSX.utils.book_new();
  const movies = data.filter(d => d.type === 'Movie');
  const series = data.filter(d => d.type === 'Series');

  // ==========================================
  // 1. MOVIES SHEET
  // ==========================================
  if (movies.length > 0) {
    const movieRows = movies.map(m => {
      const row: any = { 
        'اسم الفيلم': m.title 
      };
      
      // Fixed 8 Server Columns
      for (let i = 0; i < 8; i++) {
        row[`سيرفر ${i + 1}`] = m.servers[i]?.url || "";
      }

      // Fixed 2 Download Columns
      for (let i = 0; i < 2; i++) {
        row[`تحميل ${i + 1}`] = m.downloadLinks[i]?.url || "";
      }
      
      return row;
    });

    const wsMovies = window.XLSX.utils.json_to_sheet(movieRows);
    const wscols = [{ wch: 30 }, ...Array(8).fill({ wch: 15 }), { wch: 30 }, { wch: 30 }];
    wsMovies['!cols'] = wscols;

    window.XLSX.utils.book_append_sheet(wb, wsMovies, "Movies");
  }

  // ==========================================
  // 2. SERIES SHEETS (AI-Assisted Grouping)
  // ==========================================
  
  // Group series
  const seriesGroups: Record<string, { items: MediaData[], displayTitle: string }> = {};

  series.forEach(item => {
    // Priority: Use AI-extracted seriesTitle. Fallback to normalized title.
    // Also normalize the AI title slightly (trim) to be safe.
    let groupKey = "";
    let displayTitle = "";

    if (item.seriesTitle) {
      // AI provided a specific series title. We still run it through normalization
      // to ensure 'Osman' and 'Osman ' match, or simple Alef diffs if AI slipped up.
      groupKey = normalizeForGrouping(item.seriesTitle);
      displayTitle = getCleanSheetName(item.seriesTitle);
    } else {
      // Fallback: Regex grouping
      groupKey = normalizeForGrouping(item.title);
      displayTitle = getCleanSheetName(item.title);
    }
    
    if (!seriesGroups[groupKey]) {
      seriesGroups[groupKey] = {
        items: [],
        displayTitle: displayTitle
      };
    }
    seriesGroups[groupKey].items.push(item);
  });

  // Create a sheet for each group
  Object.values(seriesGroups).forEach(group => {
    const { items, displayTitle } = group;

    // Prepare rows
    let processedRows = items.map(item => {
      // Priority: Use AI-extracted numbers. Fallback to Regex.
      let season = item.season;
      let episode = item.episode;

      if (season === undefined || episode === undefined) {
         const parsed = parseEpisodeInfoFallback(item.title, item.episodeName);
         if (season === undefined) season = parsed.season;
         if (episode === undefined) episode = parsed.episode;
      }

      return {
        original: item,
        season: season || 1, // Default to 1 if still null
        episode: episode || 1
      };
    });

    // Sort by Season ASC, then Episode ASC
    processedRows.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.episode - b.episode;
    });

    // Map to Excel Row Format
    const excelRows = processedRows.map(p => {
      const row: any = {
        'الموسم': p.season,
        'الحلقة': p.episode
      };

      for (let i = 0; i < 8; i++) {
        row[`سيرفر ${i + 1}`] = p.original.servers[i]?.url || "";
      }

      for (let i = 0; i < 2; i++) {
        row[`تحميل ${i + 1}`] = p.original.downloadLinks[i]?.url || "";
      }

      return row;
    });

    const wsSeries = window.XLSX.utils.json_to_sheet(excelRows);
    wsSeries['!cols'] = [{ wch: 8 }, { wch: 8 }, ...Array(8).fill({ wch: 15 }), { wch: 30 }, { wch: 30 }];

    // Handle Sheet Name Uniqueness
    let sheetName = displayTitle;
    let counter = 1;
    // Basic sanitization for sheet name length and chars
    sheetName = sheetName.replace(/[:\/\\?*\[\]]/g, "").trim().substring(0, 30);
    if (!sheetName) sheetName = "Series";

    // Ensure unique sheet name in workbook
    let finalSheetName = sheetName;
    while (wb.Sheets[finalSheetName]) {
      // If collision, truncate more to make room for counter
      finalSheetName = `${sheetName.substring(0, 25)}_${counter}`;
      counter++;
    }

    window.XLSX.utils.book_append_sheet(wb, wsSeries, finalSheetName);
  });

  window.XLSX.writeFile(wb, "Cinematex_Export.xlsx");
};

/**
 * Generates Excel for Mass Link Cloner results
 * Strict Format Requirements:
 * 1. Headers: url, downloadUrl, quality, original_source (Lower case, exact)
 * 2. Row Order: Must match input order strictly (Row 1 = Ep 1). Do not filter failed items.
 */
export const generateClonerExcel = (results: CloneResult[]) => {
  if (!window.XLSX) {
    console.error("XLSX library not loaded");
    alert("مكتبة XLSX غير محملة. تأكد من الاتصال بالإنترنت.");
    return;
  }

  const wb = window.XLSX.utils.book_new();

  // We map ALL results to ensure the row index matches the episode index.
  // If a link failed, the new URLs will be empty, but the row will exist.
  const rows = results.map(r => ({
    url: r.watchUrl || "",
    downloadUrl: r.downloadUrl || "",
    quality: "HD",
    original_source: r.originalUrl || ""
  }));

  const ws = window.XLSX.utils.json_to_sheet(rows);
  
  // Adjust column widths
  const wscols = [
    { wch: 50 }, // url
    { wch: 50 }, // downloadUrl
    { wch: 10 }, // quality
    { wch: 50 }  // original_source
  ];
  ws['!cols'] = wscols;

  window.XLSX.utils.book_append_sheet(wb, ws, "ClonedLinks");
  window.XLSX.writeFile(wb, `Uqload_Clone_${new Date().getTime()}.xlsx`);
};

/**
 * Generates Excel for Last 30 Uploads History
 * Columns: A=url, B=downloadUrl, C=name
 */
export const generateHistoryExcel = (data: {url: string, downloadUrl: string, name: string}[]) => {
  if (!window.XLSX) {
    console.error("XLSX library not loaded");
    alert("مكتبة XLSX غير محملة.");
    return;
  }

  const wb = window.XLSX.utils.book_new();

  // Create sheet with specific headers to ensure order A, B, C
  const ws = window.XLSX.utils.json_to_sheet(data, { 
    header: ["url", "downloadUrl", "name"], 
    skipHeader: false 
  });

  // Adjust column widths
  ws['!cols'] = [
    { wch: 50 }, // url
    { wch: 50 }, // downloadUrl
    { wch: 40 }  // name
  ];

  window.XLSX.utils.book_append_sheet(wb, ws, "Last30Uploads");
  window.XLSX.writeFile(wb, "Cinematics_Recent_Uploads.xlsx");
};
