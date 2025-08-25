import React, { useState } from 'react';
import { Table } from 'lucide-react';

const Tooltip = ({ children, content, tables }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="tooltip expanded-tooltip">
          <h4 className="tooltip-title">{content}</h4>
          <ul className="table-list">
            {tables.map((table, index) => (
              <li
                key={table}
                className="table-item"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Table className="table-icon" size={16} />
                <span>{table}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
