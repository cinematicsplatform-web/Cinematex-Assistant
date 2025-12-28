
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatTime = () => {
  return new Date().toLocaleTimeString('ar-EG', { hour12: false });
};

// قائمة محدثة من البروكسيات المجانية لتجاوز قيود CORS والحظر
const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?url=',
  'https://proxy.cors.sh/', 
];

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Concurrency helper to process an array of items with a limited number of parallel workers.
 */
export async function concurrentMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const runWorker = async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, runWorker);
  await Promise.all(workers);
  return results;
}

/**
 * جلب محتوى HTML مع تدوير البروكسيات وإدارة محاولات الإعادة بشكل ذكي
 */
export async function fetchHtmlWithProxy(url: string, retryCount = 0): Promise<string> {
  const proxy = PROXIES[retryCount % PROXIES.length];
  
  // تنظيف الرابط من أي مسافات زائدة
  const cleanUrl = url.trim();
  const proxyUrl = `${proxy}${encodeURIComponent(cleanUrl)}`;
  
  try {
    // إضافة تأخير تصاعدي عند إعادة المحاولة لتجنب الـ Rate Limiting
    if (retryCount > 0) {
      await sleep(retryCount * 500); // Reduced from 1000 for speed
    }

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        if (retryCount < PROXIES.length * 2) {
          console.warn(`Proxy ${proxy} blocked with ${response.status}. Trying next...`);
          return fetchHtmlWithProxy(cleanUrl, retryCount + 1);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 200 || html.includes('Cloudflare') || html.includes('Access Denied')) {
      if (retryCount < PROXIES.length * 2) {
         return fetchHtmlWithProxy(cleanUrl, retryCount + 1);
      }
    }
    
    return html;
  } catch (err: any) {
    if (retryCount < PROXIES.length * 2) {
      console.error(`Attempt ${retryCount + 1} failed for ${cleanUrl}. Error: ${err.message}`);
      return fetchHtmlWithProxy(cleanUrl, retryCount + 1);
    }
    throw new Error(`فشل جلب الرابط بعد عدة محاولات بروكسي (403 Forbidden). الموقع قد يكون محمياً جداً ضد المستخرج الآلي.`);
  }
}
