
import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Zap, 
  Play, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  FileSpreadsheet,
  Globe,
  Pause,
  RefreshCw,
  Loader2 as LoaderIcon,
  Search,
  Video,
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHtmlWithProxy, generateId, sleep } from '../lib/utils';
import { extractWithScript } from '../services/scriptParser';
import { ScriptExtractionResult, MediaData } from '../types';
import { generateExcelFile } from '../services/excel';

interface ExtractionStatus {
  url: string;
  data?: ScriptExtractionResult;
  error?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  id: string;
}

export const ExtractionTool: React.FC = () => {
  const [startUrl, setStartUrl] = useState('');
  const [startEp, setStartEp] = useState('1');
  const [endEp, setEndEp] = useState('10');
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

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('تم النسخ بنجاح');
  };

  const handleStartExtraction = async () => {
    if (!startUrl.trim().startsWith('http')) {
      setError('الرجاء إدخال رابط صالح يبدأ بـ http');
      return;
    }

    const startNum = parseInt(startEp);
    const endNum = parseInt(endEp);

    if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      setError('الرجاء إدخال نطاق حلقات صحيح (البداية يجب أن تكون أصغر من أو تساوي النهاية)');
      return;
    }

    setIsProcessing(true);
    setShouldStop(false);
    stopRef.current = false;
    setError(null);
    setResults([]);

    let currentUrl = startUrl.trim();
    let currentEpNum = startNum;
    let visitedUrls = new Set<string>();
    
    // "ذاكرة الجلسة" لحفظ الروابط المكتشفة في شبكة الحلقات
    let discoveredLinks = new Map<number, string>();
    discoveredLinks.set(startNum, currentUrl);

    while (currentEpNum <= endNum && !stopRef.current) {
      if (visitedUrls.has(currentUrl)) {
        console.warn("Detected loop, stopping.");
        break;
      }
      visitedUrls.add(currentUrl);

      const episodeId = generateId();
      
      // إضافة الحالة الحالية للمعالجة
      setResults(prev => [...prev, { url: currentUrl, status: 'processing', id: episodeId }]);

      try {
        // تأخير بسيط لمحاكاة التصفح الطبيعي وتجنب الحظر
        if (currentEpNum > startNum) await sleep(2500);

        const html = await fetchHtmlWithProxy(currentUrl);
        const data = extractWithScript(html, currentUrl);
        
        // تحديث النتيجة فور الاستخراج
        setResults(prev => prev.map(item => 
          item.id === episodeId 
            ? { ...item, data, status: 'success' as const } 
            : item
        ));

        // تحديث "ذاكرة الجلسة" بكافة الحلقات الموجودة في صفحة الحلقة الحالية
        if (data.allEpisodes) {
          data.allEpisodes.forEach(ep => {
            if (ep.number >= startNum && ep.number <= endNum) {
              discoveredLinks.set(ep.number, ep.url);
            }
          });
        }

        // منطق التتابع التلقائي الذكي
        let nextTargetUrl: string | undefined = undefined;

        // 1. الأولوية للرابط المكتشف في "ذاكرة الجلسة" للرقم التالي (X+1)
        if (discoveredLinks.has(currentEpNum + 1)) {
          nextTargetUrl = discoveredLinks.get(currentEpNum + 1);
          console.log(`Using Session Memory for Episode ${currentEpNum + 1}`);
        } 
        // 2. إذا لم يوجد في الذاكرة، نجرب زر "التالية" الصريح من الصفحة
        else if (data.nextUrl) {
          nextTargetUrl = data.nextUrl;
          console.log(`Using 'Next' button for Episode ${currentEpNum + 1}`);
        }

        // الانتقال للخطوة التالية إذا وجدنا رابطاً وضمن النطاق
        if (nextTargetUrl && currentEpNum < endNum) {
          currentUrl = nextTargetUrl;
          currentEpNum++;
        } else {
          // إذا لم نجد وسيلة للانتقال، نتوقف
          console.log("No more sequential links found. Stopping extraction.");
          break;
        }
      } catch (err: any) {
        setResults(prev => prev.map(item => 
          item.id === episodeId 
            ? { ...item, status: 'failed' as const, error: err.message || 'فشل الجلب' } 
            : item
        ));
        break; 
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
    setStartEp('1');
    setEndEp('10');
    setIsProcessing(false);
    setShouldStop(false);
    stopRef.current = false;
  };

  const exportToExcel = () => {
    const successData = results.filter(r => r.data).map(r => r.data!);
    if (successData.length === 0) return;
    
    const mediaData: MediaData[] = successData.map(r => ({
      id: generateId(),
      originalHtmlInputId: 'extraction-tool',
      title: r.title,
      seriesTitle: r.title.split(' Season')[0].trim(),
      season: r.seasonNumber || 1,
      episode: r.episodeNumber || 1,
      type: 'Series',
      servers: r.servers,
      downloadLinks: r.downloadLinks
    }));
    generateExcelFile(mediaData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-4 border border-indigo-500/30">
          <Zap className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-white">أداة الاستخراج المتسلسل (Turbo)</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">اقتناص الفيديو المباشر وروابط التحميل تتابعياً من حلقة X إلى حلقة Y آلياً.</p>
      </div>

      {!isProcessing && results.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-indigo-500/30">
            <div className="space-y-6">
              <div className="relative">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-indigo-400" /> رابط البداية (الحلقة المدخلة)</label>
                <div className="relative">
                  <input type="url" value={startUrl} onChange={(e) => setStartUrl(e.target.value)} placeholder="https://site.com/episode-1" className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2"><ListOrdered className="w-4 h-4 text-indigo-400" /> من الحلقة رقم</label>
                  <input type="number" value={startEp} onChange={(e) => setStartEp(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2"><ListOrdered className="w-4 h-4 text-indigo-400" /> إلى الحلقة رقم</label>
                  <input type="number" value={endEp} onChange={(e) => setEndEp(e.target.value)} className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm flex items-center gap-3"><AlertTriangle className="w-4 h-4" />{error}</div>}
              <Button onClick={handleStartExtraction} className="w-full py-4 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl" icon={<Play className="w-6 h-6 ml-2" />}>بدء الاستخراج المتسلسل التلقائي</Button>
            </div>
          </Card>
        </motion.div>
      )}

      {(isProcessing || results.length > 0) && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center sticky top-20 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl gap-4">
             <div className="flex items-center gap-4">
               {isProcessing ? (
                 <Button variant="danger" onClick={handleStop} icon={<Pause className="w-4 h-4" />}>
                   انسحاب من الجلسة بالكامل
                 </Button>
               ) : (
                 <Button variant="ghost" onClick={resetExtractor} icon={<ChevronLeft className="w-4 h-4" />}>
                   رجوع
                 </Button>
               )}
               {isProcessing && <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold"><RefreshCw className="w-4 h-4 animate-spin" /> جاري تتبع الحلقات من {startEp} إلى {endEp}...</div>}
             </div>
             <div className="flex items-center gap-3">
               <span className="bg-slate-800 px-4 py-2 rounded-xl text-xs text-slate-400 font-bold border border-white/5">{results.length} حلقات معالجة</span>
               <Button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-500" disabled={results.filter(r => r.status === 'success').length === 0} icon={<FileSpreadsheet className="w-5 h-5 ml-2" />}>تصدير ملف Excel</Button>
             </div>
          </div>

          <div className="grid gap-6">
            {results.map((result, idx) => (
              <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {result.status === 'processing' ? (
                  <Card className="border-indigo-500/20 bg-indigo-500/5 p-8 flex flex-col items-center justify-center space-y-4">
                    <LoaderIcon className="w-10 h-10 text-indigo-500 animate-spin" />
                    <h4 className="text-white font-bold text-center">جاري استخراج الحلقة #{idx + parseInt(startEp)}</h4>
                  </Card>
                ) : result.status === 'failed' ? (
                  <Card className="border-red-500/30 bg-red-500/5 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">{idx + parseInt(startEp)}</div><p className="text-red-400 font-bold">فشل الاستخراج من هذا الرابط</p></div>
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </Card>
                ) : (
                  <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-xl">
                    <div className="p-5 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">{result.data?.episodeNumber || (idx + parseInt(startEp))}</div><h2 className="text-xl font-bold text-white">{result.data?.title}</h2></div>
                      <a href={result.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-white"><ExternalLink className="w-5 h-5" /></a>
                    </div>

                    <div className="p-8 grid md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-cyan-400 flex items-center gap-2 uppercase tracking-widest"><Play className="w-5 h-5" /> سيرفر المشاهدة الوحيد ({result.data?.servers.length})</h4>
                        <div className="space-y-2">
                           {result.data?.servers.map((s, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 text-xs hover:border-cyan-500/30 transition-all">
                                <span className="text-slate-200 font-bold truncate pr-4">{s.name}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => handleCopy(s.url)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"><Copy className="w-4 h-4 text-slate-400" /></button>
                                  <a href={s.url} target="_blank" className="p-2 bg-cyan-600/20 hover:bg-cyan-600/40 rounded-lg"><ExternalLink className="w-4 h-4 text-cyan-400" /></a>
                                </div>
                             </div>
                           ))}
                           {result.data?.servers.length === 0 && <p className="text-xs text-slate-600 italic">لم يتم اكتشاف فيديو مباشر.</p>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><Download className="w-5 h-5" /> روابط التحميل المستخرجة ({result.data?.downloadLinks.length})</h4>
                        <div className="space-y-2">
                           {result.data?.downloadLinks.map((s, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5 text-xs hover:border-emerald-500/30 transition-all">
                                <span className="text-slate-200 font-bold truncate pr-4">{s.name}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => handleCopy(s.url)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg"><Copy className="w-4 h-4 text-slate-400" /></button>
                                  <a href={s.url} target="_blank" className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 rounded-lg"><Download className="w-4 h-4 text-emerald-400" /></a>
                                </div>
                             </div>
                           ))}
                           {result.data?.downloadLinks.length === 0 && <p className="text-xs text-slate-600 italic">لا توجد روابط تحميل متاحة.</p>}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
