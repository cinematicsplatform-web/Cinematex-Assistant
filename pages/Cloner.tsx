
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Copy, RefreshCw, CheckCircle, XCircle, AlertCircle, ClipboardList, Loader2, FileClock } from 'lucide-react';
import { CloneResult } from '../types';
import { cloneUqloadLink, fetchAccountHistory } from '../services/uqload';
import { generateClonerExcel, generateHistoryExcel } from '../services/excel';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export const Cloner: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<CloneResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStartCloning = async () => {
    const links = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (links.length === 0) {
      alert("الرجاء إدخال روابط أولاً");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // 1. Initialize all rows as "Pending" immediately
    const initialResults: CloneResult[] = links.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      originalUrl: url,
      status: 'pending'
    }));
    
    setResults(initialResults);

    // 2. Process strictly sequentially (Loop)
    for (let i = 0; i < links.length; i++) {
      const currentItem = initialResults[i];
      const url = links[i];
      
      try {
        // Call the service (Synchronous await ensures we don't move to next until this finishes)
        const response = await cloneUqloadLink(url);
        
        // Update state for this specific row
        setResults(prev => {
            const newArr = [...prev];
            newArr[i] = { 
                ...response, 
                id: currentItem.id // Preserve the ID
            };
            return newArr;
        });

      } catch (error) {
        // Fallback error handling
        setResults(prev => {
            const newArr = [...prev];
            newArr[i] = { 
                id: currentItem.id,
                originalUrl: url,
                status: 'failed',
                message: 'Unknown Error'
            };
            return newArr;
        });
      }
      
      // Update progress
      setProgress(Math.round(((i + 1) / links.length) * 100));

      // 3. Optional: Add a small delay between requests to be gentle on the API
      if (i < links.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsProcessing(false);
    alert('تم الانتهاء من معالجة القائمة!');
  };

  const handleExport = () => {
    if (results.length === 0) return;
    generateClonerExcel(results);
  };

  const handleFetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await fetchAccountHistory();
      if (data && data.length > 0) {
        generateHistoryExcel(data);
        alert(`تم استيراد وتصدير ${data.length} ملف بنجاح!`);
      } else {
        alert('لم يتم العثور على ملفات حديثة.');
      }
    } catch (error: any) {
      console.error(error);
      alert(`حدث خطأ أثناء جلب التاريخ: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed' || r.status === 'skipped').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <RefreshCw className="text-cyan-400" />
            الناسخ الجماعي (Uqload Cloner)
          </h2>
          <p className="text-slate-400 mt-2">
            نظام تتابعي دقيق: يقوم بنسخ الرابط، الانتظار، ثم جلب الكود الصحيح لضمان عدم تداخل البيانات.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full flex flex-col">
            <div className="mb-4 flex items-center gap-2 text-slate-300">
               <ClipboardList className="w-5 h-5 text-indigo-400" />
               <span className="font-semibold">قائمة الروابط</span>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`https://uqload.co/v/xxxxx\nhttps://uqload.co/v/yyyyy\n...`}
              className="flex-1 w-full min-h-[300px] bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none placeholder:text-slate-600 mb-4"
              dir="ltr"
              disabled={isProcessing}
            />
            
            <div className="space-y-3">
              <Button 
                onClick={handleStartCloning} 
                isLoading={isProcessing}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                icon={<RefreshCw className="w-4 h-4 ml-2" />}
              >
                {isProcessing ? `جاري النسخ (${progress}%)` : 'بدء النسخ المتتابع'}
              </Button>
              
              {results.length > 0 && !isProcessing && (
                <Button 
                  onClick={handleExport} 
                  variant="secondary"
                  className="w-full bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border-emerald-500/30"
                  icon={<Download className="w-4 h-4 ml-2" />}
                >
                  تصدير إلى Excel
                </Button>
              )}

              {/* New History Import Button */}
              <div className="pt-4 border-t border-slate-700/50 mt-2">
                <Button 
                  onClick={handleFetchHistory} 
                  isLoading={isHistoryLoading}
                  disabled={isProcessing}
                  variant="ghost"
                  className="w-full bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 border border-purple-500/30"
                  icon={<FileClock className="w-4 h-4 ml-2" />}
                >
                  📥 استيراد آخر 30 ملف من حسابي
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-800/50 flex items-center gap-3">
                 <div className="p-2 rounded-full bg-slate-700 text-slate-300">
                   <ClipboardList className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-xl font-bold text-white">{results.length}</div>
                   <div className="text-xs text-slate-500">الإجمالي</div>
                 </div>
              </Card>
              <Card className="p-4 bg-emerald-900/10 border-emerald-500/20 flex items-center gap-3">
                 <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                   <CheckCircle className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-xl font-bold text-emerald-400">{successCount}</div>
                   <div className="text-xs text-emerald-500/70">ناجح</div>
                 </div>
              </Card>
              <Card className="p-4 bg-red-900/10 border-red-500/20 flex items-center gap-3">
                 <div className="p-2 rounded-full bg-red-500/10 text-red-400">
                   <XCircle className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-xl font-bold text-red-400">{failedCount}</div>
                   <div className="text-xs text-red-500/70">فشل</div>
                 </div>
              </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden p-0 min-h-[400px] flex flex-col">
              <div className="bg-slate-900/50 border-b border-white/5 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">الرابط الأصلي</div>
                <div className="col-span-2 text-center">الحالة</div>
                <div className="col-span-5">الرابط الجديد</div>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                {results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8">
                    <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
                    <p>النتائج ستظهر هنا...</p>
                  </div>
                ) : (
                  results.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-sm items-center hover:bg-white/5 transition-colors",
                        item.status === 'failed' ? "bg-red-500/5" : 
                        item.status === 'success' ? "bg-emerald-500/5" : 
                        item.status === 'pending' ? "bg-indigo-500/5" : ""
                      )}
                    >
                      <div className="col-span-1 text-center text-slate-500 text-xs">{idx + 1}</div>
                      
                      <div className="col-span-4 truncate text-slate-400 font-mono text-xs" title={item.originalUrl}>
                        {item.originalUrl}
                      </div>
                      
                      <div className="col-span-2 flex justify-center">
                         {item.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                         {item.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                         {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                         {item.status === 'skipped' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                      </div>
                      
                      <div className="col-span-5">
                        {item.status === 'success' && item.watchUrl ? (
                          <div className="flex items-center gap-2">
                            <input 
                              readOnly 
                              value={item.watchUrl} 
                              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-emerald-300 w-full font-mono truncate"
                            />
                            <button 
                              onClick={() => navigator.clipboard.writeText(item.watchUrl || '')}
                              className="text-slate-400 hover:text-white"
                              title="نسخ"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            {item.status === 'pending' ? 'جاري المعالجة...' : (item.message || '-')}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>

        </div>
      </div>
    </div>
  );
};
