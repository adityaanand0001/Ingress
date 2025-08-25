import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './selector.css';

import Card from './components/Card'
import Button from './components/Button';
import Input from './components/Input';
import ThemeToggle from './components/ThemeToggle';

import { CloudLightning, DatabaseZap, Search, Table,LoaderCircle} from 'lucide-react'
import { LightningBoltIcon } from '@radix-ui/react-icons'

export default function EnhancedDatabaseSelector() {
  const [databases, setDatabases] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null); // Updated: Changed to hoveredCard
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setIsDark(prefersLight);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    document.body.className = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/routers/`)
      .then((response) => response.json())
      .then((data) => {
        setDatabases(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
        alert('Failed to fetch databases. Please try again.');
      });
  }, []);

  const handleDatabaseSelect = (dbName, selectedTable = null) => {
    console.log(`Selected database: ${dbName}, Selected table: ${selectedTable}`);
    navigate(`/viewer/${dbName}`, { state: { selectedTable } });
  };

  const highlightMatch = (text, searchTerm) => {
    if (!text || !searchTerm?.trim()) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="highlighty">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getSearchResults = useCallback(() => {
    if (!searchTerm.trim()) return [];

    const results = [];

    // Add database matches
    databases.forEach(db => {
      if (db.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          type: 'database',
          name: db.name,
          tables: db.tables
        });
      }
    });

    // Add table matches
    databases.forEach(db => {
      db.tables.forEach(table => {
        if (table.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            type: 'table',
            name: table,
            database: db.name
          });
        }
      });
    });

    return results;
  }, [searchTerm, databases]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const searchResults = getSearchResults();

  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    db.tables.some(table => table.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSuggestionClick = (result) => {
    setSelectedSuggestion(result);
    setSearchTerm(result.name);
    setShowSuggestions(false);
  };

  return (
    <div className={`container ${isDark ? 'dark' : ''}`}>
      <div className="content">
        <header className="header">
          <div className="header-actions top-left">
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
          </div>

          <div className="header-content">
            <LightningBoltIcon className="header-icon" />
            <h1 className="title">INGRESS 2.0</h1>
            <p className="subtitle">
              Choose a database to view and analyze network data
            </p>
          </div>
        </header>

        <div className="search-container" ref={searchRef}>
          <div className="search-wrapper">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search databases or tables..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestion(null);
              }}
              className="search-input"
            />
          </div>
          {showSuggestions && searchTerm && searchResults.length > 0 && (
            <div className="search-suggestions scrollable">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className={`suggestion-item ${result.type} ${selectedSuggestion === result ? 'selected-suggestion' : ''}`}
                  onClick={() => handleSuggestionClick(result)}
                >
                  <div className="suggestion-content">
                    <DatabaseZap className="suggestion-icon" />
                    <div className="suggestion-text">
                      <div className="suggestion-name">
                        {highlightMatch(result.name, searchTerm)}
                      </div>
                      {result.type === 'table' && result.database && (
                        <div className="suggestion-database-name">
                          in {result.database}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="loading">
            <LoaderCircle className="loading-icon" />
          </div>
        ) : filteredDatabases.length > 0 ? (
          <div className="card-grid">
            {filteredDatabases.map((db) => (
              <Card
                key={db.name}
                className={`database-card ${hoveredCard === db.name ? 'hovered-card' : ''}`}
                onMouseEnter={() => setHoveredCard(db.name)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleDatabaseSelect(db.name)}
              >
                <div className="card-header">
                  <h3 className="card-title">
                    <DatabaseZap className="database-icon" />
                    <span>{highlightMatch(db.name, searchTerm)}</span>
                  </h3>
                </div>
                <div className="card-content">
                  <p className="card-description">
                    Contains {db.tables.length} tables
                  </p>
                  {(hoveredCard === db.name || searchTerm) && ( // Updated: Changed condition to show table list
                    <ul className="table-list">
                      {db.tables.map((table) => (
                        <li 
                          key={table}
                          className={`table-item ${selectedSuggestion && selectedSuggestion.name === table ? 'selected-table' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDatabaseSelect(db.name, table);
                          }}
                        >
                          <Table className="table-icon" />
                          {highlightMatch(table, searchTerm)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer">
                  <Button className="select-button">Select Database</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>No databases found.</p>
          </div>
        )}
      </div>
    </div>
  );
}