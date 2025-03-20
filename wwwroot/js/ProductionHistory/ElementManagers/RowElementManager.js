/**
 * @module RowElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of row-specific elements and class names
 */
const RowElementManager = (function () {
    let instance = null;

    function createRowElementManager(container) {
        const manager = BaseElementManager.createElementManager('row', container);

        // Setup all the class names the row module implementation depends on
        const classNames = {
            tableRow: 'table-row',
            columnCell: 'column-cell',
            containerAllRows: 'container-all-rows'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // Element access methods
        manager.getRowInsertionPoint = (forceQuery = false) =>
            manager.getElement(`.${manager.getClassName('containerAllRows')}`, "getRowInsertionPoint()", forceQuery);

        // Class name getters
        manager.getTableRowClass = () => manager.getClassName('tableRow');
        manager.getColumnCellClass = () => manager.getClassName('columnCell');
        manager.getContainerAllRowsClass = () => manager.getClassName('containerAllRows');

        // Row access methods
        manager.getAllRows = function (forceQuery = false) {
            const container = this.getRowInsertionPoint(forceQuery);
            return container ? container.querySelectorAll(`.${this.getClassName('tableRow')}`) : [];
        };

        manager.getRowByIndex = function (index, forceQuery = false) {
            const rows = this.getAllRows(forceQuery);
            return (index >= 0 && index < rows.length) ? rows[index] : null;
        };

        manager.getRowCount = forceQuery => manager.getAllRows(forceQuery).length;

        // Cell access
        manager.getCellsForRow = row =>
            row ? row.querySelectorAll(`.${manager.getClassName('columnCell')}`) : [];

        // Row template generation for DOM creation/insertion
        manager.createRowTemplate = function (columnCount, cellData = '') {
            const row = document.createElement('div');
            row.classList.add(this.getClassName('tableRow'));

            for (let j = 0; j < columnCount; j++) {
                row.appendChild(this.createCellTemplate(cellData));
            }

            return row;
        };

        manager.createCellTemplate = function (cellData = '') {
            const cell = document.createElement('div');
            cell.classList.add(this.getClassName('columnCell'));
            cell.textContent = cellData;
            return cell;
        };

        return manager;
    }

    // Public API
    return {
        initialize(container) {
            if (!instance) instance = createRowElementManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Initialize an instance of all methods
        getRowInsertionPoint: forceQuery => instance?.getRowInsertionPoint(forceQuery) ?? null,
        getTableRowClass: () => instance?.getTableRowClass() ?? 'table-row',
        getColumnCellClass: () => instance?.getColumnCellClass() ?? 'column-cell',
        getContainerAllRowsClass: () => instance?.getContainerAllRowsClass() ?? 'container-all-rows',

        getAllRows: forceQuery => instance?.getAllRows(forceQuery) ?? [],
        getRowByIndex: (index, forceQuery) => instance?.getRowByIndex(index, forceQuery) ?? null,
        getRowCount: forceQuery => instance?.getRowCount(forceQuery) ?? 0,

        getCellsForRow: row => instance?.getCellsForRow(row) ?? [],

        createRowTemplate: (columnCount, cellData) => instance?.createRowTemplate(columnCount, cellData) ?? null,
        createCellTemplate: cellData => instance?.createCellTemplate(cellData) ?? null,

        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache()
    };
})();
