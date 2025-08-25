import React from 'react';
import Input from './Input';

const Table = ({ data, filters, onFilterChange }) => {
  if (!data.length) return null;

  const headers = Object.keys(data[0]);

  return (
    <table className="table">
      <thead className="table-header">
        <tr>
          {headers.map(header => (
            <th key={header} className="table-head">
              <div className="table-header-content">{header}</div>
              <Input
                placeholder={`Filter ${header}`}
                value={filters[header] || ""}
                onChange={(e) => onFilterChange(header, e.target.value)}
                className="table-filter"
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="table-body">
        {data.map((row, index) => (
          <tr key={index} className="table-row">
            {headers.map(header => (
              <td key={`${index}-${header}`} className="table-cell">
                <div className="cell-content">{row[header]?.toString()}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
