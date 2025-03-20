/**
 * @module ColumnElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of column specific elements and class names
 */
const ColumnElementManager = (function () {
    let instance = null;

    function createColumnElementManager(container) {
        const manager = BaseElementManager.createElementManager('column', container);

        // Setup all the classnames the column module implementation depends on
        const classNames = {
            columnComponent: 'column-component',
            columnHeader: 'column-header',
            columnTitle: 'column-title',
            sortIndicators: 'sort-indicators',
            triangleUp: 'triangle-up',
            triangleDown: 'triangle-down',
            containerAllColumns: 'container-all-columns'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // Column count management
        manager.columnCount = 0;

        // Element access methods
        manager.getColumnInsertionPoint = (forceQuery = false) =>
            manager.getElement(`.${manager.getClassName('containerAllColumns')}`, "getColumnInsertionPoint()", forceQuery);

        // Class name getters
        manager.getColumnComponentClass = () => manager.getClassName('columnComponent');
        manager.getColumnHeaderClass = () => manager.getClassName('columnHeader');
        manager.getColumnTitleClass = () => manager.getClassName('columnTitle');
        manager.getSortIndicatorsClass = () => manager.getClassName('sortIndicators');
        manager.getTriangleUpClass = () => manager.getClassName('triangleUp');
        manager.getTriangleDownClass = () => manager.getClassName('triangleDown');
        manager.getContainerAllColumnsClass = () => manager.getClassName('containerAllColumns');

        // Column count tracking methods
        manager.setColumnCount = function (count) {
            this.columnCount = count;
        };

        manager.getColumnCount = () => manager.columnCount;

        // Column element access
        manager.getAllColumns = function (forceQuery = false) {
            const container = this.getColumnInsertionPoint(forceQuery);
            return container ? container.querySelectorAll(`.${this.getClassName('columnComponent')}`) : [];
        };

        manager.getColumnByIndex = function (index, forceQuery = false) {
            const columns = this.getAllColumns(forceQuery);
            return (index >= 0 && index < columns.length) ? columns[index] : null;
        };

        manager.getColumnHeaders = function (forceQuery = false) {
            const columns = this.getAllColumns(forceQuery);
            const headerTexts = [];

            for (let i = 0; i < columns.length; i++) {
                const titleElement = columns[i].querySelector(`.${this.getClassName('columnTitle')}`);
                if (titleElement) headerTexts.push(titleElement.textContent.trim());
            }

            return headerTexts;
        };

        // Column template methods for DOM creation/insertion 
        manager.createColumnTemplate = function (title) {
            const column = document.createElement('div');
            column.classList.add(this.getClassName('columnComponent'));

            const columnHeader = document.createElement('div');
            columnHeader.classList.add(this.getClassName('columnHeader'));

            const columnTitle = document.createElement('div');
            columnTitle.classList.add(this.getClassName('columnTitle'));
            columnTitle.textContent = title;

            const sortIndicators = document.createElement('span');
            sortIndicators.classList.add(this.getClassName('sortIndicators'));

            const triangleUp = document.createElement('span');
            triangleUp.classList.add(this.getClassName('triangleUp'));

            const triangleDown = document.createElement('span');
            triangleDown.classList.add(this.getClassName('triangleDown'));
            triangleDown.classList.add('disabled');

            sortIndicators.appendChild(triangleUp);
            sortIndicators.appendChild(triangleDown);
            columnHeader.appendChild(columnTitle);
            columnHeader.appendChild(sortIndicators);
            column.appendChild(columnHeader);

            return column;
        };

        return manager;
    }

    // Public API
    return {
        // Initialization
        initialize(container) {
            if (!instance) instance = createColumnElementManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Initialize an instance of all methods
        getColumnInsertionPoint: forceQuery => instance?.getColumnInsertionPoint(forceQuery) ?? null,
        getColumnComponentClass: () => instance?.getColumnComponentClass() ?? 'column-component',
        getColumnHeaderClass: () => instance?.getColumnHeaderClass() ?? 'column-header',
        getColumnTitleClass: () => instance?.getColumnTitleClass() ?? 'column-title',
        getSortIndicatorsClass: () => instance?.getSortIndicatorsClass() ?? 'sort-indicators',
        getTriangleUpClass: () => instance?.getTriangleUpClass() ?? 'triangle-up',
        getTriangleDownClass: () => instance?.getTriangleDownClass() ?? 'triangle-down',
        getContainerAllColumnsClass: () => instance?.getContainerAllColumnsClass() ?? 'container-all-columns',

        setColumnCount: count => instance?.setColumnCount(count),
        getColumnCount: () => instance?.getColumnCount() ?? 0,

        getAllColumns: forceQuery => instance?.getAllColumns(forceQuery) ?? [],
        getColumnByIndex: (index, forceQuery) => instance?.getColumnByIndex(index, forceQuery) ?? null,
        getColumnHeaders: forceQuery => instance?.getColumnHeaders(forceQuery) ?? [],

        createColumnTemplate: title => instance?.createColumnTemplate(title) ?? null,

        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache()
    };
})();