

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Extractor } from './pages/Extractor';
import { AiExtractor } from './pages/AiExtractor';
import { Cloner } from './pages/Cloner';
import { Guide } from './pages/Guide';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/extractor" element={<Extractor />} />
          <Route path="/ai-extractor" element={<AiExtractor />} />
          <Route path="/cloner" element={<Cloner />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;