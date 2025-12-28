import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Layers, 
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
  Plus,
  Trash2,
  Link as LinkIcon,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { fetchHtmlWithProxy, generateId, sleep } from '../lib/utils';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';
import { generateExcelFile } from '../services/excel';

interface UrlInputRow {
  id: string;
  url: string;
}

interface ExtractionResult {
  data?: AiMediaResponse;
  error?: string;
  originalUrl: string;
  id: string;
}

export const BulkUrlExtractor: React.FC = () => {
  const [urlRows, setUrlRows] = useState<UrlInputRow[]>([{ id: generateId(), url: '' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

  const addRow = () => {
    setUrlRows([...urlRows, { id: generateId(), url: '' }]);
  };

  const removeRow = (id: string) => {
    if (urlRows.length > 1) {
      setUrlRows(urlRows.filter(row => row.id !== id));
    } else {
      setUrlRows([{ id: generateId(), url: '' }]);
    }
  };

  const updateUrl = (id: string, url: string) => {
    setUrlRows(urlRows.map(row => row.id === id ? { ...row, url } : row));
  };

  const handleCopy = (url: string, type: 'watch' | 'download') => {
    navigator.clipboard.writeText(url);
    const msg = type === 'watch' 
      ? 'تم نسخ سيرفر المشاهدة بنجاح' 
      : 'تم نسخ سيرفر التحميل بنجاح';
    showToast(msg);
  };

  const processSingleUrl = async (url: string): Promise<AiMediaResponse> => {
    const html = await fetchHtmlWithProxy(url);
    const result = await analyzeHtmlWithGemini(html);
    
    // تتبع صفحة المشغل إذا وجدت
    if (result.watchPageUrl || result.watchServers.length === 0) {
        const playerUrl = result.watchPageUrl || url;
        if (result.watchPageUrl || result.watchServers.length === 0) {
            try {
                const watchHtml = await fetchHtmlWithProxy(playerUrl);
                const watchResult = await analyzeHtmlWithGemini(watchHtml, true);
                if (watchResult.watchServers && watchResult.watchServers.length > 0) {
                    result.watchServers = watchResult.watchServers;
                }
            } catch (wErr) {
                console.warn("Bulk: Failed player page", url, wErr);
            }
        }
    }

    // تتبع صفحة التحميل إذا وجدت
    if (result.downloadPageUrl && (!result.downloadLinks || result.downloadLinks.length < 2)) {
      try {
        const downloadHtml = await fetchHtmlWithProxy(result.downloadPageUrl);
        const downloadResult = await analyzeHtmlWithGemini(downloadHtml, true);
        if (downloadResult.downloadLinks && downloadResult.downloadLinks.length > 0) {
          result.downloadLinks = [...(result.downloadLinks || []), ...downloadResult.downloadLinks];
        }
      } catch (dlErr) {
        console.warn("Bulk: Failed download page", url, dlErr);
      }
    }
    return result;
  };

  const handleStartProcess = async () => {
    const urls = urlRows.map(row => row.url.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) {
      setError('الرجاء إدخال رابط واحد صالح على الأقل');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]); 
    setProgress({ current: 0, total: urls.length });
    const newResults: ExtractionResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        // إضافة تأخير بين الطلبات لتجنب Quota Limit
        if (i > 0) await sleep(2000); 

        const res = await processSingleUrl(url);
        newResults.push({ data: res, originalUrl: url, id: generateId() });
      } catch (err: any) {
        console.error("Error processing URL:", url, err);
        let errorMsg = err.message || 'فشل جلب البيانات';
        if (errorMsg.includes('429') || errorMsg.includes('Quota')) {
          errorMsg = "تجاوزت حد Gemini. يرجى الانتظار دقيقة.";
        }
        newResults.push({ error: errorMsg, originalUrl: url, id: generateId() });
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    setResults(newResults);
    setIsProcessing(false);
  };

  const resetExtractor = () => {
    setResults([]);
    setUrlRows([{ id: generateId(), url: '' }]);
  };

  const exportAllToExcel = () => {
    const successResults = results.filter(r => r.data).map(r => r.data!);
    if (successResults.length === 0) return;
    const mediaData = successResults.map(r => ({
      id: generateId(),
      originalHtmlInputId: 'bulk',
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
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-4 border border-indigo-500/30">
          <Layers className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">المستورد الجماعي الشامل</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          أدخل روابط الأفلام أو الحلقات، وسيقوم النظام بتتبع صفحات المشغل وصفحات التحميل لكل عنصر آلياً.
        </p>
      </div>

      {/* Input Phase */}
      {!isProcessing && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-indigo-500/30 shadow-indigo-500/10">
            <div className="space-y-6">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-indigo-400" />
                قائمة الروابط المراد استخراجها
              </label>
              
              <div className="space-y-3">
                <AnimatePresence mode='popLayout'>
                  {urlRows.map((row, idx) => (
                    <motion.div 
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-2 items-center"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="url"
                          value={row.url}
                          onChange={(e) => updateUrl(row.id, e.target.value)}
                          placeholder={`أدخل الرابط رقم ${idx + 1}...`}
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-10 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dir-ltr"
                        />
                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                      <button 
                        onClick={() => removeRow(row.id)}
                        className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <Button 
                  variant="secondary" 
                  onClick={addRow} 
                  className="w-full py-4 border-dashed border-2 bg-transparent hover:bg-white/5"
                  icon={<Plus className="w-5 h-5" />}
                >
                  إضافة مصدر جديد
                </Button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm justify-center">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={handleStartProcess} 
                  className="w-full py-4 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl shadow-indigo-900/20"
                  icon={<Play className="w-6 h-6 ml-2" />}
                >
                  بدء الاستخراج الجماعي
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Processing Phase */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-3xl border border-indigo-500/20">
           <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-6" />
           <div className="text-center space-y-4">
             <h3 className="text-2xl font-bold text-white">جاري معالجة الروابط</h3>
             <p className="text-slate-400">يتم تتبع المشغلات وصفحات التحميل لكل رابط آلياً لضمان الحصول على السيرفرات النهائية...</p>
             <div className="flex items-center gap-3 justify-center text-indigo-400 font-bold text-xl">
               <Globe className="w-6 h-6 animate-pulse" />
               <span>{progress.current} / {progress.total}</span>
             </div>
             <div className="w-64 bg-slate-800 rounded-full h-2 mx-auto overflow-hidden">
                <motion.div 
                  className="bg-indigo-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
             </div>
           </div>
        </div>
      )}

      {/* Results Phase */}
      {results.length > 0 && !isProcessing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="flex justify-between items-center sticky top-20 z-40 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
            <Button variant="ghost" onClick={resetExtractor} icon={<ChevronLeft className="w-4 h-4" />}>
              رجوع للإدخال
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-bold flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                تمت معالجة {results.length} روابط
              </span>
              {results.some(r => r.data) && (
                <Button 
                  onClick={exportAllToExcel} 
                  className="bg-emerald-600 hover:bg-emerald-500"
                  icon={<FileSpreadsheet className="w-5 h-5 ml-2" />}
                >
                  تصدير الناجح لـ Excel
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-10">
            {results.map((result, idx) => (
              <motion.div 
                key={result.id} 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {result.error ? (
                  <Card className="border-red-500/30 bg-red-500/5 p-6 text-right relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-red-500/50" />
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-red-400 font-bold">فشل الاستخراج الآلي</h3>
                          <p className="text-xs text-slate-500 truncate max-w-md dir-ltr text-left">{result.originalUrl}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setResults(results.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 space-y-3 text-red-300 text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p>{result.error}</p>
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-2xl ring-1 ring-white/5">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                          {idx + 1}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">{result.data?.title}</h2>
                          <div className="flex gap-4 text-xs text-slate-500 mt-2 font-medium">
                             <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {result.data?.rating || 'N/A'}</span>
                             <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {result.data?.year || 'N/A'}</span>
                             <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-tighter">{result.data?.type === 'Movie' ? 'فيلم' : 'مسلسل'}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setResults(results.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="p-8 space-y-10">
                      <div>
                        <h3 className="text-sm font-bold text-cyan-400 mb-5 flex items-center gap-2 uppercase tracking-widest justify-end">
                          ({result.data?.watchServers?.length || 0}) سيرفرات المشاهدة المتاحة
                          <Play className="w-5 h-5" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.data?.watchServers?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all shadow-lg group">
                              <div className="flex gap-3 shrink-0">
                                <button onClick={() => handleCopy(s.url, 'watch')} className="text-xs font-bold bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2">
                                  <Copy className="w-4 h-4" /> نسخ
                                </button>
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-xl hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-2">
                                  <ExternalLink className="w-4 h-4" /> فتح
                                </a>
                              </div>
                              <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-emerald-400 mb-5 flex items-center gap-2 uppercase tracking-widest justify-end">
                          ({result.data?.downloadLinks?.length || 0}) روابط التحميل المباشرة
                          <Download className="w-5 h-5" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.data?.downloadLinks?.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all shadow-lg group">
                              <div className="flex gap-3 shrink-0">
                                <button onClick={() => handleCopy(s.url, 'download')} className="text-xs font-bold bg-slate-800 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2">
                                  <Copy className="w-4 h-4" /> نسخ
                                </button>
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2">
                                  <Download className="w-4 h-4" /> تحميل
                                </a>
                              </div>
                              <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button variant="secondary" onClick={resetExtractor} className="px-12 py-4">
              استخراج مجموعة جديدة
            </Button>
          </div>
        </motion.div>
      )}

    </div>
  );
};