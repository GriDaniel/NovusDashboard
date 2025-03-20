/**
 * @module DataApplierModule
 * @author Daniel Oliveira
 * @description Provides methods for applying data to the rows and columns
 *              based off tracking current data batch (searched data and regular data)
 *              
 */
const DataApplierModule = (function() {
    let instance = null;

    class DataApplier {
        constructor() {
            PerformanceTracker.start('dataApplierInit');
            this.currentPage = 1;
            this._initEventListeners();
            PerformanceTracker.end('dataApplierInit');
        }

        /**
         * Sets up event listeners
         */
        _initEventListeners() {
            document.addEventListener('rowManager:rowsAdded', this._handleRowsAdded.bind(this));
            document.addEventListener('pagination:pageChanged', this._handlePageChanged.bind(this));
            document.addEventListener('columnManager:columnAdded', this._handleColumnAdded.bind(this));
            document.addEventListener('search:performed', this._handleSearchPerformed.bind(this));
            document.addEventListener('search:cleared', this._handleSearchCleared.bind(this));
        }

        /**
         * Handles row addition
         */
        _handleRowsAdded(event) {
            console.log("_handlerowsadded")
            PerformanceTracker.start('handleRowsAdded');
            const { count, rows } = event.detail;

            if (!rows?.length || !count) {
                PerformanceTracker.end('handleRowsAdded');
                return;
            }

            const columns = ColumnElementManager.getColumnHeaders();
            if (!columns?.length) {
                PerformanceTracker.end('handleRowsAdded');
                return;
            }

            // Calculate previous row count and apply data
            const currentRowCount = RowManagerModule.getRowCount();
            const previousRowCount = currentRowCount - count;
            this.applyDataForRowCountChange(rows, this.currentPage, previousRowCount, count, columns)
                .catch(error => console.error('Error applying data to new rows:', error));

            PerformanceTracker.end('handleRowsAdded');
        }

        /**
         * Handles page changes
         */
        async _handlePageChanged(event) {
            PerformanceTracker.start('handlePageChanged');
            const { page, rows, columns, rowsPerPage } = event.detail;

            if (!columns?.length) {
                PerformanceTracker.end('handlePageChanged');
                return;
            }

            // Update page tracking
            this.currentPage = page;

            try {
                // Get data counts and settings
                const totalCount = await TableDataModule.getTotalCount();
                const currentRowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() || 
                                           rowsPerPage || 
                                           RowManagerModule.getRowCount() || 10;

                // Calculate items for this page
                const startIndex = (page - 1) * currentRowsPerPage;
                const itemsOnThisPage = Math.min(currentRowsPerPage, totalCount - startIndex);

                // Handle invalid page
                if (startIndex >= totalCount) {
                    const maxValidPage = Math.max(1, Math.ceil(totalCount / currentRowsPerPage));
                    
                    if (PaginationModule?.goToPage && page !== maxValidPage) {
                        await PaginationModule.goToPage(maxValidPage);
                        PerformanceTracker.end('handlePageChanged');
                        return;
                    }
                }

                // Clear rows and rebuild with correct count
                RowManagerModule.deleteAllRows();
                
                if (itemsOnThisPage <= 0) {
                    PerformanceTracker.end('handlePageChanged');
                    return;
                }

                const newRows = RowManagerModule.addRows(itemsOnThisPage);
                const pageData = await TableDataModule.getPageData(page, itemsOnThisPage, columns);
                
                // Apply data and notify
                this.applyDataToRows(newRows, pageData, columns);
                this._dispatchDataEvent('pageDataApplied', {
                    page,
                    rowCount: itemsOnThisPage,
                    totalCount,
                    rows: newRows,
                    data: pageData
                });
            } catch (error) {
                console.error(`Error handling page change to page ${page}:`, error);
            }

            PerformanceTracker.end('handlePageChanged');
        }
        
        /**
         * Handles new columns
         */
        async _handleColumnAdded(event) {
            console.log("in handle column added")
            PerformanceTracker.start('handleColumnAdded');
            const { column, page, rowCount } = event.detail;
            
            if (!column) {
                PerformanceTracker.end('handleColumnAdded');
                return;
            }
            
            const startIndex = (page - 1) * rowCount;
            
            try {
                await this.applyDataForAddedColumn(column, startIndex, rowCount, page);
            } catch (error) {
                console.error(`Error handling added column ${column}:`, error);
            }
            
            PerformanceTracker.end('handleColumnAdded');
          
        }
        
        /**
         * Handles search requests
         */
        async _handleSearchPerformed(event) {
            PerformanceTracker.start('handleSearchPerformed');
            const { term, type } = event.detail;

            if (!term || !type) {
                PerformanceTracker.end('handleSearchPerformed');
                return;
            }

            try {
                // Activate search mode
                TableDataModule.activateSearch(term, type);
                const columns = ColumnElementManager.getColumnHeaders();
                const searchCount = await TableDataModule.getTotalCount();
                
                // Reset to page 1
                this.currentPage = 1;
                if (PaginationModule) {
                    if (PaginationModule.getCurrentPage() !== 1) {
                        await PaginationModule.goToPage(1);
                    }
                    await PaginationModule.updateMaxPages();
                }

                // Get display settings
                const rowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() ||
                                   RowManagerModule.getRowCount() || 10;
                
                // Reset and rebuild rows
                RowManagerModule.deleteAllRows();
                const rowsToShow = Math.min(rowsPerPage, searchCount);

                if (rowsToShow > 0) {
                    const addedRows = RowManagerModule.addRows(rowsToShow);
                    const searchData = await TableDataModule.getPageData(1, rowsToShow, columns);
                    this.applyDataToRows(addedRows, searchData, columns);
                }

                // Notify about search results
                this._dispatchDataEvent('searchApplied', {
                    term, type, page: 1, rowCount: rowsToShow,
                    totalResults: searchCount, columns
                });
            } catch (error) {
                console.error('Error handling search:', error);
            }

            PerformanceTracker.end('handleSearchPerformed');
        }

        /**
         * Handles search clearing
         */
        async _handleSearchCleared() {
            PerformanceTracker.start('handleSearchCleared');

            try {
                // Deactivate search and get counts
                let totalCount;
                try {
                    totalCount = await TableDataModule.deactivateSearch();
                } catch (error) {
                    totalCount = await TableDataModule.getTotalCount();
                }

                const columns = ColumnElementManager.getColumnHeaders();
                this.currentPage = 1;

                // Update pagination
                if (PaginationModule) {
                    if (PaginationModule.getCurrentPage() !== 1) {
                        await PaginationModule.goToPage(1);
                    }

                    const rowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() ||
                                       RowManagerModule.getRowCount() || 10;
                    
                    const newTotalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
                    
                    // Update pagination elements
                    const maxPageEl = PaginationElementManager.getMaxPage();
                    if (maxPageEl) {
                        maxPageEl.textContent = `${newTotalPages} page${newTotalPages !== 1 ? 's' : ''}`;
                    }
                    
                    await PaginationModule.updateMaxPages();
                }

                // Reset rows with normal data
                const rowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() ||
                                   RowManagerModule.getRowCount() || 10;
                
                RowManagerModule.deleteAllRows();
                const rowsToShow = Math.min(rowsPerPage, totalCount);

                if (rowsToShow > 0) {
                    const addedRows = RowManagerModule.addRows(rowsToShow);
                    const normalData = await TableDataModule.getPageData(1, rowsToShow, columns);
                    this.applyDataToRows(addedRows, normalData, columns);
                }

                // Notify about reset
                this._dispatchDataEvent('searchCleared', {
                    page: 1,
                    rowCount: rowsToShow,
                    totalResults: totalCount,
                    columns
                });

                // Update pagination state
                document.dispatchEvent(new CustomEvent('pagination:stateUpdated', {
                    bubbles: true,
                    detail: {
                        page: 1,
                        rowsPerPage: rowsPerPage,
                        totalPages: Math.max(1, Math.ceil(totalCount / rowsPerPage)),
                        totalCount: totalCount
                    }
                }));
            } catch (error) {
                console.error('Error handling search cleared:', error);
            }

            PerformanceTracker.end('handleSearchCleared');
        }

        /**
         * Fetches and applies data for page changes
         */
        async applyDataForPageChange(rows, page, rowsPerPage, columns) {
            PerformanceTracker.start('applyDataForPageChange');
            if (!rows?.length || !columns?.length) {
                PerformanceTracker.end('applyDataForPageChange');
                return;
            }

            try {
                
                const data = await TableDataModule.getPageData(page, rowsPerPage, columns)
                    .then(response => {
                        return response.json();
                    });
               
                this.applyDataToRows(rows, data, columns);
                
                this._dispatchDataEvent('pageDataApplied', { page, rows, data });
                PerformanceTracker.end('applyDataForPageChange');
            } catch (error) {
                console.error('Error fetching page data:', error);
                PerformanceTracker.end('applyDataForPageChange');
                throw error;
            }
        }
        
        /**
         * Fetches and applies data for a new column
         */
        async applyDataForAddedColumn(column, startIndex, rowCount, page) {
            PerformanceTracker.start('applyDataForAddedColumn');
            try {
                let data;
                
                if (TableDataModule.isSearchModeActive?.()) {
                    // Search mode - use search API
                    const adjustedStartIndex = (page - 1) * rowCount;
                    try {
                        const url = `/ProductionHistory/SearchRange?term=${encodeURIComponent(TableDataModule._currentSearchTerm || '')}&type=${encodeURIComponent(TableDataModule._currentSearchType || '')}&startIndex=${adjustedStartIndex}&count=${rowCount}&columns=${encodeURIComponent(column)}`;
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                        data = await response.json();
                    } catch (error) {
                        // Fallback to regular data
                        data = await TableDataModule.getRangeJobData([column], startIndex, rowCount);
                    }
                } else {
                    // Normal mode
                    data = await TableDataModule.getRangeJobData([column], startIndex, rowCount);
                }

                if (!data?.length) {
                    PerformanceTracker.end('applyDataForAddedColumn');
                    return;
                }

                // Find column position and apply data
                const rows = RowManagerModule.getAllRows();
                const headers = ColumnElementManager.getColumnHeaders();
                const columnIndex = headers.indexOf(column);

                if (columnIndex === -1) {
                    PerformanceTracker.end('applyDataForAddedColumn');
                    return;
                }

                this.applyDataToColumn(rows, data, column, columnIndex);
                PerformanceTracker.end('applyDataForAddedColumn');
            } catch (error) {
                console.error(`Error applying data for column ${column}:`, error);
                PerformanceTracker.end('applyDataForAddedColumn');
                throw error;
            }
        }
        
        /**
         * Applies data to specific column cells
         */
        applyDataToColumn(rows, data, columnName, columnIndex) {
            PerformanceTracker.start('applyDataToColumn');
            
            if (!rows?.length || !data?.length) {
                PerformanceTracker.end('applyDataToColumn');
                return;
            }
            
            rows.forEach((rowElement, rowIndex) => {
                if (rowIndex >= data.length) return;
                
                const rowData = data[rowIndex];
                if (!rowData) return;
                
                const cells = RowElementManager.getCellsForRow(rowElement);
                if (columnIndex >= cells.length) return;
                
                // Extract and set value
                const value = this.extractValueFromData(rowData, columnName);
                cells[columnIndex].textContent = value !== null && value !== undefined
                    ? this.formatCellValue(value) : '';
            });
            
            this._dispatchDataEvent('columnDataApplied', { 
                column: columnName, columnIndex, rows, data 
            });
            
            PerformanceTracker.end('applyDataToColumn');
        }

        /**
         * Fetches and applies data for row count changes
         */
        async applyDataForRowCountChange(rows, currentPage, previousRowCount, addedRowCount, columns) {
            PerformanceTracker.start('applyDataForRowCountChange');
           
            if (!rows?.length || !columns?.length) {
                PerformanceTracker.end('applyDataForRowCountChange');
                return;
            }

            try {
                
                const data = await TableDataModule.handleRowCountChange(
                    currentPage, previousRowCount, addedRowCount, columns
                );
                

                this.applyDataToRows(rows, data, columns);
                PerformanceTracker.end('applyDataForRowCountChange');
            } catch (error) {
                console.error('Error fetching data for rows:', error);
                PerformanceTracker.end('applyDataForRowCountChange');
                throw error;
            }
        }

        /**
         * Applies data to table rows
         */
        applyDataToRows(rows, data, columns) {
            PerformanceTracker.start('applyDataToRows');
            console.log("incoming data is", data);
            // Normalize data format
            const rowsData = Array.isArray(data) ? data : (data.rows || []);

            if (!rowsData?.length) {
                PerformanceTracker.end('applyDataToRows');
                return;
            }

            rows.forEach((rowElement, rowIndex) => {
                if (rowIndex >= rowsData.length) return;

                const rowData = rowsData[rowIndex];
                if (!rowData) return;

                const cells = RowElementManager.getCellsForRow(rowElement);

                // Fill each cell with data
                columns.forEach((columnName, colIndex) => {
                    if (colIndex >= cells.length) return;
                    
                    const value = this.extractValueFromData(rowData, columnName);
                    cells[colIndex].textContent = value !== null && value !== undefined
                        ? this.formatCellValue(value) : '';
                });
            });

            this._dispatchDataEvent('dataApplied', { rows, rowsData });
            PerformanceTracker.end('applyDataToRows');
        }

        /**
         * Extracts value from data object
         */
        extractValueFromData(rowData, columnName) {
            // First check for direct property match (works for all columns including Profile Name)
            if (rowData.hasOwnProperty(columnName)) {
                console.log(`Direct match found for ${columnName}: ${rowData[columnName]}`);
                return rowData[columnName];
            }

            // Add debug logging when no match is found
            console.log(`No match found for column ${columnName} in data:`, rowData);
            return null;
        }

        /**
         * Formats cell value for display
         */
        formatCellValue(value) {
            if (value === null || value === undefined) {
                return '';
            } else if (typeof value === 'object') {
                return JSON.stringify(value);
            } else {
                return String(value);
            }
        }

        /**
         * Sends event with data operation details
         */
        _dispatchDataEvent(eventName, detail) {
            document.dispatchEvent(new CustomEvent(`dataApplier:${eventName}`, {
                bubbles: true,
                detail
            }));
        }

        /**
         * Updates current page
         */
        setCurrentPage(page) {
            this.currentPage = page || 1;
        }
    }

    // Public API
    return {
        initialize() {
            PerformanceTracker.start('dataApplierInitialize');
            try {
                if (!instance) {
                    instance = new DataApplier();
                }
            } catch (error) {
                console.error('Error initializing DataApplier:', error);
                PerformanceTracker.end('dataApplierInitialize');
                throw error;
            }
            PerformanceTracker.end('dataApplierInitialize');
            return instance;
        },

        getInstance: () => instance,
        setCurrentPage: (page) => instance?.setCurrentPage(page),
        applyDataForPageChange: (rows, page, rowsPerPage, columns) => 
            instance?.applyDataForPageChange(rows, page, rowsPerPage, columns) || Promise.resolve(),
        applyDataForAddedColumn: (column, startIndex, rowCount, page) => 
            instance?.applyDataForAddedColumn(column, startIndex, rowCount, page) || Promise.resolve(),
        applyDataToRows: (rows, data, columns) => 
            instance?.applyDataToRows(rows, data, columns)
    };
})();