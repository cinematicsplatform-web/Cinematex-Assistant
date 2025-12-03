import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings as SettingsIcon, Save, Key, Type, Eraser, Check } from 'lucide-react';
import { getSettings, saveSettings } from '../services/settings';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [ignoredText, setIgnoredText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load initial settings
    const current = getSettings();
    setSettings(current);
    setIgnoredText(current.ignoredKeywords.join(', '));
  }, []);

  const handleSave = () => {
    // Parse ignored text back to array
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-800 rounded-2xl border border-white/10">
          <SettingsIcon className="w-8 h-8 text-slate-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">إعدادات التطبيق</h1>
          <p className="text-slate-400">تحكم في مفاتيح API وقواعد التسمية لتخصيص الأداة لاحتياجاتك.</p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* Uqload Settings */}
        <Card title="إعدادات Uqload" className="border-t-4 border-t-cyan-500">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                مفتاح API الخاص بحسابك (API Key)
              </label>
              <input 
                type="text" 
                value={settings.uqloadApiKey}
                onChange={(e) => setSettings({...settings, uqloadApiKey: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-mono"
                placeholder="Ex: 150390klo47yxemdrsky1o"
              />
              <p className="text-xs text-slate-500">
                يمكنك الحصول على المفتاح من إعدادات حسابك في Uqload. هذا المفتاح يستخدم لرفع الملفات إلى حسابك.
              </p>
            </div>
          </div>
        </Card>

        {/* Renaming Rules */}
        <Card title="قواعد التسمية (Auto-Rename)" className="border-t-4 border-t-purple-500">
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Type className="w-4 h-4 text-purple-400" />
                بادئة الملف (Prefix)
              </label>
              <input 
                type="text" 
                value={settings.filenamePrefix}
                onChange={(e) => setSettings({...settings, filenamePrefix: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                placeholder="Ex: MySite_"
              />
              <p className="text-xs text-slate-500">
                سيتم إضافة هذه الكلمة في بداية كل ملف يتم نسخه (مثل: Cinematix_MovieName).
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Eraser className="w-4 h-4 text-red-400" />
                كلمات للحذف (Blacklist)
              </label>
              <textarea 
                value={ignoredText}
                onChange={(e) => setIgnoredText(e.target.value)}
                className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                placeholder="EgyBest, Cima4u, ..."
              />
              <p className="text-xs text-slate-500">
                افصل بين الكلمات بفاصلة (,). سيقوم النظام بحذف هذه الكلمات من اسم الملف تلقائياً.
              </p>
            </div>

          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
           <Button 
             onClick={handleSave} 
             className={`w-full md:w-auto min-w-[200px] ${saved ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}
             icon={saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
           >
             {saved ? 'تم الحفظ بنجاح' : 'حفظ التعديلات'}
           </Button>
        </div>

      </div>
    </div>
  );
};
