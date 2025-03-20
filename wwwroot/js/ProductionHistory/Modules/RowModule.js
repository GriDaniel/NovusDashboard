/**
 * @module RowManagerModule
 * @author Daniel Oliveira
 * @description Manages the creation and deletion of table rows 
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

        /**
         * Creates a single row element
         */
        createRow() {
            PerformanceTracker.start('createRow');
            const columnCount = ColumnElementManager.getColumnCount();
            const row = RowElementManager.createRowTemplate(columnCount);
            PerformanceTracker.end('createRow');
            return row;
        }

        /**
         * Sets the table to have a specific number of rows
         */
        setRowCount(targetCount) {
            PerformanceTracker.start('setRowCount');

            targetCount = parseInt(targetCount, 10) || 0;
            if (isNaN(targetCount) || targetCount < 0 || targetCount === this.rowCount) {
                PerformanceTracker.end('setRowCount');
                return;
            }

            // Add or remove rows to reach target
            targetCount > this.rowCount
                ? this.addRows(targetCount - this.rowCount)
                : this.removeRows(this.rowCount - targetCount);

            PerformanceTracker.end('setRowCount');
        }

        /**
         * Sets row count with data application
         */
        async setRowCountWithData(targetCount, currentPage, columns) {
            PerformanceTracker.start('setRowCountWithData');

            targetCount = parseInt(targetCount, 10) || 0;
            if (isNaN(targetCount) || targetCount < 0 || targetCount === this.rowCount) {
                PerformanceTracker.end('setRowCountWithData');
                return [];
            }

            // Update current page if module exists
            if (typeof DataApplierModule !== 'undefined' && DataApplierModule.setCurrentPage) {
                DataApplierModule.setCurrentPage(currentPage);
            }

            // Update row count
            this.setRowCount(targetCount);
            PerformanceTracker.end('setRowCountWithData');

            // Return newly added rows for compatibility
            return targetCount > this.rowCount
                ? RowElementManager.getLastNRows(targetCount - this.rowCount)
                : [];
        }

        /**
         * Adds specified number of rows
         */
        addRows(count) {
            PerformanceTracker.start('addRows');

            count = parseInt(count, 10) || 0;
            if (count <= 0) {
                PerformanceTracker.end('addRows');
                return [];
            }

            const fragment = document.createDocumentFragment();
            const addedRows = [];

            // Create all rows at once using fragment
            for (let i = 0; i < count; i++) {
                const row = this.createRow();
                fragment.appendChild(row);
                addedRows.push(row);
            }

            this.rowInsertionPoint.appendChild(fragment);
            this.rowCount += count;

            // Notify about the change
            this._dispatchRowEvent('rowsAdded', { count, rows: addedRows });

            PerformanceTracker.end('addRows');
            return addedRows;
        }

        /**
         * Removes specified number of rows from end
         */
        removeRows(count) {
            PerformanceTracker.start('removeRows');

            count = parseInt(count, 10) || 0;
            if (count <= 0) {
                PerformanceTracker.end('removeRows');
                return;
            }

            const rowsToRemove = Math.min(count, this.rowCount);
            const removedRows = [];

            // Remove rows from the end
            for (let i = 0; i < rowsToRemove; i++) {
                const row = this.rowInsertionPoint.lastChild;
                removedRows.push(row);
                this.rowInsertionPoint.removeChild(row);
            }

            this.rowCount -= rowsToRemove;

            // Notify about the change
            this._dispatchRowEvent('rowsRemoved', { count: rowsToRemove, rows: removedRows });

            PerformanceTracker.end('removeRows');
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

        /**
         * Sends event about row changes
         */
        _dispatchRowEvent(eventName, detail) {
            this.rowInsertionPoint.dispatchEvent(new CustomEvent(`rowManager:${eventName}`, {
                bubbles: true,
                detail
            }));
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
        createRow: () => instance?.createRow() || null,
        setRowCount: (count) => instance?.setRowCount(count),
        setRowCountWithData: (count, page, cols) => instance?.setRowCountWithData(count, page, cols) || Promise.resolve([]),
        addRows: (count) => instance?.addRows(count) || [],
        removeRows: (count) => instance?.removeRows(count),
        deleteAllRows: () => instance?.deleteAllRows(),
        getRowCount: () => instance?.getRowCount() || 0,
        getAllRows: () => instance?.getAllRows() || [],
        getRowByIndex: (index) => instance?.getRowByIndex(index) || null
    };
})();