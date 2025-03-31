/**
 * @title RowManagerModule
 * @description  Manages the creation and deletion of table rows
 * @author Daniel Oliveira
 */

const RowManagerModule = (function () {
    let instance = null;

    class RowManager {
        constructor() {
            PerformanceTracker.start('rowManagerInit');

            // Check dependencies
            if (!RowElementManager.getInstance()) {
                throw new Error('RowElementManager must be initialized before RowManagerModule');
            }

            if (!ColumnElementManager.getInstance()) {
                throw new Error('ColumnElementManager must be initialized before RowManagerModule');
            }

            this.rowInsertionPoint = RowElementManager.getRowInsertionPoint();
            if (!this.rowInsertionPoint) {
                throw new Error('Row insertion point not found');
            }

            this.rowCount = RowElementManager.getRowCount();
            PerformanceTracker.end('rowManagerInit');
        }

        // ROW CREATION METHODS

        /**
         * Creates a single row element
         */
        createRow() {
            PerformanceTracker.start('createRow');
            const columnCount = ColumnManagerModule.getColumnCount();
            const row = RowElementManager.createRowTemplate(columnCount);
            PerformanceTracker.end('createRow');
            return row;
        }

        /**
         * Adds specified number of rows
         */
        addRows(count, forceFlag = false) {
            
            PerformanceTracker.start('addRows');

            count = this._validateCount(count);
            if (count <= 0) {
                PerformanceTracker.end('addRows');
                return [];
            }

            const addedRows = [];
            for (let i = 0; i < count; i++) {
                addedRows.push(this.createRow());
            }

            // Use ElementManager for DOM manipulation
            RowElementManager.appendRows(addedRows, this.rowInsertionPoint);
            this.rowCount += count;

            // Notify about the change
            this._handleRowAddedNotification(addedRows, count);

            PerformanceTracker.end('addRows');
            return addedRows;
        }

        /**
         * Removes specified number of rows from end
         */
        removeRows(count) {
            PerformanceTracker.start('removeRows');

            count = this._validateCount(count);
            if (count <= 0) {
                PerformanceTracker.end('removeRows');
                return;
            }

            const rowsToRemove = Math.min(count, this.rowCount);

            // Use ElementManager for DOM manipulation
            const removedRows = RowElementManager.removeLastNRows(rowsToRemove, this.rowInsertionPoint);
            this.rowCount -= rowsToRemove;

            // Notify about the change
           

            PerformanceTracker.end('removeRows');
        }

        // ROW COUNT MANAGEMENT

        /**
         * Sets the table to have a specific number of rows
         */
        setRowCount(targetCount, forceFlag) {
            PerformanceTracker.start('setRowCount');

            targetCount = this._validateCount(targetCount);
            if (targetCount === this.rowCount) {
                PerformanceTracker.end('setRowCount');
                return;
            }

            // Add or remove rows to reach target
            targetCount > this.rowCount
                ? this.addRows(targetCount - this.rowCount, forceFlag)
                : this.removeRows(this.rowCount - targetCount);

            PerformanceTracker.end('setRowCount');
        }

        /**
         * Sets row count with data application
         */
        async setRowCountWithData(targetCount, forceFlag) {
            PerformanceTracker.start('setRowCountWithData');

            targetCount = this._validateCount(targetCount);
            if (targetCount === this.rowCount) {
                PerformanceTracker.end('setRowCountWithData');
                return [];
            }

            // Update row count
            this.setRowCount(targetCount, forceFlag);
            PerformanceTracker.end('setRowCountWithData');

            // Return newly added rows for compatibility
            return targetCount > this.rowCount
                ? RowElementManager.getLastNRows(targetCount - this.rowCount)
                : [];
        }

        /**
         * Clears all rows
         */
        deleteAllRows() {
            PerformanceTracker.start('deleteAllRows');
            if (this.rowCount > 0) {
                this.removeRows(this.rowCount);
            }
            PerformanceTracker.end('deleteAllRows');
        }

        // ROW CONTENT MANAGEMENT

        /**
         * Clears row data without removing row DOM elements
         */
        clearRowData() {
            PerformanceTracker.start('clearRowData');

            const rows = this.getAllRows();

            // Use ElementManager for DOM manipulation
            RowElementManager.clearRowsContent(rows);

            PerformanceTracker.end('clearRowData');
            return rows;
        }

        // ROW STATE MANAGEMENT

        /**
         * Closes all expanded detail panels
         */
        closeAllExpandedRows() {
            PerformanceTracker.start('closeAllExpandedRows');

            const rows = this.getAllRows();

            rows.forEach(row => {
                if (row.dataset.expanded === "true") {
                    RowElementManager.collapseExpandedRow(row);
                }
            });

            PerformanceTracker.end('closeAllExpandedRows');
        }

        // GETTER METHODS

        /**
         * Returns current row count
         */
        getRowCount() {
            return this.rowCount;
        }

        /**
         * Gets all table rows
         */
        getAllRows() {
            return RowElementManager.getAllRows(true);
        }

        /**
         * Gets row at specific index
         */
        getRowByIndex(index) {
            return RowElementManager.getRowByIndex(index, true);
        }

        // UTILITY METHODS

        /**
         * Validate and normalize count input
         */
        _validateCount(count) {
            count = parseInt(count, 10) || 0;
            return Math.max(0, count);
        }

        /**
         * Handle row added notification with pagination checks
         */
        _handleRowAddedNotification(addedRows, count) {
            const maxPageText = PaginationElementManager.getMaxPage().textContent;
            const maxPage = parseInt(maxPageText.match(/\d+/)[0], 10);
            const currentPage = parseInt(PaginationElementManager.getCurrentPage().textContent, 10);
            const totalCount = TableDataModule.getStoredCount;
            
                const itemsRemaining = totalCount - ((maxPage - 1) * DropdownContainerModule.getSelectedRowCount());

                if ((maxPage !== currentPage) || maxPage === 1) {
                    TableDataModule.handleRowsAdded(addedRows, count);
                     
                    
                }
          
        }

       
    }

    // Public API
    return {
        /**
         * Creates manager instance
         */
        initialize() {
            PerformanceTracker.start('rowManagerInitialize');
            try {
                if (!instance) {
                    instance = new RowManager();
                }
            } catch (error) {
                console.error('Error initializing RowManager:', error);
                PerformanceTracker.end('rowManagerInitialize');
                throw error;
            }
            PerformanceTracker.end('rowManagerInitialize');
            return instance;
        },

        getInstance: () => instance,

        // Row creation methods
        createRow: () => instance?.createRow() || null,
        addRows: (count) => instance?.addRows(count) || [],
        removeRows: (count) => instance?.removeRows(count),

        // Row count management
        setRowCount: (count, forceFlag) => instance?.setRowCount(count, forceFlag),
        setRowCountWithData: (count, forceFlag) => instance?.setRowCountWithData(count, forceFlag) || Promise.resolve([]),
        deleteAllRows: () => instance?.deleteAllRows(),

        // Row content management
        clearRowData: () => instance?.clearRowData(),

        // Row state management
        closeAllExpandedRows: () => instance?.closeAllExpandedRows(),

        // Getter methods
        getRowCount: () => instance?.getRowCount() || 0,
        getAllRows: () => instance?.getAllRows() || [],
        getRowByIndex: (index) => instance?.getRowByIndex(index) || null
    };
})();