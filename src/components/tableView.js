import React, { useEffect, useCallback } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { Loader } from 'lucide-react';

const TableView = ({
  selectedDatabase,
  selectedTable,
  tableData,
  isLoading,
  hasMoreData,
  hotTableRef,
  allFields,
  visibleColumns,
  loadFilteredData,
  activeFilters,
  setActiveFilters,
  pendingFilters,
  setPendingFilters
}) => {
  const handleScroll = useCallback(() => {
    if (!hasMoreData || isLoading) return;

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;

    const scrollableElement = hotInstance.view.wt.wtTable.holder;
    const scrollPosition = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    if (scrollHeight - (scrollPosition + clientHeight) < clientHeight * 0.2) {
      loadFilteredData(tableData.length / 35 + 1, activeFilters);
    }
  }, [hasMoreData, isLoading, loadFilteredData, tableData.length, activeFilters]);

  useEffect(() => {
    const hotSettings = {
      data: tableData,
      columns: allFields.map(field => ({ data: field, title: field })),
      colHeaders: true,
      rowHeaders: true,
      height: 'calc(100vh - 200px)',
      width: '100%',
      stretchH: 'all',
      autoWrapRow: true,
      autoWrapCol: true,
      manualRowResize: true,
      manualColumnResize: true,
      columnSorting: true,
      filters: true,
      dropdownMenu: {
        items: {
          filter_by_condition: {
            name: 'Filter by condition',
            submenu: {
              items: [
                { key: 'eq', name: 'Equal' },
                { key: 'neq', name: 'Not equal' },
                { key: 'empty', name: 'Empty' },
                { key: 'not_empty', name: 'Not empty' },
                { key: 'contains', name: 'Contains' },
                { key: 'not_contains', name: 'Does not contain' }
              ]
            }
          },
          filter_by_value: {
            name: 'Filter by value',
            callback: function(key, options) {
              const column = options.start.col;
              const columnData = this.getDataAtCol(column);
              const uniqueValues = [...new Set(columnData)].filter(Boolean);
              
              const valueSubmenu = uniqueValues.map(value => ({
                key: `value_${value}`,
                name: value.toString(),
                callback: () => {
                  const filters = [...activeFilters];
                  const fieldName = allFields[column];
                  const existingFilterIndex = filters.findIndex(f => f.field === fieldName);
                  
                  if (existingFilterIndex !== -1) {
                    filters[existingFilterIndex] = { field: fieldName, type: 'eq', value };
                  } else {
                    filters.push({ field: fieldName, type: 'eq', value });
                  }
                  
                  setActiveFilters(filters);
                  loadFilteredData(1, filters);
                }
              }));
              
              this.getPlugin('dropdownMenu').menu.addItem({
                key: 'filter_by_value',
                name: 'Filter by value',
                submenu: {
                  items: valueSubmenu
                }
              });
            }
          },
          filter_action_bar: {
            name: 'Filter actions',
            items: [
              {
                key: 'clear_filters',
                name: 'Clear filters',
                callback: () => {
                  setActiveFilters([]);
                  setPendingFilters({});
                  loadFilteredData(1, []);
                }
              }
            ]
          }
        }
      },
      afterScrollVertically: handleScroll,
      afterFilter: (conditionsStack) => {
        const newFilters = conditionsStack
          .filter(condition => condition.column !== -1)
          .map(condition => {
            const field = allFields[condition.column];
            const { operation, conditions } = condition;
            
            if (operation === 'disjunction') {
              return conditions.map(cond => ({
                field,
                type: cond.name,
                value: cond.args[0]
              }));
            } else {
              return {
                field,
                type: conditions[0].name,
                value: conditions[0].args[0]
              };
            }
          })
          .flat();

        setActiveFilters(newFilters);
        loadFilteredData(1, newFilters);
      },
      licenseKey: 'non-commercial-and-evaluation'
    };

    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      hotTableRef.current.hotInstance.updateSettings(hotSettings);
    }
  }, [tableData, allFields, visibleColumns, handleScroll, loadFilteredData, setActiveFilters, setPendingFilters, activeFilters]);

  if (isLoading && !tableData.length) {
    return (
      <div className="loading-indicator">
        <Loader className="icon spin" />
        <span>Loading table data...</span>
      </div>
    );
  }

  if (!tableData.length) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">No data found</p>
      </div>
    );
  }

  return (
    <div className="hot-table-wrapper" style={{ height: 'calc(100vh - 200px)' }}>
      <HotTable
        ref={hotTableRef}
        settings={{
          data: tableData,
          colHeaders: true,
          rowHeaders: true,
          height: '100%',
          width: '100%',
          licenseKey: 'non-commercial-and-evaluation'
        }}
      />
      {isLoading && hasMoreData && (
        <div className="loading-indicator">
          <Loader className="icon spin" />
          <span>Loading more data...</span>
        </div>
      )}
    </div>
  );
};

export default TableView;

