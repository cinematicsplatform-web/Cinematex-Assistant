
import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Bot, FileSpreadsheet, Zap, Code2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      
      {/* Hero Section */}
      <div className="space-y-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4"
        >
           <Bot className="w-12 h-12 text-indigo-400" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-white"
        >
          مساعد <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">سينماتيكس</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 leading-relaxed"
        >
          منصة متكاملة للمطورين وصناع المحتوى لاستخراج البيانات السينمائية وتصديرها بذكاء.
        </motion.p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4">
        
        {/* Tool 1: AI Extractor (New) */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="h-full group hover:border-purple-500/40 hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3">
               <span className="px-2 py-1 bg-purple-500 text-white text-[10px] font-bold rounded uppercase">AI Powered</span>
             </div>
             <div className="flex flex-col items-start text-right h-full p-2">
               <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                 <Bot className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">محلل المحتوى الذكي</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 استخراج بيانات كاملة (قصة، بوستر، ممثلين، سيرفرات) من كود HTML باستخدام Gemini 2.5 Flash وعرضها بشكل منظم.
               </p>
               <Button 
                 onClick={() => navigate('/ai-extractor')}
                 className="w-full bg-slate-800 hover:bg-purple-600/20 hover:text-purple-300 border border-slate-700"
                 icon={<ArrowRight className="w-4 h-4 ml-2" />}
               >
                 تجربة الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 2: Excel Extractor (Existing) */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
        >
          <Card className="h-full group hover:border-indigo-500/40 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start text-right h-full p-2">
               <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                 <FileSpreadsheet className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">مستخرج الإكسيل</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 أداة سريعة لمعالجة كميات كبيرة من الأكواد واستخراج روابط السيرفرات وتصديرها مباشرة إلى ملف Excel منظم.
               </p>
               <Button 
                 onClick={() => navigate('/extractor')}
                 className="w-full bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700"
                 icon={<Zap className="w-4 h-4 ml-2" />}
               >
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

      </div>

      {/* Stats/Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-white/5 w-full max-w-2xl"
      >
        <div>
          <div className="text-2xl font-bold text-white">∞</div>
          <div className="text-sm text-slate-500">عدد المصادر</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">Gemini 2.5</div>
          <div className="text-sm text-slate-500">الذكاء الاصطناعي</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">JSON/XLSX</div>
          <div className="text-sm text-slate-500">صيغ البيانات</div>
        </div>
      </motion.div>

    </div>
  );
};
