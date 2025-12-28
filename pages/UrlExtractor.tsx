import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Link as LinkIcon, 
  Bot, 
  Play, 
  Download, 
  ChevronLeft, 
  AlertTriangle, 
  Globe, 
  Search,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { fetchHtmlWithProxy } from '../lib/utils';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';

export const UrlExtractor: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'fetching' | 'analyzing' | 'watch_page' | 'download_page'>('idle');
  const [data, setData] = useState<AiMediaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFromHome = params.get('url');
    if (urlFromHome) {
      setUrlInput(urlFromHome);
      handleProcess(urlFromHome);
    }
  }, [location]);

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

  const handleProcess = async (targetUrl?: string) => {
    const finalUrl = targetUrl || urlInput;
    if (!finalUrl.trim()) return;
    if (!finalUrl.startsWith('http')) {
      setError('الرجاء إدخال رابط صالح يبدأ بـ http');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setStep('fetching');

    try {
      // 1. جلب الصفحة المصدر
      const html = await fetchHtmlWithProxy(finalUrl);
      
      // 2. تحليل المحتوى بالذكاء الاصطناعي
      setStep('analyzing');
      const result = await analyzeHtmlWithGemini(html);
      
      // 3. التحقق من وجود صفحة مشغل منفصلة (Play/Watch Page)
      if (result.watchPageUrl || result.watchServers.length === 0) {
        const playerUrl = result.watchPageUrl || finalUrl;
        if (result.watchPageUrl || result.watchServers.length === 0) {
            setStep('watch_page');
            try {
                const watchHtml = await fetchHtmlWithProxy(playerUrl);
                const watchResult = await analyzeHtmlWithGemini(watchHtml, true);
                if (watchResult.watchServers && watchResult.watchServers.length > 0) {
                    result.watchServers = watchResult.watchServers;
                }
            } catch (wErr) {
                console.warn("Failed to fetch player page:", wErr);
            }
        }
      }

      // 4. التحقق من وجود صفحة تحميل منفصلة
      if (result.downloadPageUrl && (!result.downloadLinks || result.downloadLinks.length < 2)) {
        setStep('download_page');
        try {
          const downloadHtml = await fetchHtmlWithProxy(result.downloadPageUrl);
          const downloadResult = await analyzeHtmlWithGemini(downloadHtml, true);
          if (downloadResult.downloadLinks && downloadResult.downloadLinks.length > 0) {
            result.downloadLinks = [...(result.downloadLinks || []), ...downloadResult.downloadLinks];
          }
        } catch (dlErr) {
          console.warn("Failed to fetch download page:", dlErr);
        }
      }
      
      setData(result);
      setStep('idle');
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'خطأ غير معروف';
      if (errorMsg.includes('429') || errorMsg.includes('Quota')) {
        errorMsg = "⚠️ لقد تجاوزت حد الاستخدام المسموح به لذكاء Gemini حالياً. يرجى الانتظار لمدة دقيقة واحدة ثم المحاولة مرة أخرى.";
      }
      setError(errorMsg);
      setStep('idle');
    } finally {
      setLoading(false);
    }
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
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-4 border border-cyan-500/30">
          <Globe className="w-12 h-12 text-cyan-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">المستورد الآلي بالروابط</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          أدخل رابط الصفحة، وسيقوم النظام تلقائياً بالعثور على صفحة المشغل والتحميل واستخراج السيرفرات النهائية.
        </p>
      </div>

      {/* URL Input Area */}
      {!data && (
        <Card className="border-cyan-500/30 shadow-cyan-500/10">
          <div className="space-y-6">
            <div className="relative">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                رابط الصفحة المصدر (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/movie-name"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-12 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none transition-all dir-ltr"
                />
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm leading-relaxed">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              onClick={() => handleProcess()} 
              isLoading={loading}
              className="w-full py-4 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-900/20"
              icon={!loading ? <Search className="w-5 h-5 ml-2" /> : undefined}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  {step === 'fetching' ? 'جاري جلب الصفحة...' : 
                   step === 'analyzing' ? 'جاري تحليل البيانات...' :
                   step === 'watch_page' ? 'جاري استخراج السيرفرات من المشغل...' :
                   step === 'download_page' ? 'جاري جلب روابط التحميل المباشرة...' : 'جاري التحميل...'}
                </span>
              ) : 'بدء الاستيراد الذكي'}
            </Button>
          </div>
        </Card>
      )}

      {/* Results Display */}
      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="flex justify-between items-center">
             <Button variant="ghost" onClick={() => setData(null)} icon={<ChevronLeft className="w-4 h-4" />}>
               رابط جديد
             </Button>
             <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" /> تم الاستخراج بنجاح
             </div>
           </div>

           <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-2xl">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800">
                <h2 className="text-2xl font-bold text-white mb-1">{data.title}</h2>
                <p className="text-slate-400 text-sm">{data.type === 'Movie' ? 'فيلم' : 'مسلسل'} • {data.year || 'N/A'}</p>
              </div>
              
              <div className="p-6 space-y-8">
                 <div>
                    <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-wider justify-end">
                      ({data.watchServers?.length || 0}) سيرفرات المشاهدة النهائية
                      <Play className="w-4 h-4" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.watchServers?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group shadow-sm">
                           <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => handleCopy(s.url, 'watch')}
                                className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
                              >
                                <Copy className="w-3 h-3" /> نسخ
                              </button>
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs bg-cyan-600/20 text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-1.5">
                                <ExternalLink className="w-3 h-3" /> فتح
                              </a>
                           </div>
                           <span className="text-sm font-medium text-slate-200 truncate pr-4">{s.name}</span>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase tracking-wider justify-end">
                      ({data.downloadLinks?.length || 0}) روابط التحميل المستخرجة
                      <Download className="w-4 h-4" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.downloadLinks?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group shadow-sm">
                           <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => handleCopy(s.url, 'download')}
                                className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
                              >
                                <Copy className="w-3 h-3" /> نسخ
                              </button>
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5">
                                <Download className="w-3 h-3" /> تحميل
                              </a>
                           </div>
                           <span className="text-sm font-medium text-slate-200 truncate pr-4">{s.name}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
           </Card>
        </motion.div>
      )}

    </div>
  );
};