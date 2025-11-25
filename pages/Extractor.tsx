import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Play, Download, Code2, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { HtmlInput, LogEntry, MediaData } from '../types';
import { generateId, formatTime, cn } from '../lib/utils';
import { parseHtmlContent } from '../services/parser';
import { generateExcelFile } from '../services/excel';
import { motion, AnimatePresence } from 'framer-motion';

export const Extractor: React.FC = () => {
  const [inputs, setInputs] = useState<HtmlInput[]>([{ id: generateId(), content: '' }]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<MediaData[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Auto-scroll logs
  const logsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addInput = () => {
    setInputs([...inputs, { id: generateId(), content: '' }]);
    addLog('تمت إضافة حقل إدخال جديد', 'info');
  };

  const removeInput = (id: string) => {
    if (inputs.length === 1) return;
    setInputs(inputs.filter(i => i.id !== id));
    addLog('تم حذف حقل إدخال', 'info');
  };

  const updateInput = (id: string, content: string) => {
    setInputs(inputs.map(i => i.id === id ? { ...i, content } : i));
  };

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { timestamp: formatTime(), message, type }]);
  };

  const handleProcess = async () => {
    const validInputs = inputs.filter(i => i.content.trim().length > 0);
    
    if (validInputs.length === 0) {
      addLog('خطأ: الرجاء إدخال كود مصدري واحد على الأقل', 'error');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);
    setLogs([]); // Clear previous logs
    addLog('بدء عملية المعالجة...', 'info');

    const processedData: MediaData[] = [];
    const total = validInputs.length;

    try {
      for (let i = 0; i < total; i++) {
        const input = validInputs[i];
        addLog(`جاري معالجة المصدر ${i + 1} من ${total}...`, 'info');
        
        // Call the service (simulated backend logic)
        const data = await parseHtmlContent(input.content, input.id);
        
        processedData.push(data);
        addLog(`تم استخراج: ${data.title} (${data.type})`, 'success');
        addLog(`- تم العثور على ${data.servers.length} سيرفر مشاهدة`, 'info');
        
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      setResults(processedData);
      setShowResults(true);
      addLog('اكتملت المعالجة بنجاح! جاهز للتصدير.', 'success');
    } catch (error) {
      addLog('حدث خطأ غير متوقع أثناء المعالجة', 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (results.length === 0) return;
    addLog('جاري إنشاء ملف الإكسيل...', 'info');
    generateExcelFile(results);
    addLog('تم تنزيل الملف بنجاح', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Code2 className="text-indigo-400" />
            معالجة الكود المصدري
          </h2>
          <p className="text-slate-400 mt-2">
            قم بلصق كود HTML (View Source) للأفلام أو الحلقات ليتم تحليلها.
          </p>
        </div>
        
        {showResults && (
           <Button 
            onClick={handleDownload} 
            className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
            icon={<Download className="w-5 h-5" />}
           >
             تحميل ملف Excel
           </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Input Column */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {inputs.map((input, index) => (
              <motion.div
                key={input.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full">
                      المصدر #{index + 1}
                    </span>
                    {inputs.length > 1 && (
                      <Button 
                        variant="danger" 
                        onClick={() => removeInput(input.id)}
                        className="p-2 h-8 w-8 min-w-0"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <textarea
                    placeholder="<!-- Paste HTML Source Code Here -->"
                    className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y placeholder:text-slate-600"
                    value={input.content}
                    onChange={(e) => updateInput(input.id, e.target.value)}
                    dir="ltr"
                  />
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              onClick={addInput} 
              icon={<Plus className="w-5 h-5" />}
              className="flex-1"
            >
              إضافة مصدر آخر
            </Button>
            
            <Button 
              onClick={handleProcess} 
              isLoading={isProcessing}
              icon={<Play className="w-5 h-5" />}
              className="flex-[2] py-4 text-lg"
            >
              {isProcessing ? 'جاري المعالجة...' : 'بدء المعالجة'}
            </Button>
          </div>
        </div>

        {/* Sidebar: Logs & Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Progress Card */}
          <Card title="حالة العمل" className="min-h-[150px]">
             {isProcessing || progress > 0 ? (
               <div className="space-y-4">
                 <div className="flex justify-between text-sm text-slate-300">
                   <span>التقدم الكلي</span>
                   <span>{progress}%</span>
                 </div>
                 <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                   <div 
                     className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300" 
                     style={{ width: `${progress}%` }}
                   ></div>
                 </div>
                 <p className="text-xs text-center text-slate-500 animate-pulse">
                   {isProcessing ? 'يقوم النظام بتحليل البيانات...' : 'اكتملت العملية'}
                 </p>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center text-slate-500 py-4">
                 <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                 <p className="text-sm">النظام جاهز للعمل</p>
               </div>
             )}
          </Card>

          {/* Logs Terminal */}
          <Card className="flex flex-col h-[400px] bg-black/40 font-mono text-xs">
            <div className="border-b border-white/10 pb-2 mb-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              <span className="mr-2 text-slate-400">System Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {logs.length === 0 && (
                <div className="text-slate-600 italic">No logs generated yet...</div>
              )}
              {logs.map((log, idx) => (
                <div key={idx} className={cn(
                  "border-l-2 pl-2 py-1",
                  log.type === 'error' ? "border-red-500 text-red-400" :
                  log.type === 'success' ? "border-green-500 text-green-400" :
                  "border-indigo-500 text-slate-300"
                )}>
                  <span className="opacity-50 text-[10px] block mb-0.5">{log.timestamp}</span>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </Card>

          {/* Result Summary */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
               <Card className="bg-emerald-900/20 border-emerald-500/30">
                 <div className="flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <div>
                      <h4 className="font-bold">المعالجة ناجحة</h4>
                      <p className="text-xs text-emerald-300/70">تم استخراج {results.length} عنصر</p>
                    </div>
                 </div>
               </Card>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
