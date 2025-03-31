/**
 * @title DataApplierModule
 * @description Applies data to table rows and columns based on TableDataModule events
 * @author Daniel Oliveira
 */
const DataApplierModule = (function () {
    let instance = null;

    class DataApplier {
        constructor() {
            this.currentPage = 1;
            this.isPageChangeInProgress = false;
            this._initEventListeners();
        }

        // EVENT SETUP

        /**
         * Sets up event listeners for TableDataModule events
         */
        _initEventListeners() {
            // Data events from TableDataModule
            document.addEventListener('tableData:rowDataFetched', this._handleRowDataFetched.bind(this));
            document.addEventListener('tableData:pageDataFetched', this._handlePageDataFetched.bind(this));
            document.addEventListener('tableData:columnDataFetched', this._handleColumnDataFetched.bind(this));
            document.addEventListener('tableData:searchDataFetched', this._handleSearchDataFetched.bind(this));
            document.addEventListener('tableData:searchCleared', this._handleSearchDataCleared.bind(this));
            document.addEventListener('tableData:sortDataFetched', this._handleSortDataFetched.bind(this));
            document.addEventListener('tableData:sortCleared', this._handleSortDataCleared.bind(this));
            document.addEventListener('tableData:pageOutOfBounds', this._handlePageOutOfBounds.bind(this));
            document.addEventListener('columnManager:columnSwapped', this._handleColumnSwapped.bind(this));

            // Legacy event listener for backward compatibility
            document.addEventListener('pagination:pageChanged', (event) => {
                this.currentPage = event.detail.page || 1;
            });
        }

        // EVENT HANDLERS

        /**
         * Applies data when new rows are added
         */
        _handleRowDataFetched(event) {
            const { rows, data, columns, currentPage } = event.detail;
            if (!rows?.length || !data) return;

            // Update current page
            this.currentPage = currentPage;

            // Apply data to rows
            this.applyDataToRows(rows, data, columns);

            this._dispatchDataEvent('dataApplied', { rows, rowsData: data });
        }

        /**
         * Applies data when changing pages
         */
        _handlePageDataFetched(event) {
            const {
                page, rowCount, totalCount, rows,
                data, columns, needsRowUpdate
            } = event.detail;

            // Update page state
            this.currentPage = page;
            this.isPageChangeInProgress = true;

            try {
                let rowsToUpdate;

                if (needsRowUpdate) {
                    // Row count changed - update row count
                    DOMUtils.batchUpdate(() => {
                        if (rowCount > 0) {
                            RowManagerModule.setRowCount(rowCount);
                            rowsToUpdate = RowManagerModule.getAllRows();
                            this.applyDataToRows(rowsToUpdate, data, columns);
                        }
                    });
                } else {
                    // Same row count - just clear data
                    rowsToUpdate = RowManagerModule.clearRowData();
                    this.applyDataToRows(rowsToUpdate, data, columns);
                }

                // Notify other modules
                this._dispatchDataEvent('pageDataApplied', {
                    page,
                    rowCount,
                    totalCount,
                    rows: rowsToUpdate,
                    data
                });
            } catch (error) {
                console.error(`Error applying page data for page ${page}:`, error);
            } finally {
                this.isPageChangeInProgress = false;
            }
        }

        /**
         * Applies data when a column is added
         */
        _handleColumnDataFetched(event) {
            const { column, columnIndex, data, page } = event.detail;
            if (!data) return;

            // Update current page
            this.currentPage = page;

            // Get all rows
            const rows = RowManagerModule.getAllRows();

            // Apply column data
            this.applyDataToColumn(rows, data, column, columnIndex);
        }

        /**
         * Handles data after search/sort/clear operations with common implementation
         */
        _handleFilterOperation(event, operationType) {
            const {
                page, rowCount, columns, data, needsRowUpdate,
                totalCount, totalResults
            } = event.detail;

            const additionalData = {};

            // Get operation-specific data
            if (operationType === 'search') {
                additionalData.term = event.detail.term;
                additionalData.type = event.detail.type;
                additionalData.totalResults = totalResults;
            } else if (operationType === 'sort') {
                additionalData.column = event.detail.column;
                additionalData.direction = event.detail.direction;
                additionalData.totalResults = totalCount;
            } else {
                additionalData.totalResults = totalCount;
            }

            this.isPageChangeInProgress = true;

            try {
                // Update current page
                this.currentPage = page;

                // Process rows based on the common pattern
                const rowsToUpdate = this._updateRowsAndApplyData(rowCount, data, columns, needsRowUpdate);

                // Notification type based on operation
                const eventMap = {
                    'search': 'searchApplied',
                    'searchClear': 'searchCleared',
                    'sort': 'sortApplied',
                    'sortClear': 'sortCleared'
                };

                // Notify other modules
                this._dispatchDataEvent(eventMap[operationType], {
                    page,
                    rowCount,
                    totalResults: additionalData.totalResults,
                    columns,
                    ...additionalData
                });
            } catch (error) {
                console.error(`Error handling ${operationType} operation:`, error);
            } finally {
                this.isPageChangeInProgress = false;
            }
        }

        /**
         * Applies data after search
         */
        _handleSearchDataFetched(event) {
            this._handleFilterOperation(event, 'search');
        }

        /**
         * Applies data after search is cleared
         */
        _handleSearchDataCleared(event) {
            this._handleFilterOperation(event, 'searchClear');
        }

        /**
         * Applies data after sort
         */
        _handleSortDataFetched(event) {
            this._handleFilterOperation(event, 'sort');
        }

        /**
         * Applies data after sort is cleared
         */
        _handleSortDataCleared(event) {
            this._handleFilterOperation(event, 'sortClear');
        }

        /**
         * Handles case when page is out of bounds
         */
        _handlePageOutOfBounds(event) {
            const { currentPage, maxValidPage } = event.detail;

            // Navigate to valid page
            if (PaginationModule?.goToPage && currentPage !== maxValidPage) {
                PaginationModule.goToPage(maxValidPage);
            }
        }

        /**
         * Handles column swap events
         */
        _handleColumnSwapped(event) {
            const { index1, index2 } = event.detail;

            // Get all rows
            const rows = RowManagerModule.getAllRows();
            if (!rows?.length) return;

            // Batch DOM operations for better performance
            DOMUtils.batchUpdate(() => {
                rows.forEach(rowElement => {
                    const cells = RowElementManager.getCellsForRow(rowElement);

                    // Make sure we have both cells
                    if (cells.length > Math.max(index1, index2)) {
                        // Swap content between cells
                        const tempContent = cells[index1].textContent;
                        cells[index1].textContent = cells[index2].textContent;
                        cells[index2].textContent = tempContent;
                    }
                });
            });

            // Notify other modules about the swap
            this._dispatchDataEvent('columnSwapped', event.detail);
        }

        // ROW MANAGEMENT METHODS

        /**
         * Helper method to update rows and apply data with common pattern
         */
        _updateRowsAndApplyData(rowCount, data, columns, needsRowUpdate = true) {
            let rowsToUpdate;

            if (needsRowUpdate) {
                // Row count changed
                DOMUtils.batchUpdate(() => {
                    RowManagerModule.deleteAllRows();
                    if (rowCount > 0) {
                        rowsToUpdate = RowManagerModule.addRows(rowCount);
                    }
                });
            } else {
                // Just clear existing rows
                rowsToUpdate = RowManagerModule.clearRowData();
            }

            // Apply data if we have rows
            if (rowsToUpdate?.length && rowCount > 0 && data) {
                this.applyDataToRows(rowsToUpdate, data, columns);
            }

            return rowsToUpdate;
        }

        // DATA APPLICATION METHODS

        /**
         * Applies data to table rows
         */
        applyDataToRows(rows, data, columns) {
            // Normalize data format
           
            const rowsData = Array.isArray(data) ? data : (data.rows || []);
            if (!rowsData?.length) return;

            // Batch DOM operations
            DOMUtils.batchUpdate(() => {
                rows.forEach((rowElement, rowIndex) => {
                    if (rowIndex >= rowsData.length) return;

                    const rowData = rowsData[rowIndex];
                    if (!rowData) return;

                    this._applyRowData(rowElement, rowData, columns);
                });

                // Close any open detail panels
                RowManagerModule.closeAllExpandedRows();
            });
        }

        /**
         * Applies data to a single row
         */
        _applyRowData(rowElement, rowData, columns) {
          
            const cells = RowElementManager.getCellsForRow(rowElement);

            // Fill each cell with data
            columns.forEach((columnName, colIndex) => {
                if (colIndex >= cells.length) return;

                const value = this.extractValueFromData(rowData, columnName);
                const formattedValue = value !== null && value !== undefined
                    ? this.formatCellValue(value) : '';

                // Update only if content changed
                if (cells[colIndex].textContent !== formattedValue) {
                    cells[colIndex].textContent = formattedValue;
                }
            });
        }

        /**
         * Applies data to a specific column
         */
        applyDataToColumn(rows, data, columnName, columnIndex) {
            if (!rows?.length || !data?.length) return;

            // Batch DOM operations
            DOMUtils.batchUpdate(() => {
                rows.forEach((rowElement, rowIndex) => {
                    if (rowIndex >= data.length) return;

                    const rowData = data[rowIndex];
                    if (!rowData) return;

                    const cells = RowElementManager.getCellsForRow(rowElement);
                    if (columnIndex >= cells.length) return;

                    // Extract and format value
                    const value = this.extractValueFromData(rowData, columnName);
                    const formattedValue = value !== null && value !== undefined
                        ? this.formatCellValue(value) : '';

                    // Update only if content changed
                    if (cells[columnIndex].textContent !== formattedValue) {
                        cells[columnIndex].textContent = formattedValue;
                    }
                });
            });

            // Notify other modules
            this._dispatchDataEvent('columnDataApplied', {
                column: columnName, columnIndex, rows, data
            });
        }

        // DATA HELPERS

        /**
         * Extracts value from data object
         */
        extractValueFromData(rowData, columnName) {
            // Check direct property match
            if (rowData.hasOwnProperty(columnName)) {
                return rowData[columnName];
            }
            return null;
        }

        /**
         * Formats cell value for display
         */
        formatCellValue(value) {
            if (value === null || value === undefined) {
                return '';
            }

            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            return String(value);
        }

        // EVENT DISPATCHING

        /**
         * Dispatches event with data operation details
         */
        _dispatchDataEvent(eventName, detail) {
            document.dispatchEvent(new CustomEvent(`dataApplier:${eventName}`, {
                bubbles: true,
                detail
            }));
        }

        // PUBLIC METHODS

        /**
         * Updates current page and syncs with TableDataModule
         */
        setCurrentPage(page) {
            this.currentPage = page || 1;

            // Forward to TableDataModule
            if (TableDataModule.setCurrentPage) {
                TableDataModule.setCurrentPage(this.currentPage);
            }
        }
    }

    // Public API
    return {
        /**
         * Initializes the module
         */
        initialize() {
            if (!instance) {
                instance = new DataApplier();
            }
            return instance;
        },

        /**
         * Gets the singleton instance
         */
        getInstance: () => instance,

        /**
         * Sets current page
         */
        setCurrentPage: (page) => instance?.setCurrentPage(page),

        /**
         * Applies data to rows (for backward compatibility)
         */
        applyDataToRows: (rows, data, columns) => instance?.applyDataToRows(rows, data, columns)
    };
})();