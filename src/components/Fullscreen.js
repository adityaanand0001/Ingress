import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { HotTable } from '@handsontable/react';
import { motion } from 'framer-motion';

const FullScreenTable = ({ 
  data: initialData, 
  columns, 
  onClose, 
  fetchMoreData,
  activeFilters,
  onFilterChange,
  allFields
}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const hotTableRef = useRef(null);
  const loadingRef = useRef(false);
  const filterUpdateRef = useRef(false);
  
  const handleScroll = useCallback(async () => {
    if (loadingRef.current) return;
    
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const scrollableElement = hotInstance.view.wt.wtTable.holder;
    const scrollPosition = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;
    
    if (scrollHeight - (scrollPosition + clientHeight) < 100) {
      loadingRef.current = true;
      setIsLoading(true);
      
      try {
        const newData = await fetchMoreData();
        if (newData && newData.length > 0) {
          setData(prevData => [...prevData, ...newData]);
        }
      } catch (error) {
        console.error('Error fetching more data:', error);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [fetchMoreData]);

  const handleFilter = useCallback((conditionsStack) => {
    if (filterUpdateRef.current) return;
    filterUpdateRef.current = true;

    const filterConditions = conditionsStack
      .filter(condition => condition.column !== -1)
      .reduce((accumulator, condition) => {
        const field = allFields[condition.column];
        
        const parseCondition = (cond) => {
          if (!cond || cond.name === 'none' || cond.args[0] == null) {
            return null;
          }

          const value = cond.args[0];
          
          switch (cond.name.toLowerCase()) {
            case 'eq':
            case '==':
              return { field, type: 'eq', value };
            case 'neq':
            case '!=':
              return { field, type: 'neq', value };
            case 'contains':
              return { field, type: 'contains', value };
            case 'not_contains':
              return { field, type: 'not_contains', value };
            case 'begins_with':
              return { field, type: 'begins_with', value };
            case 'ends_with':
              return { field, type: 'ends_with', value };
            case 'empty':
              return { field, type: 'eq', value: '' };
            case 'not_empty':
              return { field, type: 'neq', value: '' };
            case 'gt':
              return { field, type: 'gt', value };
            case 'lt':
              return { field, type: 'lt', value };
            case 'gte':
              return { field, type: 'gte', value };
            case 'lte':
              return { field, type: 'lte', value };
            case 'between':
              return [
                { field, type: 'gte', value: cond.args[0] },
                { field, type: 'lte', value: cond.args[1] }
              ];
            default:
              return null;
          }
        };

        const parsedConditions = condition.conditions
          .map(parseCondition)
          .filter(Boolean)
          .flat();

        return [...accumulator, ...parsedConditions];
      }, []);

    // Use requestAnimationFrame to ensure we're not triggering too many updates
    requestAnimationFrame(() => {
      if (onFilterChange) {
        onFilterChange(filterConditions);
      }
      filterUpdateRef.current = false;
    });
  }, [allFields, onFilterChange]);

  const settings = {
    licenseKey: 'non-commercial-and-evaluation',
    data: data,
    columns: columns,
    colHeaders: true,
    rowHeaders: true,
    height: '100vh',
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
              { key: 'none', name: 'None' },
              { key: 'eq', name: 'Equal to' },
              { key: 'neq', name: 'Not equal to' },
              { key: 'contains', name: 'Contains' },
              { key: 'begins_with', name: 'Begins with' },
              { key: 'ends_with', name: 'Ends with' },
              { key: 'empty', name: 'Empty' },
              { key: 'not_empty', name: 'Not empty' },
              { key: 'gt', name: 'Greater than' },
              { key: 'lt', name: 'Less than' },
              { key: 'between', name: 'Between' }
            ]
          }
        },
        filter_by_value: {
          name: 'Filter by value'
        },
        filter_action_bar: {
          name: 'Action bar'
        }
      }
    },
    afterScrollVertically: handleScroll,
    afterFilter: handleFilter
  };

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!hotTableRef.current?.hotInstance || !activeFilters || filterUpdateRef.current) return;

    const filtersPlugin = hotTableRef.current.hotInstance.getPlugin('filters');
    filtersPlugin.clearConditions();
    
    activeFilters.forEach(filter => {
      const columnIndex = allFields.indexOf(filter.field);
      if (columnIndex !== -1) {
        filtersPlugin.addCondition(columnIndex, filter.type, [filter.value]);
      }
    });
    
    // Prevent infinite loop by not triggering the afterFilter callback
    filterUpdateRef.current = true;
    filtersPlugin.filter();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      filterUpdateRef.current = false;
    }, 100);
  }, [activeFilters, allFields]);

  return (
    <motion.div 
      className="fullscreen-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="fullscreen-header">
        <h2>Full Screen View</h2>
        <button onClick={onClose} className="close-button">
          <X className="icon" />
        </button>
      </div>
      <div className="fullscreen-content">
        <HotTable ref={hotTableRef} {...settings} />
        {isLoading && (
          <div className="loading-indicator">
            Loading more data...
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FullScreenTable;