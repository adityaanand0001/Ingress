import React from 'react';
import { Zap, DatabaseZap, Download, LogOut } from 'lucide-react';
import Button from './Button';
import ThemeToggle from './ThemeToggle';

const Header = ({ selectedTable, handleExport, isExporting, toggleTheme, isDark, navigate }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <Zap className="icon red" />
        <h1 className="app-title">INGRESS 2.0</h1>
        <Button variant="ghost" className="red" onClick={() => navigate('/')}>
          <DatabaseZap className="icon" />
          <span className="button-text">Select Database</span>
        </Button>
      </div>
      <div className='header-middle'>
        <h2 className="main-title">{selectedTable}</h2>
      </div>
      <div className="header-right">
        <Button 
          variant="outline" 
          onClick={handleExport} 
          disabled={!selectedTable || isExporting}
        >
          <Download className="icon" />
          <span className="button-text">{isExporting ? 'Exporting...' : 'Export'}</span>
        </Button>
        <Button variant="ghost" className="red">
          <LogOut className="icon" />
          <span className="button-text">Logout</span>
        </Button>
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

export default Header;

