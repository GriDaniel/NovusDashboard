/**
 * @title ColumnElementManager
 * @description Manages column-related elements, class names, and operations
 * @author Daniel Oliveira
 */
const ColumnElementManager = (function () {
    let instance = null;

    function createColumnElementManager(container) {
        // Create base element manager
        const manager = BaseElementManager.createElementManager('column', container);

        // CLASS NAMES SETUP
        const classNames = {
            columnComponent: 'column-component',
            columnHeader: 'column-header',
            columnTitle: 'column-title',
            containerAllColumns: 'container-all-columns',
            sortIndicatorPlaceholder: 'sort-indicator-placeholder'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // INTERNAL STATE
        const state = {
            columnCount: 0,
            columnTitles: [],
            arrowsVisible: true
        };

        // ELEMENT ACCESS METHODS
        manager.getColumnInsertionPoint = (forceQuery = false) => 
            manager.getElement(`.${manager.getClassName('containerAllColumns')}`, "getColumnInsertionPoint()", forceQuery);

        // CLASS NAME GETTERS
        manager.getColumnComponentClass = () => manager.getClassName('columnComponent');
        manager.getColumnHeaderClass = () => manager.getClassName('columnHeader');
        manager.getColumnTitleClass = () => manager.getClassName('columnTitle');
        manager.getContainerAllColumnsClass = () => manager.getClassName('containerAllColumns');
        manager.getSortIndicatorPlaceholderClass = () => manager.getClassName('sortIndicatorPlaceholder');

        // COLUMN COUNT METHODS
        manager.setColumnCount = function (count) {
            state.columnCount = count;
        };

        manager.getColumnCount = () => state.columnCount;

        // COLUMN TITLE MANAGEMENT
        manager.addColumnTitle = function (title) {
            if (!state.columnTitles.includes(title)) {
                state.columnTitles.push(title);
            }
        };

        manager.swapColumnTitles = function (title1, title2) {
            const index1 = this.getColumnTitleIndex(title1);
            const index2 = this.getColumnTitleIndex(title2);

            if (index1 === -1 || index2 === -1) {
                console.warn(`Cannot swap columns: one or both titles not found (${title1}, ${title2})`);
                return false;
            }

            // Swap titles in the internal array
            [state.columnTitles[index1], state.columnTitles[index2]] = [title2, title1];
            
            return true;
        };

        manager.addColumnTitleAtIndex = function (title, index, newTitle) {
            // Remove existing title to avoid duplicates
            this.removeColumnTitle(title);

            // Ensure index is within bounds
            index = Math.max(0, Math.min(index, state.columnTitles.length));

            // Insert the title at the specified index
            state.columnTitles.splice(index, 0, newTitle);
        };

        manager.removeColumnTitle = function (title) {
            const index = this.getColumnTitleIndex(title);
            
            if (index !== -1) {
                state.columnTitles.splice(index, 1);
            }
        };

        manager.getColumnTitleIndex = function (title) {
            return state.columnTitles.indexOf(title);
        };

        // COLUMN ELEMENT ACCESS
        manager.getAllColumns = function (forceQuery = false) {
            const container = this.getColumnInsertionPoint(forceQuery);
            return container ? container.querySelectorAll(`.${this.getClassName('columnComponent')}`) : [];
        };

        manager.getColumnByIndex = function (index, forceQuery = false) {
            const columns = this.getAllColumns(forceQuery);
            return (index >= 0 && index < columns.length) ? columns[index] : null;
        };

        manager.getColumnHeaders = function (forceQuery = false) {
            // If forceQuery is true, lookup headers from DOM
            if (forceQuery) {
                const columns = this.getAllColumns(true);
                return Array.from(columns)
                    .map(column => {
                        const titleElement = column.querySelector(`.${this.getClassName('columnTitle')}`);
                        return titleElement ? titleElement.textContent.trim() : '';
                    })
                    .filter(Boolean);
            }

            // Return a copy of internal column titles
            return [...state.columnTitles];
        };

        // COLUMN REMOVAL
        manager.removeColumnByTitle = function (title) {
            // Remove from DOM
            const columns = this.getAllColumns();
            for (let column of columns) {
                const titleElement = column.querySelector(`.${this.getClassName('columnTitle')}`);
                if (titleElement && titleElement.textContent.trim() === title) {
                    this.removeColumn(column);
                    // Decrement column count
                    this.setColumnCount(this.getColumnCount() - 1);
                    break;
                }
            }

            // Remove from internal stack
            this.removeColumnTitle(title);
        };

        // DROPDOWN ARROW VISIBILITY
        manager.toggleDropdownArrows = function (visible = true) {
            // Skip if already in desired state
            if (visible === state.arrowsVisible) return;

            // Remove any previously added style
            const existingStyle = document.getElementById('dropdown-arrow-style');
            if (existingStyle) {
                existingStyle.remove();
            }

            if (!visible) {
                const columnContainer = this.getColumnInsertionPoint();

                if (columnContainer) {
                    const style = document.createElement('style');
                    style.id = 'dropdown-arrow-style';
                    style.textContent = `.${this.getClassName('containerAllColumns')} .dropdown-arrow { display: none !important; }`;
                    document.head.appendChild(style);
                }
            }

            // Update tracked state
            state.arrowsVisible = visible;
        };

        // COLUMN TEMPLATE CREATION
        manager.createColumnTemplate = function (title) {
            // Create main column component
            const column = document.createElement('div');
            column.classList.add(this.getClassName('columnComponent'));

            // Create dropdown header cell
            const dropdownHeaderCell = document.createElement('div');
            dropdownHeaderCell.classList.add('header-cell');

            // Create dropdown container
            const dropdownContainer = document.createElement('div');
            dropdownContainer.classList.add('dropdown-container', 'column-title-dropdown');

            // Create control button
            const controlButton = document.createElement('button');
            controlButton.classList.add('data-table__control-btn-column', this.getClassName('columnTitle'));
            controlButton.id = title;

            // Create flexible container for spans
            const flexContainer = document.createElement('div');
            flexContainer.classList.add('d-flex', 'gap-3', 'align-items-center', 'justify-content-center', 'mx-2');

            // Create and append arrow span
            const arrowSpan = document.createElement('span');
            arrowSpan.classList.add('dropdown-arrow');
            flexContainer.appendChild(arrowSpan);
            controlButton.appendChild(flexContainer);

            // Create dropdown content container
            const dropdownContent = document.createElement('div');
            dropdownContent.classList.add('dropdown-content-container');

            // Assemble dropdown structure
            dropdownContainer.appendChild(controlButton);
            dropdownContainer.appendChild(dropdownContent);
            dropdownHeaderCell.appendChild(dropdownContainer);

            // Create sort header cell
            const sortHeaderCell = document.createElement('div');
            sortHeaderCell.classList.add('header-cell');

            // Create sort indicator placeholder
            const sortIndicatorPlaceholder = document.createElement('div');
            sortIndicatorPlaceholder.classList.add(this.getClassName('sortIndicatorPlaceholder'));
            sortHeaderCell.appendChild(sortIndicatorPlaceholder);

            // Register sort indicator
            const indicatorInfo = SortIndicatorModule.registerContainer(sortIndicatorPlaceholder, -1, {
                columnName: title
            });

            // Register sort indicator events
            SortIndicatorModule.registerContainerEvents(sortHeaderCell, sortIndicatorPlaceholder);

            // Assemble column
            column.appendChild(dropdownHeaderCell);
            column.appendChild(sortHeaderCell);

            // Add title to internal stack
            this.addColumnTitle(title);
            DropdownContainerModule.initialize(dropdownContainer);

            return column;
        };

        // BATCH COLUMN OPERATIONS
        manager.appendColumns = function (columns, container) {
            if (!columns?.length || !container) return;

            const fragment = document.createDocumentFragment();
            columns.forEach(column => fragment.appendChild(column));

            DOMUtils.batchUpdate(() => {
                container.appendChild(fragment);
            });
        };

        // COLUMN REMOVAL WITH ANIMATION
        manager.removeColumn = function (column) {
            if (!column) return;

            // Unregister sort indicator
            const sortIndicatorPlaceholder = column.querySelector(`.${this.getClassName('sortIndicatorPlaceholder')}`);
            if (sortIndicatorPlaceholder) {
                SortIndicatorModule.unregisterContainer(sortIndicatorPlaceholder);
            }

            // Remove with batch update for animation
            DOMUtils.batchUpdate(() => {
                column.remove();
            });
        };

        return manager;
    }

    // PUBLIC API
    return {
        // Initialization
        initialize(container) {
            if (!instance) instance = createColumnElementManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Proxy methods to instance with safe fallbacks
        getColumnInsertionPoint: forceQuery => instance?.getColumnInsertionPoint(forceQuery) ?? null,
        getColumnComponentClass: () => instance?.getColumnComponentClass() ?? 'column-component',
        getColumnHeaderClass: () => instance?.getColumnHeaderClass() ?? 'column-header',
        getColumnTitleClass: () => instance?.getColumnTitleClass() ?? 'column-title',
        getContainerAllColumnsClass: () => instance?.getContainerAllColumnsClass() ?? 'container-all-columns',
        getSortIndicatorPlaceholderClass: () => instance?.getSortIndicatorPlaceholderClass() ?? 'sort-indicator-placeholder',

        setColumnCount: count => instance?.setColumnCount(count),
        getColumnCount: () => instance?.getColumnCount() ?? 0,

        getAllColumns: forceQuery => instance?.getAllColumns(forceQuery) ?? [],
        getColumnByIndex: (index, forceQuery) => instance?.getColumnByIndex(index, forceQuery) ?? null,
        getColumnHeaders: forceQuery => instance?.getColumnHeaders(forceQuery) ?? [],

        // Column title management methods
        addColumnTitle: title => instance?.addColumnTitle(title),
        addColumnTitleAtIndex: (title, index, newTitle) => instance?.addColumnTitleAtIndex(title, index, newTitle),
        removeColumnTitle: title => instance?.removeColumnTitle(title),
        removeColumnByTitle: title => instance?.removeColumnByTitle(title),
        getColumnTitleIndex: title => instance?.getColumnTitleIndex(title) ?? -1,
        swapColumnTitles: (title1, title2) => instance?.swapColumnTitles(title1, title2) ?? false,

        // Column manipulation methods
        appendColumns: (columns, container) => {
            if (instance) {
                instance.appendColumns(columns, container);
            }
        },
        removeColumn: column => {
            if (instance) {
                instance.removeColumn(column);
            }
        },
        createColumnTemplate: title => instance?.createColumnTemplate(title) ?? null,

        // Utility methods
        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache(),

        // Dropdown arrow visibility methods
        toggleDropdownArrows: visible => instance?.toggleDropdownArrows(visible),
        hideDropdownArrows: () => instance?.toggleDropdownArrows(false),
        showDropdownArrows: () => instance?.toggleDropdownArrows(true)
    };
})();