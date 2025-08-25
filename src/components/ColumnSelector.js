import React from 'react';
import Button from './Button';

const ColumnSelector = ({ allFields, visibleColumns, setVisibleColumns, onClose, applyColumnVisibility }) => {
  const toggleColumnVisibility = (column) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  return (
    <div className="column-selector-overlay">
      <div className="column-selector">
        <h3>Select Visible Columns</h3>
        <div className="column-list">
          {allFields.map(field => (
            <label key={field} className="column-item">
              <input
                type="checkbox"
                checked={visibleColumns.includes(field)}
                onChange={() => toggleColumnVisibility(field)}
              />
              {field}
            </label>
          ))}
        </div>
        <div className="column-selector-actions">
          <Button onClick={applyColumnVisibility}>Apply</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelector;

