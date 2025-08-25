import React, { useState, useCallback } from 'react';
import { TableIcon, Ban, Eye, Download } from 'lucide-react';
import Button from './Button';
import TableView from './tableView';

const MainContent = ({
  selectedDatabase,
  selectedTable,
  tableData,
  isLoading,
  hasMoreData,
  hotTableRef,
  allFields,
  visibleColumns,
  setShowColumnSelector,
  loadFilteredData,
  activeFilters,
  setActiveFilters,
  pendingFilters,
  setPendingFilters,
  handleExport
}) => {
  const [viewMode, setViewMode] = useState('table');

  const handleClearFilters = useCallback(() => {
    setPendingFilters({});
    setActiveFilters([]);
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      const filtersPlugin = hotTableRef.current.hotInstance.getPlugin('filters');
      filtersPlugin.clearConditions();
      filtersPlugin.filter();
    }
    loadFilteredData(1, []);
  }, [loadFilteredData, setPendingFilters, setActiveFilters]);

  return (
    <main className="app-main">
      {selectedTable ? (
        <>
          <div className="view-toggle">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="icon" />
              Table
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!selectedTable}
            >
              <Ban className="icon" />
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowColumnSelector(true)}
            >
              <Eye className="icon" />
              Toggle Columns
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!selectedTable}
            >
              <Download className="icon" />
              Export Filtered
            </Button>
          </div>
          <div className="table-container">
            <TableView
              selectedDatabase={selectedDatabase}
              selectedTable={selectedTable}
              tableData={tableData}
              isLoading={isLoading}
              hasMoreData={hasMoreData}
              hotTableRef={hotTableRef}
              allFields={allFields}
              visibleColumns={visibleColumns}
              loadFilteredData={loadFilteredData}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              pendingFilters={pendingFilters}
              setPendingFilters={setPendingFilters}
            />
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">
            {selectedDatabase
              ? "Select a table to view data"
              : "Select a database to view tables"}
          </p>
        </div>
      )}
    </main>
  );
};

export default MainContent;

