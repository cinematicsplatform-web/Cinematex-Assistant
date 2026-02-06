
import React from 'react';
import { Card } from '../components/ui/Card';
import { 
  Bot, 
  RefreshCw, 
  FileSpreadsheet, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  Globe, 
  Layers, 
  ListOrdered, 
  LayoutGrid,
  Zap,
  PlayCircle,
  DownloadCloud,
  ArrowRightCircle,
  SearchCode
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Guide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white">دليل الأدوات الشامل</h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          تعرف على كيفية عمل محركات "سينماتيكس" الذكية لاستخراج البيانات وتنظيم المحتوى السينمائي باحترافية.
        </p>
      </div>

      {/* 1. Automated Importer (المستورد الآلي) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">1. المستورد الآلي (Automated Importer)</h2>
            <p className="text-slate-400">استخراج ذكي لفيلم أو حلقة واحدة عبر الرابط المباشر.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-cyan-500/20">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> آلية العمل</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              يقوم النظام بجلب محتوى HTML الخاص بالرابط عبر "بروكسي" لتجاوز الحظر، ثم يحلله بواسطة AI. إذا وجد النظام أن السيرفرات موجودة في صفحة "مشغل" أو "تحميل" منفصلة، يقوم بالانتقال إليها تلقائياً واستخراج الروابط النهائية.
            </p>
          </Card>
          <Card className="border-cyan-500/20">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><SearchCode className="w-4 h-4 text-cyan-400" /> المدخلات والمخرجات</h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><ArrowRightCircle className="w-3 h-3" /> <b>المدخل:</b> رابط صفحة واحدة (URL).</li>
              <li className="flex items-center gap-2"><ArrowRightCircle className="w-3 h-3" /> <b>المخرج:</b> بطاقة معلومات تحتوي على روابط المشاهدة والتحميل النهائية.</li>
            </ul>
          </Card>
        </div>
      </motion.section>

      {/* 2. Group Importer (المستورد الجماعي) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">2. المستورد الجماعي (Group Importer)</h2>
            <p className="text-slate-400">معالجة دفعات ضخمة من الروابط في وقت قياسي.</p>
          </div>
        </div>
        <Card>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">التوازي البرمجي</h4>
              <p className="text-xs text-slate-400">يعالج النظام 3 روابط في نفس الوقت (Concurrency) لضمان السرعة مع حماية حصة الـ API من النفاد.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">سير العمل</h4>
              <p className="text-xs text-slate-400">يتم إدخال قائمة روابط، يقوم النظام بجدولتها، ثم يعرض النتائج الناجحة والفاشلة في جدول تفاعلي.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">التصدير</h4>
              <p className="text-xs text-slate-400">بعد الانتهاء، يمكنك تصدير جميع العناصر الناجحة إلى ملف Excel واحد منظم بضغطة زر.</p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* 3. Segment Extractor (مستخرج الحلقات) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
            <ListOrdered className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">3. مستخرج الحلقات (Segment Extractor)</h2>
            <p className="text-slate-400">أتمتة استخراج مسلسل كامل من رابط البداية فقط.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-amber-500/20">
             <h3 className="font-bold text-white mb-3">كيف يعمل التتبع؟</h3>
             <p className="text-sm text-slate-400 leading-relaxed">
               أدخل رابط "الحلقة الأولى". يقوم النظام بتحليلها، ثم يبحث ذكاء AI عن زر "الحلقة التالية". إذا وجده، يقوم بالانتقال إليه آلياً وتكرار العملية حتى ينتهي المسلسل أو تضغط على "إيقاف".
             </p>
          </Card>
          <Card className="border-amber-500/20">
             <h3 className="font-bold text-white mb-3">لماذا هو مميز؟</h3>
             <ul className="text-xs text-slate-400 space-y-2">
               <li><CheckCircle2 className="w-3 h-3 text-emerald-500 inline ml-1" /> لا تحتاج للبحث عن روابط الحلقات يدوياً.</li>
               <li><CheckCircle2 className="w-3 h-3 text-emerald-500 inline ml-1" /> يتعرف على ترتيب الموسم والحلقة تلقائياً من اسم الصفحة.</li>
               <li><CheckCircle2 className="w-3 h-3 text-emerald-500 inline ml-1" /> يجمع الحلقات في شيت Excel واحد مرتب تصاعدياً.</li>
             </ul>
          </Card>
        </div>
      </motion.section>

      {/* 4. Section Extractor (مستخرج الأقسام) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">4. مستخرج الأقسام (Section Extractor)</h2>
            <p className="text-slate-400">تفريغ محتوى "قسم" كامل (مثل قسم أفلام 2024) دفعة واحدة.</p>
          </div>
        </div>
        <Card className="bg-emerald-900/10 border-emerald-500/20">
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1">
               <h4 className="font-bold text-white mb-2">مرحلة الفرز الذكي</h4>
               <p className="text-sm text-slate-400">يقوم AI بمسح صفحة القسم واستخراج روابط "التفاصيل" فقط، متجاهلاً روابط الأقسام الأخرى أو الروابط الاجتماعية.</p>
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-white mb-2">المعالجة الكلية</h4>
               <p className="text-sm text-slate-400">بعد تحديد الروابط (عادة 20-30 رابط في الصفحة)، يبدأ النظام بمعالجتها واحداً تلو الآخر واستخراج كافة سيرفراتها.</p>
             </div>
          </div>
        </Card>
      </motion.section>

      {/* 5. Smart Analyzer (المحلل الذكي) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">5. المحلل الذكي (Smart Analyzer)</h2>
            <p className="text-slate-400">التحليل اليدوي العميق لأكواد HTML واستخراج البيانات الوصفية.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Code className="w-5 h-5 text-purple-400" /> طريقة الاستخدام</h3>
              <p className="text-sm text-slate-400">
                هذه الأداة مخصصة للحالات التي يفشل فيها الجلب الآلي. قم بنسخ كود المصدر (Ctrl+U) ولصقه يدوياً.
              </p>
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-2">
                <div className="text-xs text-indigo-300 font-bold">البيانات المستخرجة:</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 uppercase">
                  <span>• القصة (Plot)</span>
                  <span>• البوستر (Poster)</span>
                  <span>• التقييم (Rating)</span>
                  <span>• الممثلين (Cast)</span>
                  <span>• معرض الصور (Gallery)</span>
                  <span>• روابط السيرفرات</span>
                </div>
              </div>
           </div>
           <Card className="bg-slate-900/60 border-dashed border-slate-700">
              <h3 className="font-bold text-white mb-4">هيكل المخرجات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يتم عرض النتائج في واجهة سينمائية تفاعلية مقسمة إلى تبويبات:
                <br/><br/>
                <b>1. المشاهدة:</b> جميع المشغلات المتاحة.
                <br/>
                <b>2. التحميل:</b> جميع الروابط المباشرة.
                <br/>
                <b>3. معرض الصور:</b> استخراج جميع صور الفيلم الموجودة في الكود لتسهيل تصميم البوسترات.
              </p>
           </Card>
        </div>
      </motion.section>

      <div className="pt-10 flex justify-center">
         <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3 text-indigo-300 text-sm font-bold">
           <Info className="w-5 h-5" /> ملاحظة: جميع البيانات المستخرجة من أي أداة يمكن تجميعها وتصديرها لملف Excel منظم.
         </div>
      </div>

    </div>
  );
};
