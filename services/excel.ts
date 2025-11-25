import { MediaData } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

export const generateExcelFile = (data: MediaData[]) => {
  if (!window.XLSX) {
    console.error("XLSX library not loaded");
    return;
  }

  const wb = window.XLSX.utils.book_new();

  // Split data into Movies and Series
  const movies = data.filter(d => d.type === 'Movie');
  const series = data.filter(d => d.type === 'Series');

  // --- Prepare Movies Sheet ---
  if (movies.length > 0) {
    const movieRows = movies.map(m => {
      const row: any = { 'اسم الفيلم': m.title };
      
      // Dynamic Server Columns
      m.servers.forEach((s, i) => {
        row[`سيرفر مشاهدة ${i + 1}`] = s.url;
      });

      // Join Download Links
      row['روابط التحميل'] = m.downloadLinks.map(d => d.url).join(' | ');
      
      return row;
    });

    const wsMovies = window.XLSX.utils.json_to_sheet(movieRows);
    
    // Adjust column widths (Basic heuristic)
    const wscols = [{ wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 50 }];
    wsMovies['!cols'] = wscols;

    window.XLSX.utils.book_append_sheet(wb, wsMovies, "Movies");
  }

  // --- Prepare Series Sheets ---
  // Group by Series Name (approximated by title sans episode)
  // For simplicity in this demo, we put all episodes in one "Series" sheet
  // or create separate sheets if names differ significantly.
  // The prompt asks for: Each series in a separate Sheet.
  
  // 1. Group by sanitized title (removing episode part)
  const seriesGroups: Record<string, MediaData[]> = {};
  
  series.forEach(s => {
    // Simple logic to group by the main title part
    const groupName = s.title.split(/(الحلقة|Episode)/)[0].trim();
    if (!seriesGroups[groupName]) {
      seriesGroups[groupName] = [];
    }
    seriesGroups[groupName].push(s);
  });

  Object.entries(seriesGroups).forEach(([seriesName, episodes]) => {
    // Sanitize sheet name (Excel limit 31 chars, no special chars)
    let sheetName = seriesName.substring(0, 30).replace(/[:\/\\?*\[\]]/g, "");
    if (!sheetName) sheetName = "Unknown Series";

    const rows = episodes.map(ep => {
      const row: any = { 
        'رقم/اسم الحلقة': ep.episodeName || ep.title 
      };

      ep.servers.forEach((s, i) => {
        row[`سيرفر مشاهدة ${i + 1}`] = s.url;
      });

      row['روابط التحميل'] = ep.downloadLinks.map(d => d.url).join(' | ');
      return row;
    });

    const wsSeries = window.XLSX.utils.json_to_sheet(rows);
    window.XLSX.utils.book_append_sheet(wb, wsSeries, sheetName);
  });

  // Write File
  window.XLSX.writeFile(wb, "Cinematex_Export.xlsx");
};
