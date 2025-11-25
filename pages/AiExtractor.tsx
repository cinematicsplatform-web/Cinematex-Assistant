
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Bot, 
  Play, 
  Download, 
  Film, 
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeHtmlWithGemini } from '../services/gemini';
import { AiMediaResponse } from '../types';
import { cn } from '../lib/utils';

// --- Helper Component for Copy Button ---
const CopyButton = ({ text, className, label = "نسخ عنوان الصورة" }: { text: string; className?: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn("transition-all duration-200 group-scope", className)}
      title={label}
    >
      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <LinkIcon className="w-5 h-5" />}
    </button>
  );
};

export const AiExtractor: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiMediaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watch' | 'download' | 'episodes' | 'gallery'>('watch');

  const handleAnalyze = async () => {
    if (!htmlInput.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await analyzeHtmlWithGemini(htmlInput);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('فشل التحليل. تأكد من أن الكود المصدري صالح أو حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Sub-components for Results View ---

  const HeaderSection = ({ data }: { data: AiMediaResponse }) => (
    <div className="relative rounded-3xl overflow-hidden bg-slate-800/50 border border-white/10 p-6 md:p-10 mb-8">
      {/* Background Blur Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        {data.posterUrl && (
          <img src={data.posterUrl} alt="" className="w-full h-full object-cover opacity-10 blur-3xl scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Poster */}
        <div className="w-full md:w-64 flex-shrink-0 group relative">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800 relative">
            {data.posterUrl ? (
              <>
                <img src={data.posterUrl} alt={data.title} className="w-full h-full object-cover" />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                   <a 
                     href={data.posterUrl} 
                     target="_blank" 
                     rel="noreferrer"
                     className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
                     title="عرض الصورة كاملة"
                   >
                     <Eye className="w-6 h-6" />
                   </a>
                   <CopyButton 
                     text={data.posterUrl} 
                     label="نسخ عنوان الصورة (Copy Image Address)"
                     className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
                   />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              data.type === 'Movie' ? "bg-indigo-500/20 text-indigo-300" : "bg-purple-500/20 text-purple-300"
            )}>
              {data.type === 'Movie' ? 'فيلم' : 'مسلسل'}
            </span>
            {data.rating && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold">
                <Star className="w-3 h-3 fill-yellow-400" /> {data.rating}
              </span>
            )}
            {data.year && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                <Calendar className="w-3 h-3" /> {data.year}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            {data.title}
          </h1>
          {data.originalTitle && (
            <h2 className="text-xl text-slate-400 font-light">{data.originalTitle}</h2>
          )}

          <p className="text-slate-300 leading-relaxed text-sm md:text-base max-w-3xl">
            {data.plot || 'لا يوجد وصف متاح.'}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {data.genres?.map((g, i) => (
              <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400">
                {g}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">طاقم العمل</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
              {data.cast?.length > 0 ? data.cast.join(' • ') : 'غير متوفر'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header / Breadcrumb */}
      {!data && (
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl mb-4 border border-indigo-500/30">
            <Bot className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">محلل المحتوى الذكي</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            باستخدام قوة الذكاء الاصطناعي (Gemini 2.5)، نقوم بتحويل كود HTML المعقد إلى بيانات منظمة وروابط مباشرة.
          </p>
        </div>
      )}

      {/* Input Section (Hidden if Data Exists) */}
      <AnimatePresence>
        {!data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="w-full"
          >
            <Card className="border-indigo-500/30 shadow-indigo-500/10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Code2Icon className="w-4 h-4" />
                    كود المصدر (HTML Source Code)
                  </label>
                  {error && (
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {error}
                    </span>
                  )}
                </div>
                
                <textarea
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder="قم بزيارة صفحة الفيلم، اضغط Ctrl+U ثم انسخ الكود والصقه هنا..."
                  className="w-full h-64 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-slate-600"
                  dir="ltr"
                />

                <Button 
                  onClick={handleAnalyze} 
                  isLoading={loading}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-900/20"
                  icon={!loading ? <Bot className="w-5 h-5 ml-2" /> : undefined}
                >
                  {loading ? 'جاري تحليل الكود بواسطة AI...' : 'تحليل واستخراج البيانات'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Top Actions */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => setData(null)} icon={<ChevronLeft className="w-4 h-4" />}>
              تحليل كود آخر
            </Button>
            <div className="text-xs text-slate-500 font-mono">
              Processed by Gemini 2.5 Flash
            </div>
          </div>

          <HeaderSection data={data} />

          {/* Tabs Navigation */}
          <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-1 overflow-x-auto">
            {[
              { id: 'watch', label: 'روابط المشاهدة', icon: Play, count: data.watchServers?.length || 0 },
              { id: 'download', label: 'روابط التحميل', icon: Download, count: data.downloadLinks?.length || 0 },
              ...(data.type === 'Series' ? [{ id: 'episodes', label: 'الحلقات', icon: Layers, count: data.episodes?.length || 0 }] : []),
              { id: 'gallery', label: 'معرض الصور', icon: ImageIcon, count: data.gallery?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "border-indigo-500 text-indigo-400" 
                    : "border-transparent text-slate-400 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[300px]">
            
            {/* Watch Servers */}
            {activeTab === 'watch' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.watchServers?.map((server, idx) => (
                  <Card key={idx} className="hover:bg-slate-800/80 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          <Play className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{server.name}</h4>
                          {server.quality && <span className="text-xs text-slate-500">{server.quality}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(server.url)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg" title="نسخ الرابط">
                          <Copy className="w-4 h-4" />
                        </button>
                        <a href={server.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg" title="فتح الرابط">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
                {(!data.watchServers || data.watchServers.length === 0) && <EmptyState message="لم يتم العثور على روابط مشاهدة" />}
              </div>
            )}

            {/* Download Links */}
            {activeTab === 'download' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.downloadLinks?.map((link, idx) => (
                  <Card key={idx} className="hover:bg-slate-800/80 transition-colors group border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          <Download className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{link.name}</h4>
                          {link.quality && <span className="text-xs text-slate-500">{link.quality}</span>}
                        </div>
                      </div>
                      <a href={link.url} target="_blank" rel="noreferrer" className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </Card>
                ))}
                {(!data.downloadLinks || data.downloadLinks.length === 0) && <EmptyState message="لم يتم العثور على روابط تحميل" />}
              </div>
            )}

            {/* Episodes (Series Only) */}
            {activeTab === 'episodes' && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.episodes?.map((ep, idx) => (
                  <a key={idx} href={ep.url || '#'} target="_blank" className="block group">
                    <div className="bg-slate-800 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all">
                      <div className="aspect-video bg-slate-900 relative">
                        {ep.thumbnail ? (
                          <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                             <Tv className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-indigo-400 font-bold mb-1">الحلقة {ep.number}</div>
                        <div className="text-sm text-white truncate">{ep.title || `Episode ${ep.number}`}</div>
                      </div>
                    </div>
                  </a>
                ))}
                {(!data.episodes || data.episodes.length === 0) && <EmptyState message="لم يتم العثور على حلقات" />}
              </div>
            )}

            {/* Gallery */}
            {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.gallery?.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 group relative shadow-lg">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Gallery Item Overlay */}
                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-sm">
                      <a 
                        href={img} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                        title="فتح الصورة في لسان جديد"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <CopyButton 
                        text={img} 
                        label="نسخ عنوان الصورة (Copy Image Address)"
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                      />
                    </div>
                  </div>
                ))}
                {(!data.gallery || data.gallery.length === 0) && <EmptyState message="لا توجد صور إضافية" />}
              </div>
            )}

          </div>
        </motion.div>
      )}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
    <RefreshCw className="w-8 h-8 mb-3 opacity-50" />
    <p>{message}</p>
  </div>
);

// Helper Icon
const Code2Icon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" />
  </svg>
);
