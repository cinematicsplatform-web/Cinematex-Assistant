
import { MediaData, CloneResult } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

/**
 * تهيئة النص لتجميع المسلسلات (إزالة أرقام الحلقات والمواسم)
 */
const normalizeForGrouping = (text: string): string => {
  if (!text) return "";
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/(?:season|موسم|s)\s*\d+/g, '');
  normalized = normalized.replace(/(?:episode|ep|حلقة|e)\s*\d+/g, '');
  normalized = normalized.replace(/[أإآ]/g, 'ا');
  normalized = normalized.replace(/[ى]/g, 'ي');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/[^\w\u0600-\u06FF]/g, ' ');
  return normalized.replace(/\s+/g, ' ').trim();
};

const getCleanSheetName = (title: string): string => {
  let clean = title.replace(/(?:season|موسم|s)\s*\d+.*$/i, '');
  clean = clean.replace(/(?:episode|ep|حلقة|e)\s*\d+.*$/i, '');
  clean = clean.replace(/[:\/\\?*\[\]]/g, ""); 
  return clean.trim().substring(0, 30) || "Series"; 
};

/**
 * توليد ملف Excel بالهيكل المحدد:
 * المسلسلات: الموسم (A)، الحلقة (B)، مشاهدة 1-8 (C-J)، تحميل 1-8 (K-R)
 * الأفلام: العنوان (A)، مشاهدة 1-8 (B-I)، تحميل 1-8 (J-Q)
 */
export const generateExcelFile = (data: MediaData[]) => {
  if (!window.XLSX) {
    console.error("XLSX library not loaded");
    return;
  }

  const wb = window.XLSX.utils.book_new();
  const movies = data.filter(d => d.type === 'Movie');
  const series = data.filter(d => d.type === 'Series');

  // 1. شيت الأفلام
  if (movies.length > 0) {
    const movieRows = movies.map(m => {
      const row: any = { 'اسم الفيلم': m.title };
      const servers = m.servers || [];
      const downloadLinks = m.downloadLinks || [];
      
      // سيرفرات المشاهدة (8 أعمدة من B إلى I)
      for (let i = 0; i < 8; i++) {
        row[`سيرفر مشاهدة ${i + 1}`] = servers[i]?.url || "";
      }
      // روابط التحميل (من J فصاعداً)
      for (let i = 0; i < 8; i++) {
        row[`سيرفر تحميل ${i + 1}`] = downloadLinks[i]?.url || "";
      }
      return row;
    });

    const wsMovies = window.XLSX.utils.json_to_sheet(movieRows);
    wsMovies['!cols'] = [{ wch: 30 }, ...Array(16).fill({ wch: 25 })];
    window.XLSX.utils.book_append_sheet(wb, wsMovies, "Movies");
  }

  // 2. شيتات المسلسلات (شيت لكل مسلسل)
  const seriesGroups: Record<string, { items: MediaData[], displayTitle: string }> = {};
  series.forEach(item => {
    const groupKey = item.seriesTitle ? normalizeForGrouping(item.seriesTitle) : normalizeForGrouping(item.title);
    const displayTitle = getCleanSheetName(item.seriesTitle || item.title);
    if (!seriesGroups[groupKey]) {
      seriesGroups[groupKey] = { items: [], displayTitle: displayTitle };
    }
    seriesGroups[groupKey].items.push(item);
  });

  Object.values(seriesGroups).forEach(group => {
    const { items, displayTitle } = group;
    
    // ترتيب الحلقات
    const sortedItems = [...items].sort((a, b) => {
      if ((a.season || 1) !== (b.season || 1)) return (a.season || 1) - (b.season || 1);
      return (a.episode || 1) - (b.episode || 1);
    });

    const excelRows = sortedItems.map(item => {
      const row: any = { 
        'الموسم': item.season || 1, 
        'الحلقة': item.episode || 1 
      };
      const servers = item.servers || [];
      const downloadLinks = item.downloadLinks || [];

      // سيرفرات المشاهدة (من C إلى J)
      for (let i = 0; i < 8; i++) {
        row[`سيرفر مشاهدة ${i + 1}`] = servers[i]?.url || "";
      }
      // سيرفرات التحميل (8 سيرفرات للمسلسلات - من K إلى R)
      for (let i = 0; i < 8; i++) {
        row[`سيرفر تحميل ${i + 1}`] = downloadLinks[i]?.url || "";
      }
      return row;
    });

    const wsSeries = window.XLSX.utils.json_to_sheet(excelRows);
    wsSeries['!cols'] = [{ wch: 10 }, { wch: 10 }, ...Array(16).fill({ wch: 25 })];
    
    let finalSheetName = displayTitle || "Series";
    let counter = 1;
    let uniqueName = finalSheetName;
    while (wb.Sheets[uniqueName]) {
      uniqueName = `${finalSheetName.substring(0, 25)}_${counter++}`;
    }
    window.XLSX.utils.book_append_sheet(wb, wsSeries, uniqueName);
  });

  window.XLSX.writeFile(wb, `Cinematex_Bulk_Export_${Date.now()}.xlsx`);
};

/**
 * توليد ملف Excel لنتائج الناسخ الجماعي
 */
export const generateClonerExcel = (results: CloneResult[]) => {
  if (!window.XLSX) return;
  const wb = window.XLSX.utils.book_new();
  const rows = results.map((r, idx) => ({
    '#': idx + 1,
    'الرابط الأصلي': r.originalUrl,
    'الحالة': r.status,
    'كود الملف': r.newCode || '',
    'رابط المشاهدة': r.watchUrl || '',
    'رابط التحميل': r.downloadUrl || '',
    'ملاحظات': r.message || ''
  }));
  const ws = window.XLSX.utils.json_to_sheet(rows);
  window.XLSX.utils.book_append_sheet(wb, ws, "Cloner Results");
  window.XLSX.writeFile(wb, `Uqload_Clone_Results_${Date.now()}.xlsx`);
};

/**
 * توليد ملف Excel لسجل التحميلات
 */
export const generateHistoryExcel = (history: any[]) => {
  if (!window.XLSX) return;
  const wb = window.XLSX.utils.book_new();
  const rows = history.map((h, idx) => ({
    '#': idx + 1,
    'اسم الملف': h.name,
    'رابط المشاهدة': h.url,
    'رابط التحميل': h.downloadUrl,
    'التاريخ': h.date
  }));
  const ws = window.XLSX.utils.json_to_sheet(rows);
  window.XLSX.utils.book_append_sheet(wb, ws, "History");
  window.XLSX.writeFile(wb, `Uqload_History_Export_${Date.now()}.xlsx`);
};
