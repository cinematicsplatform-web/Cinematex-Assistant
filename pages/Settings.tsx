
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Settings as SettingsIcon, 
  Save, 
  Key, 
  Type, 
  Eraser, 
  Check, 
  Cpu, 
  Database, 
  FileCode2,
  Lock,
  Zap,
  LayoutGrid,
  BookOpen
} from 'lucide-react';
import { getSettings, saveSettings } from '../services/settings';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [ignoredText, setIgnoredText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getSettings();
    setSettings(current);
    setIgnoredText(current.ignoredKeywords.join(', '));
  }, []);

  const handleSave = () => {
    const ignoredArray = ignoredText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newSettings = {
      ...settings,
      ignoredKeywords: ignoredArray
    };

    saveSettings(newSettings);
    setSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between bg-slate-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">لوحة التحكم والإعدادات</h1>
            <p className="text-slate-400 mt-1">تخصيص قواعد الأتمتة، والربط البرمجي.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/guide')} 
            variant="secondary"
            className="shadow-lg border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
            icon={<BookOpen className="w-5 h-5" />}
          >
            دليل الاستخدام
          </Button>
          <Button 
            onClick={handleSave} 
            className={`min-w-[180px] shadow-lg transition-all transform hover:scale-105 ${saved ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-indigo-600 shadow-indigo-600/20'}`}
            icon={saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          >
            {saved ? 'تم الحفظ' : 'حفظ كافة التغييرات'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* API & Security Section */}
        <div className="space-y-8">
          <Card className="border-t-4 border-t-purple-500 overflow-visible">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">إعدادات الاتصال والـ API</h2>
            </div>
            
            <div className="space-y-6">
              {/* Uqload API Key */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  مفتاح Uqload API (الناسخ الجماعي)
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={settings.uqloadApiKey}
                    onChange={(e) => setSettings({...settings, uqloadApiKey: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
                    placeholder="API Key من حساب Uqload"
                  />
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">تحسين الأداء (Concurrency)</h2>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">سرعة المعالجة المتوازية</span>
                    <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">3 طلبات / ثانية</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    ملاحظة: النظام مهيأ حالياً بحد أقصى 3 طلبات متزامنة لتجنب حظر الـ Proxy وحماية حصة Gemini API من النفاد السريع.
                  </p>
               </div>
            </div>
          </Card>
        </div>

        {/* Branding & Filtering Section */}
        <div className="space-y-8">
          <Card className="border-t-4 border-t-indigo-500 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">قواعد إعادة التسمية والفلترة</h2>
            </div>
            
            <div className="space-y-6">
              {/* Prefix */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  بادئة الملفات (Filename Prefix)
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={settings.filenamePrefix}
                    onChange={(e) => setSettings({...settings, filenamePrefix: e.target.value})}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="مثال: Cinematix_"
                  />
                  <FileCode2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>

              {/* Blacklist */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-red-400" />
                  الكلمات المحظورة (Blacklist)
                </label>
                <textarea 
                  value={ignoredText}
                  onChange={(e) => setIgnoredText(e.target.value)}
                  className="w-full h-48 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-300 focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none font-mono"
                  placeholder="افصل بين الكلمات بفاصلة (,) ..."
                />
                <div className="flex items-start gap-2 p-3 bg-red-500/5 rounded-xl border border-red-500/10 mt-2">
                  <Cpu className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300/60 leading-relaxed">
                    سيقوم محرك "الناسخ الجماعي" بالبحث عن هذه الكلمات في أسماء الملفات الأصلية وحذفها فوراً لضمان اسم ملف نظيف واحترافي.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
           <p className="text-xs text-slate-400">يستخدم النظام محرك Gemini 3 المتطور لتحليل البيانات تلقائياً.</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">2</div>
           <p className="text-xs text-slate-400">استخدم بادئة واضحة لسهولة البحث عن ملفاتك في Uqload.</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">3</div>
           <p className="text-xs text-slate-400">تواصل مع الدعم الفني في حال واجهت أي مشاكل في الـ Proxy.</p>
        </div>
      </div>

    </div>
  );
};
