
import React from 'react';
import { Film, Menu, X, Bot, Settings, Globe, Layers, ListOrdered, LayoutGrid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'الرئيسية', path: '/' },
    { name: 'المستورد الآلي', path: '/url-extractor' },
    { name: 'المستورد الجماعي', path: '/bulk-url-extractor' },
    { name: 'مستخرج الحلقات', path: '/serial-extractor' },
    { name: 'مستخرج الأقسام', path: '/page-extractor' },
    { name: 'المحلل الذكي', path: '/ai-extractor' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100 selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 space-x-reverse group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">مساعد سينماتيكس</span>
            </Link>

            <div className="hidden md:flex items-center space-x-4 space-x-reverse">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", location.pathname === item.path ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                  {item.path === '/url-extractor' && <Globe className="w-4 h-4 text-cyan-400" />}
                  {item.path === '/bulk-url-extractor' && <Layers className="w-4 h-4 text-indigo-400" />}
                  {item.path === '/serial-extractor' && <ListOrdered className="w-4 h-4 text-amber-400" />}
                  {item.path === '/page-extractor' && <LayoutGrid className="w-4 h-4 text-emerald-400" />}
                  {item.path === '/ai-extractor' && <Bot className="w-4 h-4" />}
                  {item.name}
                </Link>
              ))}
              <div className="h-6 w-px bg-white/10 mx-2" />
              <Link to="/settings" className={cn("p-2 rounded-full transition-colors", location.pathname === '/settings' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5")} title="الإعدادات">
                <Settings className="w-5 h-5" />
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)} className={cn("block px-3 py-2 rounded-md text-base font-medium", location.pathname === item.path ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-white/5")}>{item.name}</Link>
              ))}
              <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-400">الإعدادات</Link>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">{children}</main>
    </div>
  );
};
