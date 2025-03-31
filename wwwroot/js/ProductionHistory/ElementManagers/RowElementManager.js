/**
 * @title RowElementManager
 * @description  Manages row-specific elements and DOM operations
 * @author Daniel Oliveira
 */
const RowElementManager = (function () {
    let instance = null;

    // Define supported columns at module level
    const SUPPORTED_COLUMNS = [
        'Name',
        'File Path',
        'Profile Name',
        'Length',
        'Front-cut Off Distance',
        'Square-up Distance'
    ];

    function createRowElementManager(container) {
        const manager = BaseElementManager.createElementManager('row', container);

        // CLASS NAMES SETUP
        const classNames = {
            tableRow: 'table-row',
            columnCell: 'column-cell',
            containerAllRows: 'container-all-rows'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // ELEMENT ACCESS METHODS
        manager.getRowInsertionPoint = (forceQuery = false) =>
            manager.getElement(`.${manager.getClassName('containerAllRows')}`, "getRowInsertionPoint()", forceQuery);

        manager.getAllRows = function (forceQuery = false) {
            const container = this.getRowInsertionPoint(forceQuery);
            return container ? container.querySelectorAll(`.${this.getClassName('tableRow')}`) : [];
        };

        manager.getRowByIndex = function (index, forceQuery = false) {
            const rows = this.getAllRows(forceQuery);
            return (index >= 0 && index < rows.length) ? rows[index] : null;
        };

        manager.getRowCount = forceQuery => manager.getAllRows(forceQuery).length;

        manager.getCellsForRow = row =>
            row ? row.querySelectorAll(`.${manager.getClassName('columnCell')}`) : [];

        // CLASS NAME GETTERS
        manager.getTableRowClass = () => manager.getClassName('tableRow');
        manager.getColumnCellClass = () => manager.getClassName('columnCell');
        manager.getContainerAllRowsClass = () => manager.getClassName('containerAllRows');

        // ELEMENT CREATION METHODS

        /**
         * Creates a cell template
         */
        manager.createCellTemplate = function (cellData = '') {
            const cell = document.createElement('div');
            cell.classList.add(this.getClassName('columnCell'));
            return cell;
        };

        /**
         * Creates a dropdown arrow for a row
         */
        manager.createDropdownArrow = function () {
            const dropdownArrow = document.createElement('div');
            dropdownArrow.classList.add('table-row-dropdown-arrow');
            return dropdownArrow;
        };

        /**
         * Creates an attribute pair for the detail panel
         */
        manager.createAttributePair = function (attr) {
            const attributePair = document.createElement('div');
            attributePair.className = 'attribute-pair';

            const nameElement = document.createElement('span');
            nameElement.className = 'attribute-name';
            nameElement.textContent = attr.name + ': ';

            const valueElement = document.createElement('span');
            valueElement.className = 'attribute-value';
            valueElement.textContent = attr.value;

            attributePair.appendChild(nameElement);
            attributePair.appendChild(valueElement);

            return attributePair;
        };

        /**
         * Adds row styles to the document (once)
         */
        manager.addRowStyles = function () {
            if (document.getElementById('row-manager-styles')) return;

            const style = document.createElement('style');
            style.id = 'row-manager-styles';
            style.textContent = `
.${this.getClassName('tableRow')} {
    display: flex;
    flex-wrap: wrap;
}
.${this.getClassName('columnCell')} {
    flex-grow: 1;
}
.table-row-dropdown-arrow {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-right: 2px solid #666;
    border-bottom: 2px solid #666;
    transform: rotate(45deg);
    transition: transform 0.3s ease;
    z-index: 500;
}
.table-row-dropdown-arrow.table-row-dropdown-open {
    transform: rotate(-135deg);
}
.detail-panel {
    flex-basis: 100%;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.3s ease-in-out;
    box-sizing: border-box;
    border-top: 1px solid #ddd;
    order: 999; /* Ensures it always appears after all cells */
}

/* Apply the same color convention to the detail panels as their parent rows */
 .detail-panel {
    background-color:  #F1F2F4;
   
}

.detail-panel.expanded {
    max-height: 180px;
    height: 180px;
}
.detail-content {
    padding: 12px 16px;
   
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.detail-header {
    width: 100%;
    margin-bottom: 10px;
    padding-bottom: 6px;
}

.detail-title {
    font-size: 12px;
    font-weight: 400;
    color: #86868b;
    letter-spacing: 0.01em;
    padding-top: 12.5px;
}

.attributes-layout {
    display: flex;
    flex-direction: column;
    gap: 0px 32px;
    width: 100%;
    padding: 4px 0;
}

.attribute-group {
    display: flex;
    flex-direction: column;
    height: auto;
    width: 350px;
}

.attribute-pair {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    height: auto;
    width: auto;
}

.attribute-name {
    font-size: 12px;
    font-weight: 500;
    color: #6B778C;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
    width: 50%;
}

.attribute-value {
    font-size: 13px;
    font-weight: 400;
    color: #1d1d1f;
    word-break: break-word;
    overflow-wrap: break-word;
    width: 50%;
    padding-left: 8px;
    border-left: 1px solid #E9EBEE;
}

/* Row interactivity disabled state */
.rows-not-interactive {
    pointer-events: none;
}
.rows-not-interactive .table-row-dropdown-arrow {
    display: none !important;
}`;

            DOMUtils.batchUpdate(() => {
                document.head.appendChild(style);
            });
        };

        /**
         * Creates a basic row element
         */
        manager.createBaseRow = function (columnCount) {
            // Create row element
            const row = document.createElement('div');
            row.classList.add(this.getClassName('tableRow'));
            row.style.position = "relative";
            row.dataset.expanded = "false";

            // Create dropdown arrow
            const dropdownArrow = this.createDropdownArrow();
            row.appendChild(dropdownArrow);

            // Create and append cells 
            for (let i = 0; i < columnCount; i++) {
                row.appendChild(this.createCellTemplate());
            }

            return row;
        };

        /**
         * Creates a detail panel with error message
         */
        manager.createErrorDetailPanel = function (errorMessage) {
            const detailPanel = document.createElement('div');
            detailPanel.className = 'detail-panel';

            const errorContent = document.createElement('div');
            errorContent.className = 'detail-content';
            errorContent.textContent = errorMessage || 'Unable to load additional information.';
            errorContent.style.color = 'red';

            detailPanel.appendChild(errorContent);
            return detailPanel;
        };

        /**
         * Creates a detail panel with row data
         */
        manager.createDetailPanel = function (rowData, displayedColumns) {
            // Create detail panel
            const detailPanel = document.createElement('div');
            detailPanel.className = 'detail-panel';

            // Create content container
            const detailContent = document.createElement('div');
            detailContent.className = 'detail-content';

            // Create header
            const detailHeader = document.createElement('div');
            detailHeader.className = 'detail-header';

            const detailTitle = document.createElement('div');
            detailTitle.className = 'detail-title';
            detailTitle.textContent = 'Additional Information';

            detailHeader.appendChild(detailTitle);
            detailContent.appendChild(detailHeader);

            // Create layout for attribute pairs
            const attributesLayout = document.createElement('div');
            attributesLayout.className = 'attributes-layout';

            // Find attributes not currently displayed
            const hiddenAttributes = SUPPORTED_COLUMNS.filter(
                col => !displayedColumns.includes(col)
            );

            // Create attribute groups
            if (hiddenAttributes.length === 0) {
                // If no hidden attributes, show a message
                
                attributesLayout.appendChild(messageElem);
            } else {
                // Group attributes into pairs
                for (let i = 0; i < hiddenAttributes.length; i += 2) {
                    const attributeGroup = document.createElement('div');
                    attributeGroup.className = 'attribute-group';

                    // Add first attribute
                    const attr1 = hiddenAttributes[i];
                    attributeGroup.appendChild(this.createAttributePair({
                        name: attr1,
                        value: rowData[attr1] || 'N/A'
                    }));

                    // Add second attribute if available
                    if (i + 1 < hiddenAttributes.length) {
                        const attr2 = hiddenAttributes[i + 1];
                        attributeGroup.appendChild(this.createAttributePair({
                            name: attr2,
                            value: rowData[attr2] || 'N/A'
                        }));
                    }

                    attributesLayout.appendChild(attributeGroup);
                }
            }

            detailContent.appendChild(attributesLayout);
            detailPanel.appendChild(detailContent);

            return detailPanel;
        };

        /**
         * Creates a template for a row with all functionality
         */
        manager.createRowTemplate = function (columnCount) {
            // Add styles to document (once)
            this.addRowStyles();

            // Create base row
            const row = this.createBaseRow(columnCount);

            // Add cell method for row
            this._addCellMethod(row);

            // Set initial interactivity state
            this._setInitialRowInteractivity(row);

            // Set up delegation if not already done
            if (!this._delegationInitialized) {
                this._setupRowDelegation();
            }

            return row;
        };

        /**
         * Adds the addCell method to a row
         */
        manager._addCellMethod = function (row) {
            const mgr = this;

            row.addCell = function (cellData) {
                // Get the detail panel if it exists
                const detailPanel = this.querySelector('.detail-panel');

                // Create the new cell
                const newCell = mgr.createCellTemplate(cellData);

                // If there's a detail panel, insert before it, otherwise just append
                if (detailPanel) {
                    this.insertBefore(newCell, detailPanel);
                } else {
                    this.appendChild(newCell);
                }
            };
        };

        /**
         * Sets initial row interactivity based on displayed columns
         */
        manager._setInitialRowInteractivity = function (row) {
            const shouldBeInteractive = !this._areAllColumnsDisplayed();
            const dropdownArrow = row.querySelector('.table-row-dropdown-arrow');

            DOMUtils.batchUpdate(() => {
                row.style.cursor = shouldBeInteractive ? 'pointer' : 'default';
                if (dropdownArrow) {
                    dropdownArrow.style.display = shouldBeInteractive ? 'block' : 'none';
                }
            });
        };

        /**
         * Checks if all supported columns are displayed
         */
        manager._areAllColumnsDisplayed = function () {
            const currentColumns = ColumnElementManager.getColumnHeaders();
            return SUPPORTED_COLUMNS.every(col => currentColumns.includes(col));
        };

        /**
         * Sets up row click delegation
         */
        manager._setupRowDelegation = function () {
            const container = this.getRowInsertionPoint();
            if (!container) return;

            const mgr = this;

            // Remove rows-not-interactive class if present
            container.classList.remove('rows-not-interactive');

            // Add single event listener for row clicks
            container.addEventListener('click', function (event) {
                // Check if all columns are displayed (we should disable clicks if they are)
                if (mgr._areAllColumnsDisplayed()) return;

                // Find the closest row
                const row = event.target.closest('.' + mgr.getClassName('tableRow'));
                if (!row) return;

                // Handle row click
                mgr._handleRowClick(row);
            });

            // Set up column change watchers
            this._setupColumnChangeListeners();

            // Mark as initialized
            this._delegationInitialized = true;
        };

        /**
         * Handles a row click event
         */
        manager._handleRowClick = function (row) {
            const rowIndex = Array.from(this.getAllRows()).indexOf(row);

            // Toggle expanded state
            const isExpanded = row.dataset.expanded === "true";
            const newState = !isExpanded;

            DOMUtils.batchUpdate(() => {
                row.dataset.expanded = newState ? "true" : "false";

                // Toggle dropdown arrow
                const dropdownArrow = row.querySelector('.table-row-dropdown-arrow');
                if (dropdownArrow) {
                    dropdownArrow.classList.toggle('table-row-dropdown-open', newState);
                }
            });

            // Handle detail panel
            if (newState) {
                this._expandRowDetailPanel(row, rowIndex);
            } else {
                this._collapseRowDetailPanel(row);
            }
        };

        /**
         * Expands a row's detail panel
         */
        manager._expandRowDetailPanel = function (row, rowIndex) {
            // Remove existing panel if it exists
            let detailPanel = row.querySelector('.detail-panel');
            if (detailPanel) {
                row.removeChild(detailPanel);
            }

            // Get current page
            const currentPageEl = PaginationElementManager.getCurrentPage();
            const currentPage = currentPageEl ? parseInt(currentPageEl.textContent) || 1 : 1;

            // Fetch data for this row
            TableDataModule.getPageData(
                currentPage,
                RowManagerModule.getRowCount(),
                SUPPORTED_COLUMNS
            ).then(data => {
                if (!data || !Array.isArray(data) || !data[rowIndex]) {
                    console.error('No data available for row', rowIndex);
                    return;
                }

                // Create detail panel with the row data
                const rowData = data[rowIndex];
                const displayedColumns = ColumnElementManager.getColumnHeaders();
                detailPanel = this.createDetailPanel(rowData, displayedColumns);

                // Add to row and animate
                this._animateDetailPanelOpen(row, detailPanel);
            }).catch(err => {
                console.error('Error fetching row data:', err);

                // Create error panel
                detailPanel = this.createErrorDetailPanel();

                // Add to row and animate
                this._animateDetailPanelOpen(row, detailPanel);
            });
        };

        /**
         * Collapses a row's detail panel
         */
        manager._collapseRowDetailPanel = function (row) {
            const detailPanel = row.querySelector('.detail-panel');
            if (!detailPanel) return;

            DOMUtils.batchUpdate(() => {
                detailPanel.classList.remove('expanded');
            });

            // Remove panel after transition completes
            setTimeout(() => {
                if (detailPanel.parentNode === row) {
                    DOMUtils.batchUpdate(() => {
                        row.removeChild(detailPanel);
                    });
                }
            }, 300);
        };

        /**
         * Animates a detail panel opening
         */
        manager._animateDetailPanelOpen = function (row, detailPanel) {
            DOMUtils.batchUpdate(() => {
                row.appendChild(detailPanel);

                // Force reflow to enable transition
                detailPanel.offsetHeight;
                detailPanel.classList.add('expanded');
            });
        };

        /**
         * Sets up listeners for column changes
         */
        manager._setupColumnChangeListeners = function () {
            document.addEventListener('columnHeaders:refreshed', () => {
                this._updateRowInteractivity();
                this._refreshOpenDetailPanels();
            });

            document.addEventListener('columnManager:columnAdded', () => {
                this._updateRowInteractivity();
                this._refreshOpenDetailPanels();
            });

            document.addEventListener('columnManager:columnDeleted', () => {
                this._updateRowInteractivity();
                this._refreshOpenDetailPanels();
            });

            document.addEventListener('columnTitle:changed', () => {
                this._updateRowInteractivity();
                this._refreshOpenDetailPanels();
            });

            // Trigger a manual update immediately after initialization
            setTimeout(() => this._updateRowInteractivity(), 0);
        };

        /**
         * Updates row interactivity based on displayed columns
         */
        manager._updateRowInteractivity = function () {
            const container = this.getRowInsertionPoint();
            if (!container) return;

            const allRows = this.getAllRows();
            const shouldBeInteractive = !this._areAllColumnsDisplayed();

            // Update container class
            DOMUtils.batchUpdate(() => {
                container.classList.toggle('rows-not-interactive', !shouldBeInteractive);
            });

            // If not interactive, collapse any expanded rows
            if (!shouldBeInteractive) {
                allRows.forEach(row => {
                    if (row.dataset.expanded === "true") {
                        this.collapseExpandedRow(row);
                    }
                });
            }

            // Update individual row styling
            allRows.forEach(row => {
                DOMUtils.batchUpdate(() => {
                    // Update cursor style
                    row.style.cursor = shouldBeInteractive ? 'pointer' : 'default';

                    // Update arrow visibility
                    const arrow = row.querySelector('.table-row-dropdown-arrow');
                    if (arrow) {
                        arrow.style.display = shouldBeInteractive ? 'block' : 'none';
                    }
                });
            });
        };

        /**
         * Refreshes open detail panels with updated data
         */
        manager._refreshOpenDetailPanels = function () {
            const allRows = this.getAllRows();
            const displayedColumns = ColumnElementManager.getColumnHeaders();

            // Get current page
            const currentPageEl = PaginationElementManager.getCurrentPage();
            const currentPage = currentPageEl ? parseInt(currentPageEl.textContent) || 1 : 1;

            // Find rows with expanded panels
            allRows.forEach((row, rowIndex) => {
                if (row.dataset.expanded !== "true") return;

                const detailPanel = row.querySelector('.detail-panel');
                if (!detailPanel) return;

                // Fetch fresh data
                TableDataModule.getPageData(
                    currentPage,
                    RowManagerModule.getRowCount(),
                    SUPPORTED_COLUMNS
                ).then(data => {
                    if (!data || !Array.isArray(data) || !data[rowIndex]) {
                        console.error('No data available for row', rowIndex);
                        return;
                    }

                    const rowData = data[rowIndex];
                    this._updateDetailPanelContent(detailPanel, rowData, displayedColumns);
                }).catch(err => {
                    console.error('Error refreshing detail panel data:', err);
                });
            });
        };

        /**
         * Updates the content of an existing detail panel
         */
        manager._updateDetailPanelContent = function (detailPanel, rowData, displayedColumns) {
            // Find attributes layout
            let attributesLayout = detailPanel.querySelector('.attributes-layout');
            if (!attributesLayout) {
                const detailContent = detailPanel.querySelector('.detail-content');
                if (!detailContent) return;

                attributesLayout = document.createElement('div');
                attributesLayout.className = 'attributes-layout';
                detailContent.appendChild(attributesLayout);
            }

            // Clear existing content
            DOMUtils.batchUpdate(() => {
                attributesLayout.innerHTML = '';

                // Find attributes not currently displayed
                const hiddenAttributes = SUPPORTED_COLUMNS.filter(
                    col => !displayedColumns.includes(col)
                );

                // Create attribute groups
                if (hiddenAttributes.length === 0) {
                    
                } else {
                    // Group attributes into pairs
                    for (let i = 0; i < hiddenAttributes.length; i += 2) {
                        const attributeGroup = document.createElement('div');
                        attributeGroup.className = 'attribute-group';

                        // Add first attribute
                        const attr1 = hiddenAttributes[i];
                        attributeGroup.appendChild(this.createAttributePair({
                            name: attr1,
                            value: rowData[attr1] || 'N/A'
                        }));

                        // Add second attribute if available
                        if (i + 1 < hiddenAttributes.length) {
                            const attr2 = hiddenAttributes[i + 1];
                            attributeGroup.appendChild(this.createAttributePair({
                                name: attr2,
                                value: rowData[attr2] || 'N/A'
                            }));
                        }

                        attributesLayout.appendChild(attributeGroup);
                    }
                }
            });
        };

        // DOM MANIPULATION METHODS

        /**
         * Adds multiple rows to a container using a document fragment
         */
        manager.appendRows = function (rows, container) {
            if (!rows || !rows.length || !container) return;

            const fragment = document.createDocumentFragment();
            rows.forEach(row => fragment.appendChild(row));

            DOMUtils.batchUpdate(() => {
                container.appendChild(fragment);
            });
        };

        /**
         * Removes the last N rows from a container
         */
        manager.removeLastNRows = function (count, container) {
            if (!container || count <= 0) return [];

            const removedRows = [];

            DOMUtils.batchUpdate(() => {
                for (let i = 0; i < count; i++) {
                    if (container.lastChild) {
                        removedRows.push(container.lastChild);
                        container.removeChild(container.lastChild);
                    }
                }
            });

            return removedRows;
        };

        /**
         * Clears the content of all provided rows
         */
        manager.clearRowsContent = function (rows) {
            if (!rows || !rows.length) return;

            DOMUtils.batchUpdate(() => {
                rows.forEach(row => {
                    const cells = this.getCellsForRow(row);
                    cells.forEach(cell => {
                        cell.textContent = '';
                    });
                });
            });
        };

        /**
         * Collapses an expanded row
         */
        manager.collapseExpandedRow = function (row) {
            if (!row || row.dataset.expanded !== "true") return;

            DOMUtils.batchUpdate(() => {
                // Set expanded state to false
                row.dataset.expanded = "false";

                // Remove arrow open class
                const dropdownArrow = row.querySelector('.table-row-dropdown-arrow');
                if (dropdownArrow) {
                    dropdownArrow.classList.remove('table-row-dropdown-open');
                }

                // Find and collapse detail panel
                const detailPanel = row.querySelector('.detail-panel');
                if (detailPanel) {
                    detailPanel.classList.remove('expanded');
                }
            });

            // Remove panel after transition completes
            if (row.querySelector('.detail-panel')) {
                setTimeout(() => {
                    const detailPanel = row.querySelector('.detail-panel');
                    if (detailPanel && detailPanel.parentNode === row) {
                        DOMUtils.batchUpdate(() => {
                            row.removeChild(detailPanel);
                        });
                    }
                }, 300);
            }
        };

        /**
         * Creates cells for columns across all rows
         */
        manager.createCellsForColumns = function (columnCount) {
            const rows = this.getAllRows(true);
            const createdCells = [];

            DOMUtils.batchUpdate(() => {
                rows.forEach(row => {
                    for (let j = 0; j < columnCount; j++) {
                        const cell = this.createCellTemplate('');
                        row.appendChild(cell);
                        createdCells.push(cell);
                    }
                });
            });

            return createdCells;
        };

        /**
         * Removes cells at a specific column index from all rows
         */
        manager.removeCellsAtColumnIndex = function (columnIndex) {
            const rows = this.getAllRows(true);

            DOMUtils.batchUpdate(() => {
                rows.forEach(row => {
                    const cells = this.getCellsForRow(row);
                    if (cells?.length > columnIndex) {
                        cells[columnIndex].remove();
                    }
                });
            });
        };

        // Set module-level SUPPORTED_COLUMNS reference
        manager.SUPPORTED_COLUMNS = SUPPORTED_COLUMNS;

        return manager;
    }

    // PUBLIC API
    return {
        // Initialization
        initialize(container) {
            if (!instance) instance = createRowElementManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Element access methods
        getRowInsertionPoint: forceQuery => instance?.getRowInsertionPoint(forceQuery) ?? null,
        getAllRows: forceQuery => instance?.getAllRows(forceQuery) ?? [],
        getRowByIndex: (index, forceQuery) => instance?.getRowByIndex(index, forceQuery) ?? null,
        getRowCount: forceQuery => instance?.getRowCount(forceQuery) ?? 0,
        getCellsForRow: row => instance?.getCellsForRow(row) ?? [],

        // Class name getters
        getTableRowClass: () => instance?.getTableRowClass() ?? 'table-row',
        getColumnCellClass: () => instance?.getColumnCellClass() ?? 'column-cell',
        getContainerAllRowsClass: () => instance?.getContainerAllRowsClass() ?? 'container-all-rows',

        // Element creation methods
        createRowTemplate: (columnCount, cellData) => instance?.createRowTemplate(columnCount, cellData) ?? null,
        createCellTemplate: cellData => instance?.createCellTemplate(cellData) ?? null,
        createAttributePair: attr => instance?.createAttributePair(attr) ?? null,

        // DOM manipulation methods
        appendRows: (rows, container) => {
            if (instance) instance.appendRows(rows, container);
        },
        removeLastNRows: (count, container) => {
            if (instance) return instance.removeLastNRows(count, container);
            return [];
        },
        clearRowsContent: (rows) => {
            if (instance) instance.clearRowsContent(rows);
        },
        collapseExpandedRow: (row) => {
            if (instance) instance.collapseExpandedRow(row);
        },
        createCellsForColumns: (columnCount) => instance?.createCellsForColumns(columnCount) ?? [],
        removeCellsAtColumnIndex: (columnIndex) => instance?.removeCellsAtColumnIndex(columnIndex),

        // Base methods
        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache(),

        // Module constants
        SUPPORTED_COLUMNS
    };
})();