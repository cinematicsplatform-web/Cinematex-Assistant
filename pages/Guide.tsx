
import React from 'react';
import { Card } from '../components/ui/Card';
import { Bot, RefreshCw, FileSpreadsheet, Info, CheckCircle2, AlertTriangle, Code, ArrowLeft, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Guide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white">دليل الاستخدام الشامل</h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          كل ما تحتاج معرفته عن أدوات مساعد سينماتيكس: كيفية استخراج البيانات، نسخ الروابط تلقائياً، وتصدير الملفات باحترافية.
        </p>
      </div>

      {/* Section 1: AI Extractor */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">1. المحلل الذكي (AI Extractor)</h2>
            <p className="text-slate-400">تحليل الصفحات واستخراج البيانات الوصفية باستخدام Gemini 2.5</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="h-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              كيف يعمل؟
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              هذه الأداة لا تعتمد على قواعد برمجية جامدة (Regex) بل تستخدم الذكاء الاصطناعي لقراءة كود HTML وفهمه كما يفهمه المبرمج المحترف.
            </p>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>يستخرج: القصة، البوستر، التقييم، سنة الإصدار، النوع (فيلم/مسلسل).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>يستخرج جميع السيرفرات (المشاهدة والتحميل) مع الجودة.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span><b>الميزة القوية:</b> يستخرج "معرض الصور" (Gallery)، أي صورة في الكود يتم جلبها، مما يوفر عليك عناء البحث عن صور.</span>
              </li>
            </ul>
          </Card>

          <Card className="h-full bg-slate-900/40 border-dashed border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-yellow-400" />
              طريقة الحصول على الكود (Source Code)
            </h3>
            <ol className="space-y-4 text-sm text-slate-300 list-decimal list-inside">
              <li className="p-2 bg-slate-800 rounded-lg">افتح صفحة الفيلم أو الحلقة في المتصفح.</li>
              <li className="p-2 bg-slate-800 rounded-lg">
                اضغط بزر الفأرة الأيمن في أي مكان فارغ واختر <br/>
                <span className="font-mono text-yellow-300">View Page Source</span> أو اضغط <span className="font-mono text-yellow-300">Ctrl + U</span>.
              </li>
              <li className="p-2 bg-slate-800 rounded-lg">حدد الكل (<span className="font-mono">Ctrl + A</span>) ثم انسخ (<span className="font-mono">Ctrl + C</span>).</li>
              <li className="p-2 bg-slate-800 rounded-lg">الصق الكود في الأداة واضغط "تحليل".</li>
            </ol>
          </Card>
        </div>
      </motion.section>

      {/* Section 2: Cloner */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">2. الناسخ الجماعي (Mass Cloner)</h2>
            <p className="text-slate-400">نقل ملفات Uqload إلى حسابك + إعادة التسمية التلقائية.</p>
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
              <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-2">
                 <Wand2 className="w-4 h-4" />
                 نظام إعادة التسمية الذكي (Smart Renaming)
              </h4>
              <p className="text-sm text-slate-300 mb-2">
                يقوم النظام تلقائياً بتنظيف اسم الملف أثناء عملية النسخ:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 font-mono bg-black/20 p-3 rounded">
                <li>إزالة أسماء المنافسين: [EgyBest], Cima4u, Akwam, Cima Now CoM, etc.</li>
                <li>إزالة الأقواس والرموز الزائدة.</li>
                <li>إضافة بادئة <b>Cinematix_</b> لتوحيد الهوية.</li>
                <li className="text-green-400 mt-1">مثال: [EgyBest] Spider-Man -> Cinematix_Spider-Man</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-bold text-white mb-2">آلية النسخ التتابعي:</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  النظام لا يقوم برفع الروابط عشوائياً. بل يعالج الرابط تلو الآخر:
                  1. يرسل طلب النسخ.
                  2. ينتظر رد السيرفر.
                  3. إذا لم يجد الكود فوراً، ينتظر 10 ثوانٍ ثم يبحث في قائمة ملفاتك للتأكد.
                  4. يقوم بإعادة التسمية فوراً قبل الانتقال للملف التالي.
                </p>
              </div>
              <div>
                 <h4 className="font-bold text-white mb-2">مميزات إضافية:</h4>
                 <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                   <li><b>سجل المحفوظات:</b> يتم حفظ الروابط الجديدة في متصفحك تلقائياً.</li>
                   <li><b>استعادة البيانات:</b> زر "استيراد آخر 30 ملف" يعيد لك الروابط حتى لو أغلقت الصفحة.</li>
                   <li><b>تصدير Excel:</b> ملف منظم يحتوي على الروابط الأصلية والجديدة.</li>
                 </ul>
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Section 3: Excel Extractor */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">3. مستخرج الإكسيل (Batch Extractor)</h2>
            <p className="text-slate-400">تحليل كميات ضخمة من الأكواد وتجميعها في ملف واحد.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="col-span-1 border-l-4 border-l-indigo-500">
            <h3 className="font-bold text-white mb-2">التجميع التلقائي للمسلسلات</h3>
            <p className="text-sm text-slate-400">
              إذا قمت بإدخال أكواد لـ 5 حلقات من "مسلسل المؤسس عثمان" و 3 حلقات من "Game of Thrones"، سيقوم النظام بإنشاء:
              <br/>- شيت Excel للمؤسس عثمان.
              <br/>- شيت Excel لـ GoT.
              <br/>ويرتب الحلقات (S01E01) داخلهم تلقائياً.
            </p>
          </Card>
          
          <Card className="col-span-1 border-l-4 border-l-indigo-500">
             <h3 className="font-bold text-white mb-2">معالجة الأخطاء</h3>
             <p className="text-sm text-slate-400">
               إذا فشل النظام في تحليل كود معين، لن يتوقف البرنامج. سيتم تسجيل الخطأ في السجل (Log) والاستمرار في الملفات التالية، مما يجعله مثالياً للعمليات الكبيرة.
             </p>
          </Card>

          <Card className="col-span-1 border-l-4 border-l-indigo-500">
             <h3 className="font-bold text-white mb-2">تنسيق التصدير</h3>
             <p className="text-sm text-slate-400">
               الملف الناتج يحتوي على أعمدة ثابتة:
               <br/>- اسم الفيلم / الحلقة
               <br/>- 8 أعمدة للسيرفرات
               <br/>- 2 أعمدة للتحميل
               <br/>جاهز للاستخدام المباشر.
             </p>
          </Card>
        </div>
      </motion.section>

      {/* Footer Warning */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
        <div>
          <h4 className="font-bold text-yellow-500">تنويه هام</h4>
          <p className="text-sm text-yellow-200/70">
            هذا التطبيق يعمل بشكل (Client-Side) في معظمه، ولكن عمليات الذكاء الاصطناعي ونسخ الروابط تتطلب اتصالاً بالإنترنت. تأكد من أن مفتاح API الخاص بـ Gemini ومفتاح Uqload صالحين للعمل.
          </p>
        </div>
      </div>

    </div>
  );
};
