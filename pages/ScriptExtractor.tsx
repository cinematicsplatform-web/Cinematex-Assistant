
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Zap, 
  Globe, 
  Link as LinkIcon, 
  Search, 
  Play, 
  Download, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Code,
  FileSearch,
  RefreshCw,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHtmlWithProxy } from '../lib/utils';
import { extractWithScript } from '../services/scriptParser';
import { ServerInfo } from '../types';
import { cn } from '../lib/utils';

export const ScriptExtractor: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    servers: ServerInfo[];
    downloadLinks: ServerInfo[];
  } | null>(null);

  const handleProcess = async () => {
    let htmlContent = "";
    
    setError(null);

    if (isManualMode) {
      if (!manualHtml.trim()) {
        setError("الرجاء لصق كود HTML أولاً");
        return;
      }
      htmlContent = manualHtml;
    } else {
      if (!urlInput.trim()) {
        setError("الرجاء إدخال رابط صالح");
        return;
      }
      if (!urlInput.startsWith('http')) {
        setError('الرجاء إدخال رابط صالح يبدأ بـ http');
        return;
      }
      setLoading(true);
      try {
        htmlContent = await fetchHtmlWithProxy(urlInput);
      } catch (err: any) {
        setError(err.message || 'فشل جلب الرابط بسبب حماية الموقع. جرب الوضع اليدوي.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const data = extractWithScript(htmlContent);
      if ((data.servers?.length || 0) === 0 && (data.downloadLinks?.length || 0) === 0) {
         setError('لم يتم العثور على روابط داخل الكود. تأكد من أنك في صفحة الفيلم/الحلقة الصحيحة.');
         setResult(null);
      } else {
         setResult({
           title: data.title || 'بدون عنوان',
           servers: data.servers || [],
           downloadLinks: data.downloadLinks || []
         });
         setError(null);
      }
    } catch (err: any) {
      setError('حدث خطأ تقني أثناء معالجة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl mb-4 border border-yellow-500/30 shadow-lg shadow-yellow-500/5">
          <Zap className="w-12 h-12 text-yellow-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">المستخرج البرمجي السريع</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          أداة "بدون AI" مخصصة للمواقع الصعبة. إذا فشل الرابط المباشر، استخدم خيار لصق الكود (HTML) لضمان العمل 100%.
        </p>
      </div>

      {!result && (
        <Card className="border-yellow-500/30 overflow-visible relative">
          <div className="space-y-6">
            {/* Mode Switcher */}
            <div className="flex bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
              <button 
                onClick={() => { setIsManualMode(false); setError(null); }}
                className={cn(
                  "flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                  !isManualMode ? "bg-yellow-600 text-white shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Globe className="w-4 h-4" /> رابط مباشر (URL)
              </button>
              <button 
                onClick={() => { setIsManualMode(true); setError(null); }}
                className={cn(
                  "flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2", 
                  isManualMode ? "bg-yellow-600 text-white shadow-xl scale-[1.02]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Code className="w-4 h-4" /> وضع الكود اليدوي
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isManualMode ? (
                <motion.div 
                  key="manual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 flex items-center gap-2">
                      <Code className="w-4 h-4 text-yellow-400" /> الصق كود HTML (Ctrl+U)
                    </label>
                    <div className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> اضغط Ctrl+U في صفحة الفيلم، ثم انسخ الكل
                    </div>
                  </div>
                  <textarea 
                    value={manualHtml}
                    onChange={(e) => setManualHtml(e.target.value)}
                    placeholder="<html>..."
                    className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-yellow-500 outline-none transition-all dir-ltr"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="url"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-yellow-400" /> رابط الصفحة المراد تحليلها
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://mycima.tv/watch/..."
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-12 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-yellow-500 outline-none transition-all dir-ltr"
                    />
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-pulse">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">تنبيه:</p>
                  <p>{error}</p>
                  {error.includes('فشل جلب') && (
                    <button 
                      onClick={() => setIsManualMode(true)}
                      className="text-[10px] underline decoration-dotted mt-2 hover:text-white"
                    >
                      اضغط هنا للانتقال للوضع اليدوي وتجاوز الحظر فوراً
                    </button>
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleProcess} 
              isLoading={loading}
              className="w-full py-5 text-lg font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-xl shadow-yellow-900/20"
              icon={!loading ? <FileSearch className="w-6 h-6 ml-2" /> : undefined}
            >
              {loading ? (isManualMode ? 'جاري التحليل البرمجي...' : 'جاري المحاولة عبر البروكسي...') : 'بدء الاستخراج الفوري'}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => {setResult(null); setError(null);}} icon={<ChevronLeft className="w-4 h-4" />}>
              تحليل رابط جديد
            </Button>
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20">
               <CheckCircle2 className="w-4 h-4" /> تم الاستخراج بنجاح (Script Engine)
            </div>
          </div>

          <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-2xl">
            <div className="p-8 border-b border-white/10 bg-slate-900/90 relative">
              <div className="absolute top-0 right-0 w-32 h-full bg-yellow-500/5 blur-3xl -z-10" />
              <h2 className="text-3xl font-extrabold text-white mb-2">{result.title}</h2>
              <div className="flex items-center gap-4 text-slate-500 text-xs">
                 <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {result.servers.length} مشغل</span>
                 <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {result.downloadLinks.length} رابط تحميل</span>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Watch Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-yellow-400 flex items-center gap-2 uppercase justify-end tracking-widest">
                  سيرفرات المشاهدة المستخرجة
                  <Play className="w-4 h-4" />
                </h3>
                <div className="space-y-3">
                  {result.servers.map((s, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all group shadow-sm"
                    >
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(s.url)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors" title="نسخ الرابط"><Copy className="w-4 h-4" /></button>
                        <a href={s.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-yellow-500/20 rounded-lg text-slate-500 hover:text-yellow-400 transition-colors" title="فتح المشغل"><ExternalLink className="w-4 h-4" /></a>
                      </div>
                      <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                    </motion.div>
                  ))}
                  {result.servers.length === 0 && (
                    <div className="text-center py-8 opacity-20 flex flex-col items-center">
                       <Play className="w-12 h-12 mb-2" />
                       <p className="text-xs">لم يتم العثور على مشغلات</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Downloads Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase justify-end tracking-widest">
                  روابط التحميل المباشرة
                  <Download className="w-4 h-4" />
                </h3>
                <div className="space-y-3">
                  {result.downloadLinks.map((s, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group shadow-sm"
                    >
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(s.url)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors" title="نسخ"><Copy className="w-4 h-4" /></button>
                        <a href={s.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-emerald-500/20 rounded-lg text-slate-500 hover:text-emerald-400 transition-colors" title="تحميل مباشر"><Download className="w-4 h-4" /></a>
                      </div>
                      <span className="text-sm font-bold text-slate-200 truncate pr-4">{s.name}</span>
                    </motion.div>
                  ))}
                  {result.downloadLinks.length === 0 && (
                    <div className="text-center py-8 opacity-20 flex flex-col items-center">
                       <Download className="w-12 h-12 mb-2" />
                       <p className="text-xs">لم يتم العثور على روابط تحميل</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
