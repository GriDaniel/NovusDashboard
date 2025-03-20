/**
 * @module ColumnManagerModule
 * @author Daniel Oliveira
 * @description Manages the creation and deletion of table columns 
 */
const ColumnManagerModule = (function () {
    let instance = null;
    let activeSort = { column: null, direction: null };

    class ColumnManager {
        constructor() {
            // Verify that the dependency on the column element manager is established
            if (!ColumnElementManager.getInstance()) {
                throw new Error('ColumnElementManager must be initialized before ColumnManagerModule');
            }
            // Define the insertion point for appending columns
            this.columnInsertionPoint = ColumnElementManager.getColumnInsertionPoint();
            if (!this.columnInsertionPoint) {
                throw new Error('Column insertion point not found');
            }
            // Set a local reference for the column count using the cached value
            this.columnCount = ColumnElementManager.getColumnCount();

            // Initialize the setup for the sort indicators
            this.initializeSortIndicators();
        }

        // Manage the state of the sort (ascending and descending) button indicators
        initializeSortIndicators() {
            ColumnElementManager.getAllColumns(true).forEach(column =>
                this.setupColumnSortIndicators(column));
        }

        setupColumnSortIndicators(column) {
            if (!column) return;

            const sortIndicators = column.querySelector(`.${ColumnElementManager.getSortIndicatorsClass()}`);
            if (!sortIndicators) return;

            const upTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleUpClass()}`);
            const downTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleDownClass()}`);
            if (!upTriangle || !downTriangle) return;

            // Apply styles to the sort indicators
            DOMUtils.batchUpdate(() => {
               
                [upTriangle, downTriangle].forEach(triangle => {
                    triangle.classList.add('disabled');
                    triangle.style.cursor = 'pointer';
                    triangle.style.scale = 1.5;
                });

               
                sortIndicators.style.gap = '10px';
                sortIndicators.style.marginBottom = '6px';
            });

            // Add event listeners
            upTriangle.addEventListener('click', e => {
                e.stopPropagation();
                this.handleSortIndicatorClick(column, 'up');
            });

            downTriangle.addEventListener('click', e => {
                e.stopPropagation();
                this.handleSortIndicatorClick(column, 'down');
            });
        }

        handleSortIndicatorClick(column, direction) {
            const columnIndex = Array.from(ColumnElementManager.getAllColumns(true)).indexOf(column);

            // Toggle the sort indicator if it has the same column/direction
            if (activeSort.column === column && activeSort.direction === direction) {
                this.clearAllSortIndicators();
                activeSort = { column: null, direction: null };
                return;
            }
            // Clear all other sort indicators to ensure only one is active at a time
            this.clearAllSortIndicators();

            // Get the indicators for this column
            const sortIndicators = column.querySelector(`.${ColumnElementManager.getSortIndicatorsClass()}`);
            const upTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleUpClass()}`);
            const downTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleDownClass()}`);

            // Enable the singular sort indicator that was clicked
            DOMUtils.batchUpdate(() => {
                if (direction === 'up') {
                    upTriangle.classList.remove('disabled');
                } else {
                    downTriangle.classList.remove('disabled');
                }
            });

            // Update the sort indicator state
            activeSort = { column, direction };

            // Dispatch the event
            this._dispatchColumnEvent('columnSort', { columnIndex, direction, column });
        }

        // Disables all sort indicators
        clearAllSortIndicators() {
            const columns = ColumnElementManager.getAllColumns(true);

            DOMUtils.batchUpdate(() => {
                columns.forEach(column => {
                    const sortIndicators = column.querySelector(`.${ColumnElementManager.getSortIndicatorsClass()}`);
                    if (!sortIndicators) return;

                    const upTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleUpClass()}`);
                    const downTriangle = sortIndicators.querySelector(`.${ColumnElementManager.getTriangleDownClass()}`);

                    // Initiate disable 
                    if (upTriangle) upTriangle.classList.add('disabled');
                    if (downTriangle) downTriangle.classList.add('disabled');
                });
            });
        }

        // Create a column with a title
        createColumn(title) {
            const column = ColumnElementManager.createColumnTemplate(title);
            this.setupColumnSortIndicators(column);
            return column;
        }

        // addColumn extender incase multiple column addition is necessary
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
            this.columnInsertionPoint.appendChild(fragment);
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

        // Add a singular column with a title
        addColumn(title) {
            return this.addColumns(1, [title])[0];
        }

        // Creates the row-cells for 1 (assumed) column
        createCellsForColumn(columnCount = 1) {
            const createdCells = [];

            if (!RowElementManager.getInstance()) {
                console.error('RowElementManager required for createCellsForColumn');
                return createdCells;
            }

            const rows = RowElementManager.getAllRows(true);
            if (!rows.length) return createdCells;

            // Add cells to each row
            rows.forEach(row => {
                for (let j = 0; j < columnCount; j++) {
                    const cell = RowElementManager.createCellTemplate('');
                    row.appendChild(cell);
                    createdCells.push(cell);
                }
            });

            return createdCells;
        }


        //Delete a column by its index and title
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

            // Reset the sort indicator if a column that had it active was deleted
            if (activeSort.column === removedColumn) {
                activeSort = { column: null, direction: null };
            }

            removedColumn.remove();
            this.removeCellsAtColumnIndex(index);

            // Update the column count
            this.columnCount--;
            ColumnElementManager.setColumnCount(this.columnCount);

            // Dispatch the event
            this._dispatchColumnEvent('columnRemoved', {
                index,
                column: removedColumn,
                title: columnTitle
            });
        }

        // Removes the row-cells for the deleted column
        removeCellsAtColumnIndex(columnIndex) {
            if (!RowElementManager.getInstance()) {
                console.error('RowElementManager required for removeCellsAtColumnIndex');
                return;
            }

            const rows = RowElementManager.getAllRows(true);

            // Remove the cell at the index from each row
            rows.forEach(row => {
                const cells = RowElementManager.getCellsForRow(row);
                if (cells?.length > columnIndex) {
                    cells[columnIndex].remove();
                }
            });
        }

        // Getters
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

        getActiveSort() {
            return { ...activeSort };
        }

        // Event handling
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

        // Initialize an instance of all methods
        createColumn: title => instance?.createColumn(title) ?? null,
        addColumns: (count, headers) => instance?.addColumns(count, headers) ?? [],
        addColumn: title => instance?.addColumn(title) ?? null,
        deleteColumn: (index, title) => instance?.deleteColumn(index, title),

        getColumnHeaders: () => instance?.getColumnHeaders() ?? [],
        getColumnTitles: () => instance?.getColumnTitles() ?? [],
        getColumnCount: () => instance?.getColumnCount() ?? 0,
        getColumnByIndex: index => instance?.getColumnByIndex(index) ?? null,
        getAllColumns: () => instance?.getAllColumns() ?? [],
        getActiveSort: () => instance?.getActiveSort() ?? { column: null, direction: null }
    };
})();