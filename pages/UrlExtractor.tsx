
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
  CheckCircle2,
  Copy,
  ExternalLink,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { fetchHtmlWithProxy, cn } from '../lib/utils';
import { AiMediaResponse } from '../types';

export const UrlExtractor: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiMediaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFromHome = params.get('url');
    if (urlFromHome) {
      setUrlInput(urlFromHome);
      handleProcess(urlFromHome);
    }
  }, [location]);

  const handleProcess = async (targetUrl?: string) => {
    const finalUrl = targetUrl || urlInput;
    if (!finalUrl.trim() || !finalUrl.startsWith('http')) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const html = await fetchHtmlWithProxy(finalUrl);
      const result = await analyzeHtmlWithGemini(html);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-4 border border-cyan-500/30"><Globe className="w-12 h-12 text-cyan-400" /></div>
        <h1 className="text-4xl font-bold text-white">المستورد الآلي بالروابط</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">اكتشاف صفحة المشغل والتحميل واستخراج السيرفرات النهائية والملفات الخام.</p>
      </div>

      {!data && (
        <Card className="border-cyan-500/30">
          <div className="space-y-6">
            <div className="relative">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3"><LinkIcon className="w-4 h-4 text-cyan-400" /> رابط الصفحة المصدر</label>
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://site.com/movie..." className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-sm text-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none dir-ltr" />
            </div>
            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3"><AlertTriangle className="w-5 h-5" />{error}</div>}
            <Button onClick={() => handleProcess()} isLoading={loading} className="w-full py-4 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 shadow-xl" icon={!loading ? <Search className="w-5 h-5 ml-2" /> : undefined}>بدء الاستيراد الذكي</Button>
          </div>
        </Card>
      )}

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="flex justify-between items-center">
             <Button variant="ghost" onClick={() => setData(null)} icon={<ChevronLeft className="w-4 h-4" />}>رابط جديد</Button>
             <div className="text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />تم الاستخراج</div>
           </div>

           {/* معاينة الفيديو الخام MP4 */}
           {(data.activeVideoUrl || (data.directSourceLinks && data.directSourceLinks.length > 0)) && (
              <div className="mb-8">
                <Card className="p-0 overflow-hidden bg-black border-cyan-500/30 shadow-2xl">
                  <video src={data.activeVideoUrl || data.directSourceLinks?.[0]?.url} controls className="w-full aspect-video object-contain" poster={data.posterUrl} />
                </Card>
                
                {/* زر التحميل الأحمر المباشر */}
                {(data.mainDownloadButtonUrl || (data.downloadLinks && data.downloadLinks.length > 0)) && (
                  <div className="flex justify-center mt-6">
                    <a href={data.mainDownloadButtonUrl || data.downloadLinks?.[0]?.url} target="_blank" rel="noreferrer" className="px-10 py-4 bg-[#e50914] text-white font-black rounded-lg shadow-2xl transition-all transform hover:scale-105 flex items-center gap-3">
                      <Download className="w-6 h-6" /> تحميل الحلقة مباشرة
                    </a>
                  </div>
                )}
              </div>
           )}

           <Card className="bg-slate-800/40 p-0 overflow-hidden text-right border border-white/10 shadow-2xl">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800">
                <h2 className="text-2xl font-bold text-white mb-1">{data.title}</h2>
                <p className="text-slate-400 text-sm">{data.type === 'Movie' ? 'فيلم' : 'مسلسل'} • {data.year || 'N/A'}</p>
              </div>
              
              <div className="p-6 space-y-8">
                 <div>
                    <h3 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 justify-end uppercase tracking-widest">سيرفرات المشاهدة<Play className="w-4 h-4" /></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.watchServers?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group shadow-sm">
                           <div className="flex gap-2">
                              <button onClick={() => navigator.clipboard.writeText(s.url)} className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:text-white"><Copy className="w-3 h-3" /></button>
                              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs bg-cyan-600/20 text-cyan-400 px-3 py-1.5 rounded-lg hover:text-white"><ExternalLink className="w-3 h-3" /></a>
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
