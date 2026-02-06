
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Bot, 
  Play, 
  Download, 
  Tv, 
  Star, 
  Calendar, 
  Image as ImageIcon, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Layers,
  Eye,
  Link as LinkIcon,
  Check,
  Clock,
  FileText,
  LayoutGrid,
  Music,
  Video,
  Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';

const CopyButton = ({ text, className, label = "نسخ الرابط" }: { text: string; className?: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={cn("transition-all duration-200", className)} title={label}>
      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <LinkIcon className="w-5 h-5" />}
    </button>
  );
};

export const AiExtractor: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiMediaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watch' | 'download' | 'direct' | 'episodes' | 'gallery' | 'thumbnails'>('watch');

  const handleAnalyze = async () => {
    if (!htmlInput.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await analyzeHtmlWithGemini(htmlInput);
      setData(result);
      if ((!result.watchServers || result.watchServers.length === 0) && (result.directSourceLinks && result.directSourceLinks.length > 0)) {
        setActiveTab('direct');
      }
    } catch (err) {
      setError('فشل التحليل. تأكد من صحة كود HTML.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const HeaderSection = ({ data }: { data: AiMediaResponse }) => (
    <div className="relative rounded-3xl overflow-hidden bg-slate-800/50 border border-white/10 p-6 md:p-10 mb-8">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        {data.posterUrl && <img src={data.posterUrl} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent" />
      </div>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 flex-shrink-0 group relative">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800 relative">
            {data.posterUrl ? (
              <>
                <img src={data.posterUrl} alt={data.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                   <a href={data.posterUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"><Eye className="w-6 h-6" /></a>
                   <CopyButton text={data.posterUrl} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon className="w-16 h-16" /></div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", data.type === 'Movie' ? "bg-indigo-500/20 text-indigo-300" : "bg-purple-500/20 text-purple-300")}>
              {data.type === 'Movie' ? 'فيلم' : 'مسلسل'}
            </span>
            {data.rating && <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold"><Star className="w-3 h-3 fill-yellow-400" /> {data.rating}</span>}
            {data.year && <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs"><Calendar className="w-3 h-3" /> {data.year}</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{data.title}</h1>
          {data.originalTitle && <h2 className="text-xl text-slate-400 font-light">{data.originalTitle}</h2>}
          <p className="text-slate-300 leading-relaxed text-sm md:text-base max-w-3xl">{data.plot || 'لا يوجد وصف متاح.'}</p>
          <div className="flex flex-wrap gap-2 pt-2">{data.genres?.map((g, i) => <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400">{g}</span>)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {!data && (
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-4 border border-indigo-500/30"><Bot className="w-12 h-12 text-indigo-400" /></div>
          <h1 className="text-4xl font-bold text-white">محلل المحتوى الذكي</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">تحويل كود HTML إلى بيانات منظمة وروابط مباشرة.</p>
        </div>
      )}
      <AnimatePresence>
        {!data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
            <Card className="border-indigo-500/30">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2"><FileText className="w-4 h-4" /> كود المصدر (HTML Source)</label>
                <textarea value={htmlInput} onChange={(e) => setHtmlInput(e.target.value)} placeholder="Ctrl+U -> Copy -> Paste Here" className="w-full h-64 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" dir="ltr" />
                <Button onClick={handleAnalyze} isLoading={loading} className="w-full py-4 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl" icon={!loading ? <Bot className="w-5 h-5 ml-2" /> : undefined}>بدء الاستخراج العميق</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => setData(null)} icon={<ChevronLeft className="w-4 h-4" />}>تحليل كود آخر</Button>
            <div className="text-xs text-slate-500 font-mono">Processed by Gemini 3</div>
          </div>

          {/* معاينة الفيديو المباشر المستخرج */}
          {(data.activeVideoUrl || (data.directSourceLinks && data.directSourceLinks.length > 0)) && (
            <div className="mb-8">
              <Card className="p-0 overflow-hidden bg-black border-indigo-500/30 relative shadow-2xl">
                 <div className="absolute top-4 left-4 z-20">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1.5">
                       <Video className="w-3 h-3" />
                       Direct Video File Detected
                    </span>
                 </div>
                 <video src={data.activeVideoUrl || data.directSourceLinks?.[0]?.url} controls className="w-full aspect-video bg-black object-contain" poster={data.posterUrl} />
              </Card>
              
              {/* زر التحميل الأحمر المباشر */}
              {(data.mainDownloadButtonUrl || (data.downloadLinks && data.downloadLinks.length > 0)) && (
                <div className="flex justify-center mt-6">
                   <a href={data.mainDownloadButtonUrl || data.downloadLinks?.[0]?.url} target="_blank" rel="noreferrer" className="px-10 py-4 bg-[#e50914] hover:bg-[#b20710] text-white font-black rounded-lg shadow-2xl transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 uppercase tracking-wider">
                     <Download className="w-6 h-6" /> تحميل الحلقة مباشرة
                   </a>
                </div>
              )}
            </div>
          )}

          <HeaderSection data={data} />

          <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
            {[
              { id: 'watch', label: 'المشاهدة', icon: Play, count: data.watchServers?.length || 0 },
              { id: 'download', label: 'التحميل', icon: Download, count: data.downloadLinks?.length || 0 },
              { id: 'direct', label: 'ملفات MP4', icon: Video, count: data.directSourceLinks?.length || 0 },
              { id: 'episodes', label: 'الحلقات', icon: Layers, count: data.episodes?.length || 0 },
              { id: 'gallery', label: 'المعرض', icon: ImageIcon, count: data.gallery?.length || 0 },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap", activeTab === tab.id ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white")}>
                <tab.icon className="w-4 h-4" /><span className="font-medium">{tab.label}</span><span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'watch' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.watchServers?.map((s, idx) => (
                  <Card key={idx} className="hover:bg-slate-800/80 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all"><Play className="w-5 h-5" /></div>
                        <div><h4 className="font-bold text-white text-sm">{s.name}</h4>{s.quality && <span className="text-xs text-slate-500">{s.quality}</span>}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(s.url)} className="p-2 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
                        <a href={s.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white"><ExternalLink className="w-4 h-4" /></a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {/* ... بقية الأقسام بنفس الطريقة ... */}
          </div>
        </motion.div>
      )}
    </div>
  );
};
const EmptyState = ({ message }: { message: string }) => (
  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
    <RefreshCw className="w-8 h-8 mb-3 opacity-50" /><p>{message}</p>
  </div>
);
