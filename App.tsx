
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AiExtractor } from './pages/AiExtractor';
import { UrlExtractor } from './pages/UrlExtractor';
import { BulkUrlExtractor } from './pages/BulkUrlExtractor';
import { SerialExtractor } from './pages/SerialExtractor';
import { PageExtractor } from './pages/PageExtractor';
import { ExtractionTool } from './pages/ExtractionTool';
import { Settings } from './pages/Settings';
import { Guide } from './pages/Guide';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ai-extractor" element={<AiExtractor />} />
          <Route path="/url-extractor" element={<UrlExtractor />} />
          <Route path="/bulk-url-extractor" element={<BulkUrlExtractor />} />
          <Route path="/serial-extractor" element={<SerialExtractor />} />
          <Route path="/page-extractor" element={<PageExtractor />} />
          <Route path="/extraction-tool" element={<ExtractionTool />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
