/**
 * @title ColumnManagerModule
 * @description  Manages the creation and deletion of table columns
 * @author Daniel Oliveira
 */
const ColumnManagerModule = (function () {
    let instance = null;

    class ColumnManager {
        constructor() {
            // Verify dependencies
            if (!ColumnElementManager.getInstance()) {
                throw new Error('ColumnElementManager must be initialized before ColumnManagerModule');
            }

            // Initialize SortIndicatorModule if needed
            if (!SortIndicatorElementManager.getInstance()) {
                SortIndicatorElementManager.initialize(document.body);
            }

            if (!SortIndicatorModule.getInstance()) {
                SortIndicatorModule.initialize();
            }

            // Get column insertion point
            this.columnInsertionPoint = ColumnElementManager.getColumnInsertionPoint();
            if (!this.columnInsertionPoint) {
                throw new Error('Column insertion point not found');
            }

            // Set column count from cache
            this.columnCount = ColumnElementManager.getColumnCount();

            // Initialize sort indicators
            this.initializeSortIndicators();
        }

        // INITIALIZATION METHODS

        initializeSortIndicators() {
            ColumnElementManager.getAllColumns(true).forEach((column, index) =>
                this.setupColumnSortIndicators(column, index));
        }

        setupColumnSortIndicators(column, columnIndex) {
            if (!column) return;

            const sortIndicatorPlaceholder = column.querySelector(`.${ColumnElementManager.getSortIndicatorPlaceholderClass()}`);
            if (!sortIndicatorPlaceholder) return;

            // Get column title/name
            const titleElement = column.querySelector(`.${ColumnElementManager.getColumnTitleClass()}`);
            const columnName = titleElement ? titleElement.textContent.trim() : '';

            // Register with SortIndicatorModule with enhanced metadata
            SortIndicatorModule.registerContainer(sortIndicatorPlaceholder, columnIndex, {
                source: 'column',
                columnName: columnName
            });
        }

        // COLUMN CREATION METHODS

        createColumn(title) {
            const column = ColumnElementManager.createColumnTemplate(title);
            const columnIndex = this.columnCount; // Get index before we increment it
            this.setupColumnSortIndicators(column, columnIndex);
            return column;
        }

        addColumns(count, columnHeaders) {
            count = parseInt(count, 10) || 0;
            if (count <= 0) return [];

            const headers = Array.isArray(columnHeaders) ? columnHeaders : [];
            const fragment = document.createDocumentFragment();
            const addedColumns = [];

            // Create the columns
            for (let i = 0; i < count; i++) {
                const columnTitle = (i < headers.length) ?
                    headers[i] : `Column ${this.columnCount + i + 1}`;

                const column = this.createColumn(columnTitle);
                fragment.appendChild(column);
                addedColumns.push(column);
            }

            // Add the columns to the DOM using the insertion point
            ColumnElementManager.appendColumns(addedColumns, this.columnInsertionPoint);
            this.columnCount += count;
            ColumnElementManager.setColumnCount(this.columnCount);

            // Create the row-cells for all the columns
            const createdCells = this.createCellsForColumn(count);

            // Dispatch the event
            this._dispatchColumnEvent('columnsAdded', {
                count,
                columns: addedColumns,
                cells: createdCells
            });
            return addedColumns;
        }

        addColumn(title) {
            return this.addColumns(1, [title])[0];
        }

        // CELL MANAGEMENT METHODS

        createCellsForColumn(columnCount = 1) {
            if (!RowElementManager.getInstance()) {
                console.error('RowElementManager required for createCellsForColumn');
                return [];
            }

            return RowElementManager.createCellsForColumns(columnCount);
        }

        removeCellsAtColumnIndex(columnIndex) {
            if (!RowElementManager.getInstance()) {
                console.error('RowElementManager required for removeCellsAtColumnIndex');
                return;
            }

            RowElementManager.removeCellsAtColumnIndex(columnIndex);
        }

        // COLUMN DELETION METHOD

        deleteColumn(index, columnTitle) {
            if (this.columnCount <= 0) return;

            if (index < 0 || index >= this.columnCount) {
                console.warn('Column index out of bounds');
                return;
            }

            const columns = ColumnElementManager.getAllColumns(true);
            if (!columns || columns.length <= index) return;

            // Remove the column
            const removedColumn = columns[index];

            // Get the sort indicators container
            ColumnElementManager.removeColumn(removedColumn);
            this.removeCellsAtColumnIndex(index);

            // Update the column count
            this.columnCount--;
            ColumnElementManager.setColumnCount(this.columnCount);
            ColumnElementManager.removeColumnByTitle(columnTitle);

            this._dispatchColumnEvent('columnDeleted', {});
        }

        // GETTER METHODS

        getColumnHeaders() {
            return ColumnElementManager.getColumnHeaders(false);
        }

        getColumnCount() {
            return this.columnCount;
        }

        getColumnByIndex(index) {
            return ColumnElementManager.getColumnByIndex(index, true);
        }

        getAllColumns() {
            return ColumnElementManager.getAllColumns(true);
        }

        // EVENT HANDLING

        _dispatchColumnEvent(eventName, detail) {
            this.columnInsertionPoint.dispatchEvent(new CustomEvent(`columnManager:${eventName}`, {
                bubbles: true,
                detail
            }));
        }
    }

    // Public API 
    return {
        initialize() {
            try {
                if (!instance) instance = new ColumnManager();
                return instance;
            } catch (error) {
                console.error('Error initializing ColumnManager:', error);
                throw error;
            }
        },

        getInstance: () => instance,

        // Column manipulation methods
        createColumn: title => instance?.createColumn(title) ?? null,
        addColumns: (count, headers) => instance?.addColumns(count, headers) ?? [],
        addColumn: title => instance?.addColumn(title) ?? null,
        deleteColumn: (index, title) => instance?.deleteColumn(index, title),

        // Getter methods
        getColumnHeaders: () => instance?.getColumnHeaders() ?? [],
        getColumnCount: () => instance?.getColumnCount() ?? 0,
        getColumnByIndex: index => instance?.getColumnByIndex(index) ?? null,
        getAllColumns: () => instance?.getAllColumns() ?? [],
    };
})();