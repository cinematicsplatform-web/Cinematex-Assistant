
import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Globe, Layers, ListOrdered, LayoutGrid, Zap } from 'lucide-react';
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
          منصة متكاملة لاستخراج البيانات السينمائية وتصديرها بذكاء إلى ملفات Excel منظمة.
        </motion.p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full max-w-7xl px-4 text-right">
        
        {/* Tool 1: URL Extractor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full group border-cyan-500/30 hover:border-cyan-500/60 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                 <Globe className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">المستورد الآلي</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 استخراج بيانات فيلم أو حلقة واحدة مباشرة عبر الرابط.
               </p>
               <Button onClick={() => navigate('/url-extractor')} className="w-full bg-slate-800 hover:bg-cyan-600/20 hover:text-cyan-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 2: Bulk URL Extractor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full group border-indigo-500/30 hover:border-indigo-500/60 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                 <Layers className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">المستورد الجماعي</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 إدخال مجموعة روابط ومعالجتها دفعة واحدة.
               </p>
               <Button onClick={() => navigate('/bulk-url-extractor')} className="w-full bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 3: Serial Extractor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full group border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                 <ListOrdered className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">مستخرج الحلقات</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 تتبع المسلسل حلقة تلو الأخرى من رابط البداية.
               </p>
               <Button onClick={() => navigate('/serial-extractor')} className="w-full bg-slate-800 hover:bg-amber-600/20 hover:text-amber-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 4: Page Extractor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="h-full group border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                 <LayoutGrid className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">مستخرج الأقسام</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 استخراج كافة الأفلام الموجودة داخل رابط "قسم" كامل.
               </p>
               <Button onClick={() => navigate('/page-extractor')} className="w-full bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 5: Extraction Tool (NEW) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
          <Card className="h-full group border-purple-500/30 hover:border-purple-500/60 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                 <Zap className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">أداة الاستخراج</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 استخراج الحلقات بشكل تتابعي وبدقة عالية بدون AI.
               </p>
               <Button onClick={() => navigate('/extraction-tool')} className="w-full bg-slate-800 hover:bg-purple-600/20 hover:text-purple-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

        {/* Tool 6: AI Extractor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="h-full group hover:border-slate-500/40 hover:bg-slate-800/80 transition-all duration-300">
             <div className="flex flex-col items-start h-full">
               <div className="p-3 rounded-xl bg-white/5 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                 <Bot className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">المحلل الذكي</h3>
               <p className="text-slate-400 text-sm mb-6 flex-1">
                 تحليل يدوي عميق لكود HTML مع استخراج معرض الصور.
               </p>
               <Button onClick={() => navigate('/ai-extractor')} className="w-full bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 border border-slate-700" icon={<ArrowRight className="w-4 h-4 ml-2" />}>
                 فتح الأداة
               </Button>
             </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};
