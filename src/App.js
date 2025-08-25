import React from 'react';
import { Routes, Route,Navigate } from 'react-router-dom';
import DatabaseSelector from './DatabaseSelector';
import DatabaseViewer from './DatabaseViewer';
import { ThemeProvider } from './contexts/themeContext';

function App() {
  return (
    <ThemeProvider>
    <Routes>
      <Route path="/" element={<DatabaseSelector />} />
      <Route path="/viewer/:database" element={<DatabaseViewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ThemeProvider>
  );
}

export default App;
