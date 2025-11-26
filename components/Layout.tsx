import React from 'react';
import { Film, Menu, X, Bot, ExternalLink } from 'lucide-react';
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
    { name: 'المحلل الذكي (AI)', path: '/ai-extractor' },
    { name: 'مستخرج الإكسيل', path: '/extractor' },
    { name: 'موسوعة TMDB', path: 'https://www.themoviedb.org/', external: true },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100 selection:bg-indigo-500/30">
      {/* Decorative background blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 space-x-reverse group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                مساعد سينماتيكس
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 space-x-reverse">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 text-slate-400 hover:text-[#01b4e4] hover:bg-white/5"
                  >
                    {item.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      location.pathname === item.path
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.path === '/ai-extractor' && <Bot className="w-4 h-4" />}
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-[#01b4e4] hover:bg-white/5"
                  >
                    {item.name}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium",
                      location.pathname === item.path
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
};