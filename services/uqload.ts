

import { CloneResult } from '../types';
import { getSettings } from './settings';

const API_DOMAIN = 'https://uqload.com'; // Domain for API commands (More stable)
const VIEW_DOMAIN = 'https://uqload.cx';  // Domain for viewing/embedding
const UPLOAD_URL = `${API_DOMAIN}/api/upload/url`;
const LIST_URL = `${API_DOMAIN}/api/file/list`;
const RENAME_URL = `${API_DOMAIN}/api/file/rename`;
const CORS_PROXY = 'https://corsproxy.io/?';
const HISTORY_KEY = 'cinematex_uqload_history'; // Key for localStorage

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Branding & Renaming Helpers ---

const cleanAndBrandName = (originalName: string) => {
  if (!originalName) return originalName;

  const settings = getSettings();
  let name = originalName;

  // 1. Remove brackets and content like [EgyBest]
  name = name.replace(/\[.*?\]/g, '');

  // 2. Remove competitor names (Dynamic from Settings)
  const competitors = settings.ignoredKeywords;
  
  competitors.forEach(comp => {
    if (!comp) return;
    // Escape dots for regex to avoid wildcard matching
    let pattern = comp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    // Replace logic handles variations
    name = name.replace(new RegExp(pattern, 'gi'), '');
  });

  // 3. Trim symbols at start/end
  name = name.replace(/^[\s._-]+|[\s._-]+$/g, '');

  // 4. Add Brand Prefix (Dynamic from Settings)
  const prefix = settings.filenamePrefix;
  if (prefix && !name.toLowerCase().startsWith(prefix.toLowerCase())) {
    name = `${prefix}${name}`;
  }

  return name;
};

const renameUqloadFile = async (fileCode: string, currentName: string): Promise<string> => {
  const settings = getSettings();
  const newName = cleanAndBrandName(currentName);
  
  // If name is already clean, skip API call
  if (newName === currentName) return currentName;

  try {
    console.log(`🏷️ Renaming: ${currentName} -> ${newName}`);
    const targetUrl = `${RENAME_URL}?key=${settings.uqloadApiKey}&file_code=${fileCode}&name=${encodeURIComponent(newName)}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    
    await fetch(proxyUrl);
    
    // Return the new name for UI updates
    return newName;
  } catch (error: any) {
    console.warn(`Rename Warning for ${fileCode}:`, error.message);
    // Return old name if rename fails so the flow doesn't break
    return currentName;
  }
};

// --- Local History Helpers ---

const saveToLocalHistory = (entry: { name: string; url: string; downloadUrl: string; date: string }) => {
  try {
    const existing = localStorage.getItem(HISTORY_KEY);
    let history = existing ? JSON.parse(existing) : [];
    history.unshift(entry);
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save local history', error);
  }
};

export const fetchAccountHistory = async () => {
  try {
    const existing = localStorage.getItem(HISTORY_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error: any) {
    console.error('Error reading local history:', error);
    return [];
  }
};

export const cloneUqloadLink = async (url: string): Promise<Omit<CloneResult, 'id'>> => {
  const settings = getSettings();
  
  if (!settings.uqloadApiKey) {
     return {
      originalUrl: url,
      status: 'failed',
      message: 'مفتاح API غير موجود'
    };
  }

  if (!url || !url.includes('uqload')) {
    return {
      originalUrl: url,
      status: 'skipped',
      message: 'ليس رابط Uqload'
    };
  }

  try {
    console.log(`🚀 Start Cloning: ${url}`);

    // 1. Send Copy/Upload Command
    const targetUploadUrl = `${UPLOAD_URL}?key=${settings.uqloadApiKey}&url=${encodeURIComponent(url)}`;
    const proxyUploadUrl = `${CORS_PROXY}${encodeURIComponent(targetUploadUrl)}`;
    
    const uploadRes = await fetch(proxyUploadUrl);
    const uploadData = await uploadRes.json();

    console.log('[Uqload Upload Response]', uploadData);

    let finalCode: string | null = null;
    
    if (uploadData.status === 200 && uploadData.result) {
       finalCode = uploadData.result.filecode || uploadData.result.file_code;
    }

    // 2. Fast Track: Code found immediately
    if (finalCode) {
      console.log(`⚡ Fast Track: Code found (${finalCode}). Attempting rename...`);
      
      let finalName = `File ${finalCode}`;
      
      // Try to fetch metadata to perform renaming
      try {
        const targetListUrl = `${LIST_URL}?key=${settings.uqloadApiKey}&page=1`;
        const proxyListUrl = `${CORS_PROXY}${encodeURIComponent(targetListUrl)}`;
        const listRes = await fetch(proxyListUrl);
        const listData = await listRes.json();
        
        const file = listData.result?.files?.find((f: any) => f.file_code === finalCode);
        if (file) {
          finalName = await renameUqloadFile(finalCode, file.name);
        }
      } catch (e) {
        console.warn("Could not rename in fast track (Metadata fetch failed)", e);
      }

      const watchUrl = `${VIEW_DOMAIN}/embed-${finalCode}.html`;
      const downloadUrl = `${VIEW_DOMAIN}/${finalCode}.html`;

      saveToLocalHistory({
        name: finalName,
        url: watchUrl,
        downloadUrl: downloadUrl,
        date: new Date().toISOString()
      });

      return {
        originalUrl: url,
        status: 'success',
        newCode: finalCode,
        watchUrl: watchUrl,
        downloadUrl: downloadUrl,
        message: 'تم النسخ (Fast Track)'
      };
    }

    // 3. Slow Track: Polling
    console.log('🐢 Slow Track: Code not in response, polling file list...');
    await wait(10000); // Initial wait

    let attempts = 0;
    const maxAttempts = 3;
    let foundResult: Omit<CloneResult, 'id'> | null = null;

    while (attempts < maxAttempts && !foundResult) {
        attempts++;
        try {
            const targetListUrl = `${LIST_URL}?key=${settings.uqloadApiKey}&page=1&_=${Date.now()}`;
            const proxyListUrl = `${CORS_PROXY}${encodeURIComponent(targetListUrl)}`;

            const listRes = await fetch(proxyListUrl);
            const listData = await listRes.json();
            
            if (listData.status === 200 && listData.result && listData.result.files && listData.result.files.length > 0) {
                // The newest file is usually at index 0
                const latestFile = listData.result.files[0];
                const realCode = latestFile.file_code;

                // RENAME STEP: Crucial here
                const finalName = await renameUqloadFile(realCode, latestFile.name);

                const watchUrl = `${VIEW_DOMAIN}/embed-${realCode}.html`;
                const downloadUrl = `${VIEW_DOMAIN}/${realCode}.html`;

                saveToLocalHistory({
                    name: finalName,
                    url: watchUrl,
                    downloadUrl: downloadUrl,
                    date: new Date().toISOString()
                });

                foundResult = {
                    originalUrl: url,
                    status: 'success',
                    newCode: realCode,
                    watchUrl: watchUrl,
                    downloadUrl: downloadUrl,
                    message: 'تم النسخ وإعادة التسمية'
                };
            }
        } catch (e) {
            console.warn(`Attempt ${attempts} failed/retrying...`, e);
        }

        if (!foundResult && attempts < maxAttempts) {
            await wait(5000);
        }
    }

    if (foundResult) {
        return foundResult;
    }

    return {
        originalUrl: url,
        status: 'failed',
        message: 'تم الرفع ولكن تأخر الرد'
    };

  } catch (error: any) {
    console.error("Clone error:", error);
    return {
      originalUrl: url,
      status: 'failed',
      message: 'خطأ في الاتصال'
    };
  }
};