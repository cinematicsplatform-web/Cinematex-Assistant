
import { ServerInfo, ScriptExtractionResult } from '../types';

/**
 * مستخرج يعتمد على السكريبت فقط (Zero AI Cost).
 * تم تحديثه لضمان التتابع التلقائي وصياغة العناوين بالنمط الاحترافي المطلوب.
 */
export function extractWithScript(html: string, currentUrl?: string): ScriptExtractionResult {
  const servers: ServerInfo[] = [];
  const downloads: ServerInfo[] = [];
  const allEpisodes: { number: number; url: string }[] = [];
  
  // 1. استخراج العنوان الخام
  let rawTitle = "عنوان غير معروف";
  const titlePatterns = [
    /<h1[^>]*>\s*(.*?)\s*<\/h1>/i,
    /<title>(.*?)<\/title>/i,
    /property="og:title"\s+content="(.*?)"/i,
    /itemprop="name">\s*(.*?)\s*<\/i/
  ];

  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      rawTitle = match[1].replace(/مشاهدة|تحميل|مترجم|اون لاين|اونلاين|-|وي سيما|ماي سيما/gi, '').trim();
      break;
    }
  }

  // 2. كشف رقم الحلقة والموسم بدقة
  let episodeNumber: number | undefined = undefined;
  let seasonNumber: number | undefined = undefined;
  
  // محاولة الاستخراج من العنوان
  const epMatchTitle = rawTitle.match(/(?:الحلقة|Episode|Ep|E|EP#|الحلقه|الحلقة#)\s*(\d+)/i);
  if (epMatchTitle) episodeNumber = parseInt(epMatchTitle[1]);
  
  // محاولة الاستخراج من الرابط إذا فشل العنوان (مهم جداً للتتابع)
  if (!episodeNumber && currentUrl) {
    const epMatchUrl = currentUrl.match(/(?:episode|ep|e|حلقة|حلقه|EP#|episode-)\s*(\d+)/i) || 
                       currentUrl.match(/-(\d+)(?:\/|$)/); // نمط أرقام الحلقات في نهاية الرابط
    if (epMatchUrl) episodeNumber = parseInt(epMatchUrl[1]);
  }

  const sMatch = rawTitle.match(/(?:الموسم|Season|S)\s*(\d+)/i);
  if (sMatch) seasonNumber = parseInt(sMatch[1]);

  // 3. صياغة العنوان المطلوب: "Series Season X Episode Y: Content"
  // استخلاص اسم المسلسل الأساسي (ما قبل أي علامات أو أرقام حلقات)
  const baseSeriesTitle = rawTitle
    .replace(/(?:الحلقة|Episode|Ep|E|EP#|الحلقه|الحلقة#)\s*\d+/gi, '')
    .replace(/(?:الموسم|Season|S)\s*\d+/gi, '')
    .split(/[:|-]/)[0] // نأخذ الجزء الأول فقط قبل الفواصل
    .replace(/\s+/g, ' ')
    .trim();

  // استخلاص المحتوى الإضافي (مثل "4 lines of reply")
  let contentPart = "";
  if (rawTitle.includes(':')) {
    contentPart = rawTitle.split(':').pop()?.trim() || "";
  } else if (rawTitle.includes('-')) {
    const parts = rawTitle.split('-');
    if (parts.length > 1) contentPart = parts.pop()?.trim() || "";
  }

  // تجنب تكرار اسم المسلسل في المحتوى
  if (contentPart === baseSeriesTitle || contentPart.length < 3) {
    contentPart = "";
  }

  const formattedTitle = `${baseSeriesTitle} Season ${seasonNumber || 1} Episode ${episodeNumber || 1}${contentPart ? ': ' + contentPart : ''}`;

  // 4. كشف رابط الفيديو المباشر الخام (MP4/M3U8)
  let activeVideoUrl: string | undefined = undefined;
  const videoSrcPatterns = [
    /["']?file["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|mpd)(?:\?[^"']*)?)["']/i,
    /["']?url["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|mpd)(?:\?[^"']*)?)["']/i,
    /src\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|mpd)(?:\?[^"']*)?)["']/i,
    /<source[^>]*src=["'](https?:\/\/[^"']+\.(?:mp4|m3u8|mpd)(?:\?[^"']*)?)["']/i
  ];

  for (const pattern of videoSrcPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      activeVideoUrl = match[1];
      if (servers.length === 0) {
        servers.push({ name: "سيرفر المشاهدة المباشر (Direct Video)", url: activeVideoUrl });
      }
      break;
    }
  }

  // 5. استخراج شبكة أزرار الحلقات (EP#1, EP#2...) لضمان التتابع
  const epButtonRegex = /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(?:[\s\S]*?(?:EP#|الحلقة|الحلقه|Episode|Ep|E|الحلقة#)\s*(\d+)[\s\S]*?)<\/a>/gi;
  let buttonMatch;
  while ((buttonMatch = epButtonRegex.exec(html)) !== null) {
    const url = buttonMatch[1];
    const num = parseInt(buttonMatch[2]);
    if (!allEpisodes.find(e => e.number === num)) {
      allEpisodes.push({ number: num, url });
    }
  }

  // 6. استخراج سيرفرات المشاهدة البديلة
  const serverDataRegex = /(?:data-watch|data-url|data-link|data-src|data-video)=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/(?:li|button|a)>/gi;
  let serverDataMatch;
  while ((serverDataMatch = serverDataRegex.exec(html)) !== null) {
    const url = serverDataMatch[1];
    if (/\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(url)) continue;
    const name = serverDataMatch[2].replace(/<[^>]*>/g, '').trim() || getHostName(url, currentUrl);
    if (servers.length === 0 && !servers.find(s => s.url === url)) {
      servers.push({ name: `سيرفر المشاهدة: ${name}`, url });
    }
  }

  // 7. استخراج روابط التحميل
  const anchorRegex = /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let anchorMatch;
  let mainDownloadButtonUrl: string | undefined = undefined;
  
  while ((anchorMatch = anchorRegex.exec(html)) !== null) {
    const url = anchorMatch[1];
    const text = anchorMatch[2].toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) continue;

    if (text.includes('تحميل الحلقة') || text.includes('download episode') || (text.includes('تحميل') && anchorMatch[0].includes('btn-danger'))) {
      if (!mainDownloadButtonUrl) {
        mainDownloadButtonUrl = url;
        if (!downloads.find(d => d.url === url)) {
          downloads.push({ name: "رابط التحميل المباشر (الزر الأحمر)", url });
        }
      }
    }

    const isDownload = isDownloadHost(url) || text.includes('download') || text.includes('تحميل') || text.includes('direct') || text.includes('مباشر');
    if (isDownload && !downloads.find(d => d.url === url)) {
      downloads.push({ name: `رابط تحميل: ${getHostName(url, currentUrl)}`, url });
    }
  }

  // 8. الرابط التالي الصريح (زر التالي)
  let nextUrl: string | undefined = undefined;
  const nextPatterns = [
    /href=["'](https?:\/\/[^"']+)["'][^>]*>(?:الحلقة التالية|Next Episode|التالية)<\/a>/i,
    /class=["']next["'][^>]*href=["'](https?:\/\/[^"']+)["']/i
  ];
  for (const pattern of nextPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      nextUrl = match[1];
      break;
    }
  }

  return {
    title: formattedTitle,
    servers: servers.slice(0, 1),
    downloadLinks: downloads.slice(0, 30),
    nextUrl,
    episodeNumber,
    seasonNumber,
    activeVideoUrl,
    mainDownloadButtonUrl,
    allEpisodes: allEpisodes.sort((a, b) => a.number - b.number)
  };
}

function isDownloadHost(url: string): boolean {
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) return false;
  const hosts = ['mega.nz', 'mediafire', '1fichier', 'uptobox', 'tahmil', 'download', 'gdrive', 'drive.google'];
  const urlLower = url.toLowerCase();
  return hosts.some(h => urlLower.includes(h));
}

function getHostName(url: string, baseUrl?: string): string {
  try {
    const domain = new URL(url.startsWith('http') ? url : (baseUrl ? new URL(url, baseUrl).href : url)).hostname;
    return domain.replace('www.', '').split('.')[0].toUpperCase();
  } catch { return "سيرفر"; }
}
