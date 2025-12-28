import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ListOrdered, 
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
  Star,
  Calendar,
  Zap,
  Pause,
  ArrowRight,
  RefreshCw,
  Loader2 as LoaderIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { fetchHtmlWithProxy, generateId, sleep } from '../lib/utils';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';
import { generateExcelFile } from '../services/excel';

interface ExtractionStatus {
  url: string;
  data?: AiMediaResponse;
  error?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  id: string;
}

export const SerialExtractor: React.FC = () => {
  const [startUrl, setStartUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [results, setResults] = useState<ExtractionStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const stopRef = useRef(false);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

  const handleCopy = (url: string, type: 'watch' | 'download') => {
    navigator.clipboard.writeText(url);
    const msg = type === 'watch' 
      ? 'تم نسخ سيرفر المشاهدة بنجاح' 
      : 'تم نسخ سيرفر التحميل بنجاح';
    showToast(msg);
  };

  const processEpisode = async (url: string): Promise<{ data: AiMediaResponse; nextUrl?: string }> => {
    // جلب صفحة الحلقة الأساسية
    const html = await fetchHtmlWithProxy(url);
    const result = await analyzeHtmlWithGemini(html);
    
    // 1. معالجة صفحة المشاهدة المنفصلة (إذا كانت السيرفرات غير موجودة مباشرة)
    if (result.watchPageUrl || (!result.watchServers || result.watchServers.length === 0)) {
        const targetWatchUrl = result.watchPageUrl || url;
        if (targetWatchUrl && (result.watchPageUrl || result.watchServers.length === 0)) {
            try {
                console.log("Fetching player page:", targetWatchUrl);
                const watchHtml = await fetchHtmlWithProxy(targetWatchUrl);
                const watchResult = await analyzeHtmlWithGemini(watchHtml, true);
                if (watchResult.watchServers && watchResult.watchServers.length > 0) {
                    result.watchServers = watchResult.watchServers;
                }
            } catch (wErr) {
                console.warn("Failed to fetch watch page for episode:", url, wErr);
            }
        }
    }

    // 2. معالجة صفحة التحميل (إذا لزم الأمر)
    if (result.downloadPageUrl && (!result.downloadLinks || result.downloadLinks.length < 2)) {
      try {
        console.log("Fetching download page:", result.downloadPageUrl);
        const downloadHtml = await fetchHtmlWithProxy(result.downloadPageUrl);
        const downloadResult = await analyzeHtmlWithGemini(downloadHtml, true);
        if (downloadResult.downloadLinks && downloadResult.downloadLinks.length > 0) {
          result.downloadLinks = [...(result.downloadLinks || []), ...downloadResult.downloadLinks];
        }
      } catch (dlErr) {
        console.warn("Failed to fetch download page for episode:", url, dlErr);
      }
    }
    
    return { data: result, nextUrl: result.nextEpisodeUrl };
  };

  const handleStartExtraction = async () => {
    if (!startUrl.trim().startsWith('http')) {
      setError('الرجاء إدخال رابط الحلقة الأولى بشكل صحيح');
      return;
    }

    setIsProcessing(true);
    setShouldStop(false);
    stopRef.current = false;
    setError(null);
    setResults([]);

    let currentUrl = startUrl.trim();
    let hasNext = true;
    let count = 0;

    while (hasNext && !stopRef.current) {
      const episodeId = generateId();
      count++;
      
      // إضافة إدخال جاري المعالجة
      setResults(prev => [...prev, { url: currentUrl, status: 'processing', id: episodeId }]);

      try {
        // تأخير إجباري بين الحلقات لتجنب Rate Limiting
        if (count > 1) await sleep(3000);

        const { data, nextUrl } = await processEpisode(currentUrl);
        
        // تحديث النتائج بالبيانات المستخرجة
        setResults(prev => prev.map(item => 
          item.id === episodeId 
            ? { ...item, data, status: 'success' as const } 
            : item
        ));

        // التحقق من وجود حلقة تالية
        if (nextUrl && nextUrl.startsWith('http') && nextUrl !== currentUrl) {
          currentUrl = nextUrl;
        } else {
          hasNext = false;
        }
      } catch (err: any) {
        console.error("Error extracting serial episode:", currentUrl, err);
        let errorMsg = err.message || 'فشل الاستخراج';
        if (errorMsg.includes('429') || errorMsg.includes('Quota')) {
          errorMsg = "تجاوزت حد Gemini. يرجى الانتظار دقيقة.";
        }
        setResults(prev => prev.map(item => 
          item.id === episodeId 
            ? { ...item, status: 'failed' as const, error: errorMsg } 
            : item
        ));
        hasNext = false;
      }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
    stopRef.current = true;
    setShouldStop(true);
    setIsProcessing(false);
  };

  const resetExtractor = () => {
    setResults([]);
    setStartUrl('');
    setIsProcessing(false);
    setShouldStop(false);
    stopRef.current = false;
  };

  const exportToExcel = () => {
    const successData = results.filter(r => r.data).map(r => r.data!);
    if (successData.length === 0) return;
    
    const mediaData = successData.map(r => ({
      id: generateId(),
      originalHtmlInputId: 'serial',
      title: r.title,
      seriesTitle: r.seriesTitle,
      season: r.seasonNumber,
      episode: r.episodeNumber,
      type: r.type,
      servers: r.watchServers.map(s => ({ name: s.name, url: s.url })),
      downloadLinks: r.downloadLinks.map(d => ({ name: d.name, url: d.url }))
    }));
    generateExcelFile(mediaData as any);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm pointer-events-none"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl mb-4 border border-amber-500/30">
          <ListOrdered className="w-12 h-12 text-amber-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">مستخرج المسلسلات التلقائي</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          أدخل رابط الحلقة الأولى، وسيقوم النظام بالانتقال آلياً بين الحلقات، العثور على زر التشغيل، واستخراج روابط السيرفرات المباشرة.
        </p>
      </div>

      {/* Input Phase */}
      {!isProcessing && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/30 shadow-amber-500/10">
            <div className="space-y-6">
              <div className="relative">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-amber-400" />
                  رابط الحلقة الأولى (Start URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={startUrl}
                    onChange={(e) => setStartUrl(e.target.value)}
                    placeholder="https://example.com/series/season-1/episode-1"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-12 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all dir-ltr"
                  />
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleStartExtraction} 
                className="w-full py-4 text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-xl shadow-amber-900/20"
                icon={<Play className="w-6 h-6 ml-2" />}
              >
                بدء استخراج المسلسل بالكامل
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-center">
                   <div className="text-amber-400 font-bold mb-1">1. الفتح التلقائي</div>
                   <p className="text-[10px] text-slate-500">يفتح الحلقة الأولى ويتبع أزرار "مشاهدة"</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-center">
                   <div className="text-amber-400 font-bold mb-1">2. استخراج الروابط</div>
                   <p className="text-[10px] text-slate-500">يجلب روابط السيرفرات المباشرة (Embeds)</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 text-center">
                   <div className="text-amber-400 font-bold mb-1">3. الانتقال التتابعي</div>
                   <p className="text-[10px] text-slate-500">يبحث عن الحلقة التالية ويكرر العملية</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Processing & Results Phase */}
      {(isProcessing || results.length > 0) && (
        <div className="space-y-8">
          
          {/* Status Header */}
          <div className="flex justify-between items-center sticky top-20 z-40 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
             <div className="flex items-center gap-4">
               {isProcessing ? (
                 <Button variant="danger" onClick={handleStop} icon={<Pause className="w-4 h-4" />}>
                   إيقاف مؤقت
                 </Button>
               ) : (
                 <Button variant="ghost" onClick={resetExtractor} icon={<ChevronLeft className="w-4 h-4" />}>
                   رجوع
                 </Button>
               )}
               {isProcessing && (
                 <div className="flex items-center gap-2 text-amber-400 text-sm font-bold animate-pulse">
                   <RefreshCw className="w-4 h-4 animate-spin" />
                   جاري استخراج الحلقات...
                 </div>
               )}
             </div>

             <div className="flex items-center gap-3">
               <span className="bg-white/5 px-4 py-2 rounded-full text-xs text-slate-400 font-mono">
                 {results.length} حلقات معالجة
               </span>
               <Button 
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-500"
                disabled={results.filter(r => r.status === 'success').length === 0}
                icon={<FileSpreadsheet className="w-5 h-5 ml-2" />}
               >
                 تصدير لـ Excel
               </Button>
             </div>
          </div>

          {/* Episode Cards List */}
          <div className="space-y-10">
            {results.map((result, idx) => (
              <motion.div 
                key={result.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
              >
                {result.status === 'processing' ? (
                  <Card className="border-amber-500/20 bg-amber-500/5 p-8 flex flex-col items-center justify-center space-y-4">
                    <LoaderIcon className="w-10 h-10 text-amber-500 animate-spin" />
                    <div className="text-center">
                       <h4 className="text-white font-bold text-lg">جاري استخراج الحلقة {idx + 1}</h4>
                       <p className="text-xs text-slate-500 truncate max-w-md dir-ltr mt-1 opacity-50">{result.url}</p>
                    </div>
                  </Card>
                ) : result.status === 'failed' ? (
                  <Card className="border-red-500/30 bg-red-500/5 p-6 text-right">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-red-400 font-bold">فشل في استخراج الحلقة</h3>
                          <p className="text-xs text-slate-500 dir-ltr text-left mt-1">{result.url}</p>
                        </div>
                      </div>
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="mt-4 text-sm text-red-300 p-3 bg-red-900/20 rounded-lg">{result.error}</p>
                  </Card>
                ) : (
                  <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-2xl">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                          {idx + 1}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white leading-tight">
                            {result.data?.title}
                            {result.data?.episodeNumber && <span className="mr-3 text-sm text-amber-400 font-normal bg-amber-400/10 px-2 py-0.5 rounded-full">الحلقة {result.data.episodeNumber}</span>}
                          </h2>
                          <div className="flex gap-4 text-xs text-slate-500 mt-2 font-medium">
                             <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {result.data?.rating || 'N/A'}</span>
                             <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {result.data?.year || 'N/A'}</span>
                             <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-tighter">مسلسل</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <a href={result.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-white transition-all"><ExternalLink className="w-5 h-5" /></a>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-10">
                      {/* Watch Servers */}
                      <div>
                        <h3 className="text-sm font-bold text-cyan-400 mb-5 flex items-center gap-2 uppercase tracking-widest justify-end">
                          ({result.data?.watchServers?.length || 0}) سيرفرات المشاهدة المباشرة
                          <Play className="w-5 h-5" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.data?.watchServers?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all shadow-lg group">
                              <div className="flex gap-3 shrink-0">
                                <button onClick={() => handleCopy(s.url, 'watch')} className="text-xs font-bold bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"><Copy className="w-4 h-4" /> نسخ</button>
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-xl hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-2"><ExternalLink className="w-4 h-4" /> فتح</a>
                              </div>
                              <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Download Links */}
                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 mb-5 flex items-center gap-2 uppercase tracking-widest justify-end">
                          ({result.data?.downloadLinks?.length || 0}) روابط التحميل المستخرجة
                          <Download className="w-5 h-5" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.data?.downloadLinks?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all shadow-lg group">
                              <div className="flex gap-3 shrink-0">
                                <button onClick={() => handleCopy(s.url, 'download')} className="text-xs font-bold bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"><Copy className="w-4 h-4" /> نسخ</button>
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"><Download className="w-4 h-4" /> تحميل</a>
                              </div>
                              <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                            </div>
                          ))}
                          {(!result.data?.downloadLinks || result.data?.downloadLinks.length === 0) && (
                            <div className="col-span-full py-6 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 italic text-sm">
                              لا توجد روابط تحميل مباشرة متوفرة لهذه الحلقة
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}

            {/* Next Episode Indicator */}
            {isProcessing && !stopRef.current && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                 <div className="flex items-center gap-3 text-amber-500 font-bold">
                    <Zap className="w-6 h-6 animate-pulse" />
                    <span>يتم الآن البحث عن الحلقة القادمة...</span>
                 </div>
                 <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};