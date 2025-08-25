import React from 'react';
import { DatabaseZap, TableIcon, Database } from 'lucide-react';
import Button from './Button';
import ScrollArea from './ScrollArea';

const Sidebar = ({ selectedDatabase, tables, selectedTable, handleTableSelect, tableInfo }) => {
  return (
    <nav className="app-nav">
      <h2 className="nav-title">
        <DatabaseZap className="icon0" />
        {selectedDatabase}
      </h2>
      <ScrollArea className="nav-scroll-area">
        {tables.map(table => (
          <Button
            key={table}
            variant={selectedTable === table ? "default" : "ghost"}
            className="nav-button"
            onClick={() => handleTableSelect(table)}
          >
            <TableIcon className="icon" />
            <span className="nav-button-text">{table}</span>
          </Button>
        ))}
      </ScrollArea>
      {tableInfo && (
        <div className="table-info-section">
          <h3 className="info-title">
            <Database className="icon" />
            Table Information
          </h3>
          <div className="info-content">
            <div className="info-item">
              <span className="info-label">Total Rows:</span>
              <span className="info-value">{tableInfo.total_rows?.toLocaleString() ?? 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Size:</span>
              <span className="info-value">{tableInfo.size_mb?.toFixed(2) ?? 'N/A'} MB</span>
            </div>
            {tableInfo.filtered_rows !== undefined && (
              <div className="info-item">
                <span className="info-label">Filtered Rows:</span>
                <span className="info-value">{tableInfo.filtered_rows?.toLocaleString() ?? 'N/A'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;

