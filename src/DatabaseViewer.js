import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Zap, Download, Ban, LogOut, Activity, Moon, Sun, DatabaseZap, TableIcon, Loader, Search, ChevronUp, ChevronDown, RefreshCw, X, Database, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Viewer.css';
import axios from 'axios';
import 'handsontable/dist/handsontable.full.css';
import { HotTable } from '@handsontable/react';
import Input from './components/Input';
import Button from './components/Button';
import ScrollArea from './components/ScrollArea';
import ThemeToggle from './components/ThemeToggle';
import Tooltip from './components/tooltip2';



export default function DatabaseViewer() {
  const { database } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTable = location.state?.selectedTable;
  const [firstload, setfirstload] = useState(true);
  
  const [selectedDatabase, setSelectedDatabase] = useState(database);
  const [selectedTable, setSelectedTable] = useState("");
  const [filters, setFilters] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [liveResponse, setLiveResponse] = useState(null);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [liveFormData, setLiveFormData] = useState({});
  const [tableInfo, setTableInfo] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    return savedSidebarState === null ? true : JSON.parse(savedSidebarState);
  });
  const [pendingFilters, setPendingFilters] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [hotSettings, setHotSettings] = useState({});
  const [allFields, setAllFields] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);

  const loadingRef = useRef(false);
  const currentRequestRef = useRef(null);
  const tableRef = useRef(selectedTable);
  const scrollTimeout = useRef(null);
  const filterTimeout = useRef(null);
  const hotTableRef = useRef(null);
  const isBrowser = useRef(false);
 


  const fetchFilteredData = useCallback(async (pageNum = 1, filters = []) => {
    if (loadingRef.current || !selectedTable) return;

    console.log("Fetching data with filters:", filters);

    const sanitizedFilters = filters.length > 0 
      ? filters
      : Object.entries(pendingFilters)
          .filter(([field, value]) => field && field.trim() !== '')
          .map(([field, value]) => ({ field, type: 'eq', value }));

    try {
      setIsLoading(true);
      loadingRef.current = true;
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/tables/${selectedDatabase}/${selectedTable}`,
        {
          params: {
            filters: JSON.stringify(sanitizedFilters),
            page: pageNum,
            limit: 35,
            search: searchTerm || ''
          }
        }
      );
      if (tableRef.current !== selectedTable) {
        return;
      }

      setTableData(prevData => pageNum === 1 ? response.data.data : [...prevData, ...response.data.data]);
      setHasMoreData(response.data.data.length === 35);
      setAllFields(response.data.all_fields);
      setPage(pageNum);
      
      setTableInfo(prevInfo => ({
        ...prevInfo,
        filtered_rows: response.data.total ?? 0
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Error fetching filtered data:", error);
      setHasMoreData(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      currentRequestRef.current = null;
    }
  }, [selectedDatabase, selectedTable, searchTerm, pendingFilters]);

  const applyFilters = useCallback((filters) => {
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      const filtersPlugin = hotTableRef.current.hotInstance.getPlugin('filters');
      filtersPlugin.clearConditions();
      Object.entries(filters).forEach(([column, value]) => {
        const columnIndex = allFields.indexOf(column);
        if (columnIndex !== -1 && value !== '') {
          filtersPlugin.addCondition(columnIndex, 'eq', [value]);
        }
      });
      filtersPlugin.filter();
    }
    setPendingFilters(filters);
    fetchFilteredData(1, Object.entries(filters).map(([field, value]) => ({ field, type: 'eq', value })));
  }, [allFields, fetchFilteredData]);

  useEffect(() => {
    tableRef.current = selectedTable;
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
    };
  }, [selectedTable]);

  useEffect(() => {
    const fetchTables = async () => {
      if (!selectedDatabase) return;
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/tables/${selectedDatabase}`);
        setTables(response.data);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables();
  }, [selectedDatabase]);

  const fetchTableInfo = useCallback(async () => {
    if (!selectedTable) return;
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/table-info/${selectedDatabase}/${selectedTable}`, {
          params: {
            filters: JSON.stringify(activeFilters) 
          }
        }
      );
      setTableInfo({
        total_rows: response.data.total_rows ?? 0,
        size_mb: response.data.size_mb ?? 0,
        filtered_rows: response.data.filtered_rows ?? response.data.total_rows ?? 0,
        ...response.data
      });
      setFieldValues(response.data.field_values ?? {});
    } catch (error) {
      console.error('Error fetching table info:', error);
      setTableInfo({
        total_rows: 0,
        size_mb: 0,
        filtered_rows: 0
      });
      setFieldValues({});
    }
  }, [selectedDatabase, selectedTable, activeFilters]);

  useEffect(() => {
    fetchTableInfo();
  }, [selectedTable, fetchTableInfo]);

  useEffect(() => {
    if (selectedTable) {
      setTableData([]);
      setPage(1);
      setHasMoreData(true);
      loadingRef.current = false;
      fetchFilteredData(1, []);
      setActiveFilters([]); 
    }

    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, [selectedTable, fetchFilteredData]);

  const handleScroll = useCallback(() => {
    if (!hasMoreData || loadingRef.current) {
      return;
    }

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;

    const scrollableElement = hotInstance.view.wt.wtTable.holder;
    const scrollPosition = scrollableElement.scrollTop;
    const scrollHeight = scrollableElement.scrollHeight;
    const clientHeight = scrollableElement.clientHeight;

    if (scrollHeight - (scrollPosition + clientHeight) < 100) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        console.log("Scroll triggered, passing filters:", activeFilters);
        fetchFilteredData(page + 1, activeFilters);
      }, 200);
    }
  }, [hasMoreData, fetchFilteredData, page, activeFilters]);

  useEffect(() => {
    setSelectedDatabase(database);
  }, [database]);
  useEffect(() => {
    if (initialTable && firstload) {
      setSelectedTable(initialTable);
      setfirstload(false);
    }
  }, [initialTable, firstload]);

  const handleTableSelect = useCallback((table) => {
    if (table === selectedTable) {
      return;
    }

    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }
    setSelectedTable(table);
    setFilters({});
    setPendingFilters({});
    setTableData([]);
    setPage(1);
    setHasMoreData(true);
    loadingRef.current = false;
    setActiveFilters([]);
  }, [selectedTable]);

  const handleFilterChange = (newFilter) => {
    setPendingFilters(prev => ({ ...prev, ...newFilter }));
  };
  
  const handleClearFilters = useCallback(() => {
      setActiveFilters([0]);
      setPendingFilters({}); // Force a re-render of filter tags
  

  requestAnimationFrame(() => {
    setActiveFilters([0]);
    setPendingFilters({}); // Force a re-render of filter tags
  }
);
    
    setFilters({});
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      const filtersPlugin = hotTableRef.current.hotInstance.getPlugin('filters');
      filtersPlugin.clearConditions();
      filtersPlugin.filter();
    }
   
    fetchFilteredData(1,[]);
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      hotTableRef.current.hotInstance.render();
    }
  }, [fetchFilteredData]);

  const handleExport = useCallback(async () => {
    if (!selectedDatabase || !selectedTable) return;

    setIsExporting(true);
    setDownloadProgress(0);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/export/${selectedDatabase}/${selectedTable}`,
        {
          params: { 
            filters: JSON.stringify(activeFilters),
            search: searchTerm 
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTable}-${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedDatabase, selectedTable, activeFilters, searchTerm]);

  const handleExportFiltered = useCallback(async () => {
    if (!selectedDatabase || !selectedTable) return;

    setIsExporting(true);
    setDownloadProgress(0);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/export/${selectedDatabase}/${selectedTable}`,
        {
          params: { 
            filters: JSON.stringify(activeFilters),
            search: searchTerm 
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTable}-filtered-${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error exporting filtered data:", error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedDatabase, selectedTable, activeFilters, searchTerm]);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev;
      document.body.classList.toggle('dark', newValue);
      document.querySelector('.db-viewer').classList.toggle('dark', newValue);
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const handleGoLiveSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/live/${selectedDatabase}/${selectedTable}`,
        liveFormData
      );
      setLiveResponse(response.data);
      setIsLive(true);
      setShowLiveForm(false);
    } catch (error) {
      console.error("Error fetching live data:", error);
    }
  };

  const reloadLiveData = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/live/${selectedDatabase}/${selectedTable}`,
        liveFormData
      );
      setLiveResponse(response.data);
    } catch (error) {
      console.error("Error reloading live data:", error);
    }
  };

  const toggleColumnVisibility = useCallback((column) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  }, []);

  const applyColumnVisibility = useCallback(() => {
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      const hiddenColumnsPlugin = hotTableRef.current.hotInstance.getPlugin('hiddenColumns');
      allFields.forEach((field, index) => {
        if (visibleColumns.includes(field)) {
          hiddenColumnsPlugin.showColumn(index);
        } else {
          hiddenColumnsPlugin.hideColumn(index);
        }
      });
      hotTableRef.current.hotInstance.render();
    }
    setShowColumnSelector(false);
  }, [allFields, visibleColumns]);

  useEffect(() => {
    if (allFields.length > 0) {
      setVisibleColumns([...allFields]);
    }
  }, [allFields]);

  useEffect(() => {
    if (hotTableRef.current && hotTableRef.current.hotInstance) {
      const hiddenColumnsPlugin = hotTableRef.current.hotInstance.getPlugin('hiddenColumns');
      allFields.forEach((field, index) => {
        if (visibleColumns.includes(field)) {
          hiddenColumnsPlugin.showColumn(index);
        } else {
          hiddenColumnsPlugin.hideColumn(index);
        }
      });
      hotTableRef.current.hotInstance.render();
    }
  }, [visibleColumns, allFields]);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0 && selectedTable) {
      fetchFilteredData(1, Object.entries(filters).map(([field, value]) => ({ field, type: 'eq', value })));
    }
  }, [filters, selectedTable, fetchFilteredData]);

  useEffect(() => {
    if (isBrowser.current) {
      setHotSettings({
        licenseKey: 'non-commercial-and-evaluation',
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
            QueryBuilder: {
              name: 'Query Builder',
              callback: function(key, selection) {
                const coords = selection[0];
                const col = coords.start.col;
                const field = allFields[col];
                
                // Remove any existing query builder popup
                const existingPopup = document.querySelector('.query-builder-popup');
                if (existingPopup) {
                  existingPopup.remove();
                }
                
                // Get the cell's position safely
                let position = { top: 0, right: 0 };
                try {
                  const cell = this.getCell(coords.start.row, coords.start.col);
                  if (cell) {
                    const rect = cell.getBoundingClientRect();
                    position = { top: rect.top, right: rect.right };
                  } else {
                    // Fallback: Get position from the click event or table container
                    const tableContainer = this.rootElement.querySelector('.htCore');
                    if (tableContainer) {
                      const tableRect = tableContainer.getBoundingClientRect();
                    }
                  }
                } catch (error) {
                  console.warn('Could not get cell position:', error);
                  // Use viewport-relative positioning as last resort
                  position = {
                    top: window.innerHeight / 3,
                    right: window.innerWidth / 3
                  };
                }
                
                // Create and position the query builder div
                const queryBuilderDiv = document.createElement('div');
                queryBuilderDiv.className = 'query-builder-popup';
                queryBuilderDiv.style.position = 'fixed'; // Changed to fixed positioning
                queryBuilderDiv.style.left = `${position.right + 10}px`;
                queryBuilderDiv.style.top = `${position.top}px`;
                queryBuilderDiv.style.zIndex = 1000;
                
                // Ensure popup stays within viewport
                const ensureInViewport = () => {
                  const popupRect = queryBuilderDiv.getBoundingClientRect();
                  if (popupRect.right > window.innerWidth) {
                    queryBuilderDiv.style.left = `${window.innerWidth - popupRect.width - 20}px`;
                  }
                  if (popupRect.bottom > window.innerHeight) {
                    queryBuilderDiv.style.top = `${window.innerHeight - popupRect.height - 20}px`;
                  }
                  if (popupRect.left < 0) {
                    queryBuilderDiv.style.left = '20px';
                  }
                  if (popupRect.top < 0) {
                    queryBuilderDiv.style.top = '20px';
                  }
                };
                
                // Create the content
                queryBuilderDiv.innerHTML = `
                  <div class="query-builder-content">
                    <h3 class="query-builder-title">Query Builder - ${field}</h3>
                    <div class="query-builder-form">
                      <div class="form-group">
                        <label>Condition</label>
                        <select class="query-condition">
                          <option value="eq">Equal to</option>
                          <option value="neq">Not equal to</option>
                          <option value="contains">Contains</option>
                          <option value="begins_with">Begins with</option>
                          <option value="ends_with">Ends with</option>
                          <option value="gt">Greater than</option>
                          <option value="lt">Less than</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Value</label>
                        <input type="text" class="query-value" placeholder="Enter value...">
                      </div>
                      <div class="query-builder-actions">
                        <button type="button" class="query-cancel">Cancel</button>
                        <button type="button" class="query-apply">Apply</button>
                      </div>
                    </div>
                  </div>
                `;
                
                document.body.appendChild(queryBuilderDiv);
                
                // Ensure the popup is within viewport after it's added to the DOM
                requestAnimationFrame(ensureInViewport);
                
                // Add event listeners
                const applyButton = queryBuilderDiv.querySelector('.query-apply');
                const cancelButton = queryBuilderDiv.querySelector('.query-cancel');
                const conditionSelect = queryBuilderDiv.querySelector('.query-condition');
                const valueInput = queryBuilderDiv.querySelector('.query-value');
                
                const removePopup = () => {
                  if (document.body.contains(queryBuilderDiv)) {
                    document.body.removeChild(queryBuilderDiv);
                  }
                };
                
                applyButton.addEventListener('click', () => {
                  const filter = {
                    field,
                    type: conditionSelect.value,
                    value: valueInput.value
                  };
                  
                  const updatedFilters = [...activeFilters, filter];
                  setActiveFilters(updatedFilters);
                  fetchFilteredData(1, updatedFilters);
                  removePopup();
                });
                
                cancelButton.addEventListener('click', removePopup);
                
                // Close on click outside
                const closeHandler = (e) => {
                  if (!queryBuilderDiv.contains(e.target) && !e.target.closest('.htDropdownMenu')) {
                    removePopup();
                    document.removeEventListener('click', closeHandler);
                  }
                };
                
                // Delay adding the click handler to prevent immediate closing
                setTimeout(() => {
                  document.addEventListener('click', closeHandler);
                }, 100);
                
                // Focus the input after a brief delay
                setTimeout(() => {
                  valueInput.focus();
                }, 100);
              }
            },
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
        
            filter_action_bar: {
              name: 'Action bar',
              submenu: {
                items: [
                  'filter_by_condition',
                  'filter_by_value',
                  'filter_action_bar_clear_filters'
                ]
              }
            }
              
            
          }
        },
        readOnly: false,
        afterScrollVertically: handleScroll,
        hiddenColumns: {
          columns: allFields.filter(col => !visibleColumns.includes(col)).map(col => allFields.indexOf(col)),
          indicators: true
        },
        afterFilter: (conditionsStack) => {
          const filterConditions = conditionsStack
            .filter(condition => condition.column !== -1)
            .reduce((accumulator, condition) => {
              const field = allFields[condition.column];
              
              const parseCondition = (cond) => {
                if (cond.name === 'none' || cond.args[0] == null) {
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
                    console.warn(`Unhandled condition: ${cond.name}`);
                    return null;
                }
              };

              let parsedConditions = [];
              if (condition.operation === 'conjunction') {
                parsedConditions = condition.conditions
                  .map(parseCondition)
                  .filter(Boolean)
                  .flat();
              } else if (condition.operation === 'disjunction') {
                parsedConditions = condition.conditions
                  .map(parseCondition)
                  .filter(Boolean)
                  .flat();
              } else {
                const parsed = parseCondition(condition.conditions[0]);
                if (parsed) {
                  parsedConditions = Array.isArray(parsed) ? parsed : [parsed];
                }
              }

              return [...accumulator, ...parsedConditions];
            }, [])
            .filter(Boolean);

          const updatedFilters = [...activeFilters];

          filterConditions.forEach(newFilter => {
            const existingFilterIndex = updatedFilters.findIndex(f => f.field === newFilter.field && f.type === newFilter.type);
            if (existingFilterIndex !== -1) {
              updatedFilters[existingFilterIndex] = newFilter;
            } else {
              updatedFilters.push(newFilter);
            }
          });

          console.log('Applying filters:', updatedFilters);
          setActiveFilters(updatedFilters);
          fetchFilteredData(1, updatedFilters);
        },
        afterOnCellMouseDown: (event, coords) => {
          if (coords.row === -1 && event.realTarget && event.realTarget.className === 'columnSorting') {
            applyFilters(pendingFilters);
          }
        },
        beforeDropdownMenuShow: function(coords) {
          const col = coords.col;
          const field = allFields[col];
          
          if (fieldValues[field]) {
            const values = fieldValues[field];
            this.getPlugin('dropdownMenu').updateSettings({
              items: {
                filter_by_value: {
                  values: values
                }
              }
            });
          }
        }
      });
    }
  }, [allFields, tableData, visibleColumns, fieldValues, handleScroll, fetchFilteredData, applyFilters, activeFilters, pendingFilters]);

  useEffect(() => {
    isBrowser.current = true;
  }, []);
  

  const renderActiveFilters = useCallback(() => {
    return (
      <div className="active-filters-container">
        {activeFilters.map((filter, index) => (
          <div key={`${filter.field}-${filter.type}-${index}`} className="filter-tag">
            {`${filter.field} ${filter.type} ${filter.value}`} 
            <button onClick={() => {
              const newFilters = activeFilters.filter((_, i) => i !== index);
              setActiveFilters(newFilters);
              fetchFilteredData(1, newFilters);
            }}>
              <X className="icon" size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  }, [activeFilters, fetchFilteredData]);

  return (
    <div className={`db-viewer app-container ${isDark ? 'dark' : ''} ${isLive ? 'hacker' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <Zap className="icon red" />
          <motion.h1 
            className="app-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            INGRESS 2.0
          </motion.h1>
          <Tooltip content="Go Back">
          <Button variant="ghost" className="red" onClick={() => navigate('/')}>
            <DatabaseZap className="icon" />
            <span className="button-text">Select Database</span>
          </Button>
          </Tooltip>
          <Tooltip content="Show/hide columns">
            <Button
              variant="outline"
              onClick={() => setShowColumnSelector(true)}
              className="header-button"
            >
              <Eye className="icon" />
            </Button>
          </Tooltip>
        </div>
        <div className='header-middle'>
        <Tooltip content="Table Name">
        <motion.h2 
                className="main-title"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {selectedTable}
              </motion.h2>
              </Tooltip>
        </div>
        
       
        <div className="header-right">
        <Tooltip
  content={
    <span style={{fontSize: "14px", lineHeight: "1.5" }}>
      Export all data to Excel<br />
      <span style={{ fontStyle: "italic", color: "#ff4d4d",fontWeight: "bold",fontFamily:"sans-serif" }}>
        Note: If filters applied, only filtered data will be downloaded
      </span>
    </span>
  }
>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!selectedTable || tableData.length === 0 || isExporting}
              className="header-button"
            >
              <Download className="icon" />
              <span className="button-text">{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          </Tooltip>
          <Tooltip content="Clear all applied filters">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="header-button"
            >
              <Ban className="icon" />
              Clear All Filters
            </Button>
          </Tooltip>
          
          {!isLive && (
            <Tooltip content="Toggle dark mode">
              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            </Tooltip>
          )}
        </div>
      </header>

      <div className={`app-body ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
        <Tooltip content={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
          <div
            variant="ghost"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="icon9" /> : <ChevronRight className="icon" />}
          </div>
        </Tooltip>
        {isSidebarOpen && (
          <motion.nav 
            className="app-nav"
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <h2 className="nav-title">
              <DatabaseZap className="icon0" />
              {selectedDatabase}
            </h2>
            
            <ScrollArea className="nav-scroll-area">
              <AnimatePresence>
                {tables.map(table => (
                  <motion.div
                    key={table}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Tooltip content={`Click to View `}>
                      <Button
                        variant={selectedTable === table ? "default" : "ghost"}
                        className="nav-button"
                        onClick={() => handleTableSelect(table)}
                      >
                        <TableIcon className="icon" />
                        <span className="nav-button-text">{table}</span>
                      </Button>
                    </Tooltip>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
            {tableInfo && (
              <motion.div 
                className="table-info-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
             
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
              </motion.div>
            )}
          </motion.nav>
        )}

        <main className={`app-main ${isSidebarOpen ? '' : 'full-width'}`}>
          {selectedTable ? (
            <>
              {renderActiveFilters()}
              <div className="table-container">
                {viewMode === 'table' ? (
                  isLoading && !tableData.length ? (
                    <motion.div 
                    
                      className="loading-indicator1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader className="icon spin" />
                      <span>Loading table data...</span>
                      
                    </motion.div>
                    
                  ) : tableData.length > 0 ? (
                    <div className="hot-table-wrapper" style={{ height: 'calc(100vh - 200px)' }}>
                      {isBrowser.current && (
                        <HotTable
                          ref={hotTableRef}
                          {...hotSettings}
                        />
                      )}
                    </div>
                  ) : (
                    <motion.div 
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="empty-state-text">No data found</p>
                    </motion.div>
                  )
                ) : (
                  <div className="go-live-container">
                    {showLiveForm ? (
                        <form onSubmit={handleGoLiveSubmit} className="go-live-form">
                          <h3>Enter Live Data Parameters</h3>
                          {allFields.map(key => (
                            <Input
                              key={key}
                              type="text"
                              placeholder={key}
                              value={liveFormData[key] || ''}
                              onChange={(e) => setLiveFormData(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                          ))}
                          <Button type="submit" className="go-live-submit">
                            Submit
                          </Button>
                        </form>
                      ) : liveResponse ? (
                        <div className="live-response">
                          <h4>Live Response:</h4>
                          <table className="table">
                            <thead>
                              <tr>
                                {Object.keys(liveResponse[0]).map(header => (
                                  <th key={header}>{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {Object.values(liveResponse[0]).map((value, index) => (
                                  <td key={index}>{value?.toString()}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                          <Tooltip content="Reload live data">
                            <Button onClick={reloadLiveData} className="reload-button">
                              <RefreshCw className="icon" />
                              Reload
                            </Button>
                          </Tooltip>
                        </div>
                      ) : null}
                    </div>
                  )}
                {isLoading && hasMoreData && viewMode === 'table'  &&(
                  <motion.div 
                    className="loading-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span>Loading more data...</span>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="empty-state-text">
                {selectedDatabase
                  ? "Select a table to view data"
                  : "Select a database to view tables"}
              </p>
            </motion.div>
          )}
        </main>
      </div>
      {showColumnSelector && (
        <div className="column-selector-overlay">
          <div className="column-selector">
            <h3>Select Columns to Show</h3>
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
              <Tooltip content="Apply selected columns">
                <Button onClick={applyColumnVisibility}>Apply</Button>
              </Tooltip>
              <Tooltip content="Cancel column selection">
                <Button variant="outline" onClick={() => {
                  setVisibleColumns([...allFields]);
                  setShowColumnSelector(false);
                }}>Cancel</Button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
      {isExporting && (
        <div className="export-progress-overlay">
          <div className="export-progress">
            <h3>Exporting Data</h3>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${downloadProgress}%` }}></div>
            </div>
            <p>{downloadProgress}% Complete</p>
          </div>
        </div>
      )}
    </div>
  );
}

