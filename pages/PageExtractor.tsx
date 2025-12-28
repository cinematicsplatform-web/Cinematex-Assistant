import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Library, 
  Search, 
  Play, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  X,
  FileSpreadsheet,
  Globe,
  Loader2,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini, extractLinksFromListing } from '../services/gemini';
import { fetchHtmlWithProxy, generateId, sleep } from '../lib/utils';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';
import { generateExcelFile } from '../services/excel';

interface TaskStatus {
  url: string;
  data?: AiMediaResponse;
  error?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  id: string;
}

export const PageExtractor: React.FC = () => {
  const [listingUrl, setListingUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'idle' | 'fetching_listing' | 'analyzing_listing' | 'processing_items'>('idle');
  const [results, setResults] = useState<TaskStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('تم نسخ الرابط بنجاح');
  };

  const processSingleMovie = async (url: string): Promise<AiMediaResponse> => {
    const html = await fetchHtmlWithProxy(url);
    const result = await analyzeHtmlWithGemini(html);
    
    // Check for watch page
    if (result.watchPageUrl || (!result.watchServers || result.watchServers.length === 0)) {
        const playerUrl = result.watchPageUrl || url;
        try {
            const watchHtml = await fetchHtmlWithProxy(playerUrl);
            const watchResult = await analyzeHtmlWithGemini(watchHtml, true);
            if (watchResult.watchServers && watchResult.watchServers.length > 0) {
                result.watchServers = watchResult.watchServers;
            }
        } catch (e) { console.warn("Sub-page fetch failed", e); }
    }

    // Check for download page
    if (result.downloadPageUrl && (!result.downloadLinks || result.downloadLinks.length < 2)) {
      try {
        const dlHtml = await fetchHtmlWithProxy(result.downloadPageUrl);
        const dlResult = await analyzeHtmlWithGemini(dlHtml, true);
        if (dlResult.downloadLinks && dlResult.downloadLinks.length > 0) {
          result.downloadLinks = [...(result.downloadLinks || []), ...dlResult.downloadLinks];
        }
      } catch (e) { console.warn("DL-page fetch failed", e); }
    }
    return result;
  };

  const handleStartExtraction = async () => {
    if (!listingUrl.trim().startsWith('http')) {
      setError('الرجاء إدخال رابط قسم صالح');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    
    try {
      // 1. Fetch Listing Page
      setStep('fetching_listing');
      const listingHtml = await fetchHtmlWithProxy(listingUrl);
      
      // 2. Extract links using Gemini
      setStep('analyzing_listing');
      const { links } = await extractLinksFromListing(listingHtml);
      
      if (!links || links.length === 0) {
        throw new Error("لم يتم العثور على روابط أفلام في هذه الصفحة. تأكد من الرابط.");
      }

      setStep('processing_items');
      
      // Initialize results with pending state
      const initialTasks: TaskStatus[] = links.map(url => ({
        url,
        id: generateId(),
        status: 'pending'
      }));
      setResults(initialTasks);

      // Process sequentially to avoid heavy load
      for (let i = 0; i < initialTasks.length; i++) {
        const task = initialTasks[i];
        
        setResults(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing' } : t));

        try {
          // تأخير إجباري بين العناصر لتجنب 429 Error
          if (i > 0) await sleep(2500);

          const data = await processSingleMovie(task.url);
          setResults(prev => prev.map(t => t.id === task.id ? { ...t, data, status: 'success' } : t));
        } catch (err: any) {
          let errorMsg = err.message || 'حدث خطأ';
          if (errorMsg.includes('429') || errorMsg.includes('Quota')) {
            errorMsg = "تجاوزت حد Gemini. يرجى الانتظار.";
          }
          setResults(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed', error: errorMsg } : t));
        }
      }

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء معالجة الصفحة');
    } finally {
      setIsProcessing(false);
      setStep('idle');
    }
  };

  const exportAll = () => {
    const successData = results.filter(r => r.data).map(r => r.data!);
    if (successData.length === 0) return;
    
    const mediaItems = successData.map(r => ({
      id: generateId(),
      originalHtmlInputId: 'page-extractor',
      title: r.title,
      seriesTitle: r.seriesTitle,
      season: r.seasonNumber,
      episode: r.episodeNumber,
      type: r.type,
      servers: r.watchServers.map(s => ({ name: s.name, url: s.url })),
      downloadLinks: r.downloadLinks.map(d => ({ name: d.name, url: d.url }))
    }));
    generateExcelFile(mediaItems as any);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-2xl mb-4 border border-indigo-500/30">
          <LayoutGrid className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">مستخرج الأفلام من الأقسام</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          أدخل رابط القسم (Category) وسيقوم النظام بالدخول إلى كل فيلم في الصفحة واستخراج بياناته بالكامل.
        </p>
      </div>

      {!isProcessing && results.length === 0 && (
        <Card className="border-indigo-500/30">
          <div className="space-y-6">
            <div className="relative">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-indigo-400" /> رابط صفحة القسم (Category URL)
              </label>
              <input
                type="url"
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://site.com/category/arabic-movies"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr"
              />
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
            <Button onClick={handleStartExtraction} className="w-full py-4 text-xl font-bold bg-indigo-600 hover:bg-indigo-500" icon={<Search className="w-6 h-6 ml-2" />}>بدء استخراج القسم</Button>
          </div>
        </Card>
      )}

      {isProcessing && step !== 'processing_items' && (
        <Card className="flex flex-col items-center justify-center py-16 space-y-6">
           <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
           <div className="text-center">
             <h3 className="text-xl font-bold text-white">
               {step === 'fetching_listing' ? 'جاري جلب صفحة القسم...' : 'جاري تحليل الروابط بواسطة AI...'}
             </h3>
             <p className="text-slate-500 mt-2">نستخدم الذكاء الاصطناعي لتمييز روابط الأفلام عن الروابط الأخرى.</p>
           </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center sticky top-20 z-40 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
             <Button variant="ghost" onClick={() => { setResults([]); setListingUrl(''); }} icon={<ChevronLeft className="w-4 h-4" />}>جديد</Button>
             <div className="flex items-center gap-4">
               {isProcessing && <div className="text-indigo-400 text-sm font-bold flex items-center gap-2 animate-pulse"><RefreshCw className="w-4 h-4 animate-spin" /> جاري المعالجة...</div>}
               <Button onClick={exportAll} disabled={results.filter(r => r.status === 'success').length === 0} className="bg-emerald-600 hover:bg-emerald-500" icon={<FileSpreadsheet className="w-5 h-5 ml-2" />}>تصدير الكل لـ Excel</Button>
             </div>
          </div>

          <div className="grid gap-6">
            {results.map((res, idx) => (
              <Card key={res.id} className={cn("p-0 overflow-hidden border-white/5", res.status === 'processing' && "ring-2 ring-indigo-500/50 shadow-indigo-500/20")}>
                <div className="p-4 bg-slate-900/50 flex justify-between items-center border-b border-white/5">
                   <div className="flex items-center gap-4">
                     <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">{idx + 1}</span>
                     <div>
                       <h3 className="text-white font-bold">{res.data?.title || 'جاري التحليل...'}</h3>
                       <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs dir-ltr">{res.url}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      {res.status === 'processing' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                      {res.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {res.status === 'failed' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                   </div>
                </div>

                {res.status === 'success' && res.data && (
                  <div className="p-6 grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-cyan-400 mb-4 flex items-center gap-2 uppercase"><Play className="w-3 h-3" /> سيرفرات المشاهدة</h4>
                      <div className="space-y-2">
                        {res.data.watchServers.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs group">
                            <span className="text-slate-300 truncate pr-4">{s.name}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleCopy(s.url)} className="p-1 hover:text-indigo-400"><Copy className="w-3 h-3" /></button>
                              <a href={s.url} target="_blank" className="p-1 hover:text-cyan-400"><ExternalLink className="w-3 h-3" /></a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase"><Download className="w-3 h-3" /> روابط التحميل</h4>
                      <div className="space-y-2">
                        {res.data.downloadLinks.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded-lg text-xs group">
                            <span className="text-slate-300 truncate pr-4">{s.name}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleCopy(s.url)} className="p-1 hover:text-indigo-400"><Copy className="w-3 h-3" /></button>
                              <a href={s.url} target="_blank" className="p-1 hover:text-emerald-400"><Download className="w-3 h-3" /></a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {res.status === 'failed' && (
                  <div className="p-4 bg-red-500/5 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> فشل: {res.error}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);