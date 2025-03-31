/**
 * @title SortIndicatorModule
 * @description  Registers sort indicators and manages sorting state and events
 * @author Daniel Oliveira
 */
const SortIndicatorModule = (function () {
    let instance = null;

    // Track all registered indicators and the active sort
    const indicators = new Map();
    let activeSort = { container: null, element: null, direction: null, columnIndex: null, source: null };

    class SortIndicatorManager {
        constructor() {
            // No initialization needed
        }

        // REGISTRATION METHODS

        /**
         * Registers a container for sort indicators
         */
        registerContainer(container, columnIndex, options = {}) {
            if (!container) return null;

            // Check if this container is already registered
            if (indicators.has(container)) {
                return indicators.get(container);
            }

            // Create sort indicator elements if they don't exist
            let element = container.querySelector(`.${SortIndicatorElementManager.getSortIndicatorsClass()}`);
            let needsEventSetup = false;

            if (!element) {
                element = SortIndicatorElementManager.createSortIndicatorTemplate();
                container.appendChild(element);
                needsEventSetup = true;
            }

            // Store in map with metadata
            const indicatorInfo = {
                container,
                element,
                columnIndex,
                isActive: false,
                direction: null,
                source: options.source || 'column', // Default to column if not specified
                columnName: options.columnName || '',
                ...options
            };

            indicators.set(container, indicatorInfo);

            // Set up event listeners if needed
            if (needsEventSetup) {
                this.setupSortIndicatorEvents(indicatorInfo);
            }

            return indicatorInfo;
        }

        /**
         * Unregisters a container from sort indicator management
         */
        unregisterContainer(container) {
            if (!container || !indicators.has(container)) return;

            const info = indicators.get(container);

            // If this is the active sort, clear it
            if (activeSort.container === container) {
                activeSort = { container: null, element: null, direction: null, columnIndex: null, source: null };
            }

            // Remove from map
            indicators.delete(container);
        }

        // EVENT HANDLING METHODS

        /**
         * Sets up event handling for sort indicator clicks
         */
        setupSortIndicatorEvents(indicatorInfo) {
            const { element, container } = indicatorInfo;
            const upTriangle = element.querySelector(`.${SortIndicatorElementManager.getTriangleUpClass()}`);
            const downTriangle = element.querySelector(`.${SortIndicatorElementManager.getTriangleDownClass()}`);

            if (!upTriangle || !downTriangle) return;

            upTriangle.addEventListener('click', e => {
                this.handleSortIndicatorClick(indicatorInfo, 'up');
            });

            downTriangle.addEventListener('click', e => {
                this.handleSortIndicatorClick(indicatorInfo, 'down');
            });
        }

        /**
         * Registers click events for a parent container to trigger sort indicator toggling
         */
        registerContainerEvents(parentContainer, indicatorContainer) {
            if (!parentContainer || !indicatorContainer) return;

            // Check if the indicator container is registered
            const indicatorInfo = indicators.get(indicatorContainer);
            if (!indicatorInfo) return;

            // Remove any existing click handlers to prevent duplicates
            if (parentContainer._sortClickHandler) {
                parentContainer.removeEventListener('click', parentContainer._sortClickHandler);
            }

            // Create click handler
            parentContainer._sortClickHandler = (e) => {
                // Prevent triggering if click is on the sort indicator itself
                if (e.target.closest(`.${SortIndicatorElementManager.getSortIndicatorsClass()}`)) {
                    return;
                }

                // Toggle sort direction
                const currentDirection = indicatorInfo.direction;
                const newDirection = !currentDirection ? 'up' :
                    currentDirection === 'up' ? 'down' : 'up';

                // Trigger sort
                this.handleSortIndicatorClick(indicatorInfo, newDirection);
            };

            // Add click handler to parent container
            parentContainer.addEventListener('click', parentContainer._sortClickHandler);
        }

        /**
         * Handles a sort indicator click event
         */
        handleSortIndicatorClick(indicatorInfo, direction) {
            const { container, element, columnIndex, source, columnName } = indicatorInfo;

            // Toggle if same container/direction is already active
            if (activeSort.container === container && activeSort.direction === direction) {
                this.clearAllSortIndicators();
                return;
            }

            // Clear all indicators
            this.clearAllSortIndicators();

            // Clear search if active
            SearchBarModule.clearSearch();

            // Set active indicator state using ElementManager
            SortIndicatorElementManager.setTriangleState(element, direction, true);

            // Update active sort state
            activeSort = {
                container,
                element,
                direction,
                columnIndex,
                source,
                columnName
            };

            indicatorInfo.isActive = true;
            indicatorInfo.direction = direction;

            // NEW CODE: Update linked indicators of the other source type
            if (source === 'column') {
                // Find and update matching dropdown indicators
                indicators.forEach(info => {
                    if (info.source === 'dropdown' && info.columnName === columnName) {
                        info.isActive = true;
                        info.direction = direction;
                        SortIndicatorElementManager.setTriangleState(info.element, direction, true);
                    }
                });
            } else if (source === 'dropdown') {
                // Find and update matching column indicators
                indicators.forEach(info => {
                    if (info.source === 'column' && info.columnName === columnName) {
                        info.isActive = true;
                        info.direction = direction;
                        SortIndicatorElementManager.setTriangleState(info.element, direction, true);
                    }
                });
            }

            // Dispatch event for backend communication
            this.dispatchSortEvent(container, columnIndex, direction, source, columnName);
        }

        // STATE MANAGEMENT METHODS

        /**
         * Clears all sort indicators and resets dropdown indicators
         */
        clearAllSortIndicatorsReset() {
            const indicatorsToRemove = [];

            indicators.forEach(info => {
                // Check if this is a dropdown-specific indicator
                if (info.source === 'dropdown') {
                    // Mark for removal from the indicators Map
                    indicatorsToRemove.push(info.container);

                    // Remove the element from the DOM using ElementManager
                    SortIndicatorElementManager.removeIndicator(info.element);
                } else {
                    // For standard column indicators, just reset their state
                    SortIndicatorElementManager.clearIndicator(info.element);
                }

                info.isActive = false;
                info.direction = null;
            });

            // Remove dropdown indicators from the Map
            indicatorsToRemove.forEach(container => {
                indicators.delete(container);
            });

            // Reset active sort state
            activeSort = { container: null, element: null, direction: null, columnIndex: null, source: null };
        }

        /**
        *  Updates the sort indicators if a column title was changed
        */
        updateColumnIndicators(oldTitle, newTitle) {
            // Find indicators with oldTitle and newTitle
            let oldTitleIndicator = null;
            let newTitleIndicator = null;

            indicators.forEach(info => {
                if (info.source === 'column') {
                    if (info.columnName === oldTitle) {
                        oldTitleIndicator = info;
                    } else if (info.columnName === newTitle) {
                        newTitleIndicator = info;
                    }
                }
            });

            // CASE 1: If old title indicator is active but new title indicator doesn't exist
            if (oldTitleIndicator && oldTitleIndicator.isActive && !newTitleIndicator) {
                // Clear just the old indicator's state
                SortIndicatorElementManager.clearIndicator(oldTitleIndicator.element);
                oldTitleIndicator.isActive = false;
                oldTitleIndicator.direction = null;

                // Update oldTitleIndicator name
                oldTitleIndicator.columnName = newTitle;

                // If this is the active sort, clear it
                if (activeSort.container === oldTitleIndicator.container) {
                    activeSort = { container: null, element: null, direction: null, columnIndex: null, source: null };
                }

                return;
            }

            // Only proceed with swapping if both indicators exist
            if (oldTitleIndicator && newTitleIndicator) {
                // Case 2: Old title indicator is active
                if (oldTitleIndicator.isActive) {
                    // Swap column names
                    oldTitleIndicator.columnName = newTitle;
                    newTitleIndicator.columnName = oldTitle;

                    // Swap active state
                    oldTitleIndicator.isActive = false;
                    newTitleIndicator.isActive = true;

                    // Swap direction
                    const oldDirection = oldTitleIndicator.direction;
                    newTitleIndicator.direction = oldDirection;
                    oldTitleIndicator.direction = null;

                    // Update visual indicators
                    SortIndicatorElementManager.clearIndicator(oldTitleIndicator.element);
                    SortIndicatorElementManager.setTriangleState(newTitleIndicator.element, oldDirection, true);

                    // Update active sort
                    if (activeSort.container === oldTitleIndicator.container) {
                        activeSort = {
                            container: newTitleIndicator.container,
                            element: newTitleIndicator.element,
                            direction: oldDirection,
                            columnIndex: newTitleIndicator.columnIndex,
                            source: newTitleIndicator.source,
                            columnName: oldTitle // Keep the old title in active sort
                        };
                    }
                }
                // Case 3: New title indicator is active
                else if (newTitleIndicator.isActive) {
                    // Swap column names
                    oldTitleIndicator.columnName = newTitle;
                    newTitleIndicator.columnName = oldTitle;

                    // Swap active state
                    newTitleIndicator.isActive = false;
                    oldTitleIndicator.isActive = true;

                    // Swap direction
                    const newDirection = newTitleIndicator.direction;
                    oldTitleIndicator.direction = newDirection;
                    newTitleIndicator.direction = null;

                    // Update visual indicators
                    SortIndicatorElementManager.clearIndicator(newTitleIndicator.element);
                    SortIndicatorElementManager.setTriangleState(oldTitleIndicator.element, newDirection, true);

                    // Update active sort
                    if (activeSort.container === newTitleIndicator.container) {
                        activeSort = {
                            container: oldTitleIndicator.container,
                            element: oldTitleIndicator.element,
                            direction: newDirection,
                            columnIndex: oldTitleIndicator.columnIndex,
                            source: oldTitleIndicator.source,
                            columnName: newTitle // Keep the new title in active sort
                        };
                    }
                } else {
                    // Just swap column names
                    oldTitleIndicator.columnName = newTitle;
                    newTitleIndicator.columnName = oldTitle;
                }
            } else if (oldTitleIndicator && !newTitleIndicator) {
                // Case 4: Only old title exists, just update its column name
                oldTitleIndicator.columnName = newTitle;
            }
        }

        /**
        *  Synchronizes active sort in the column display with the active sort in the sort dropdown
        */
        syncDropdownWithActiveSort(dropdownId) {
           

            // Get the active sort
            const active = this.getActiveSort();

            // If there's no active sort or it's from a dropdown, nothing to do
            if (!active.container || active.source === 'dropdown') {
                return;
            }

            

            // Find all dropdown indicators
            let dropdownIndicators = [];
            indicators.forEach(info => {
                if (info.source === 'dropdown' && info.parentDropdownId === dropdownId) {
                    dropdownIndicators.push(info);
                }
            });

            // Find the dropdown indicator with the matching column name
            const matchingIndicator = dropdownIndicators.find(info =>
                info.columnName === active.columnName
            );

            if (matchingIndicator) {
               

                // Activate the matching indicator with the same direction
                SortIndicatorElementManager.setTriangleState(
                    matchingIndicator.element,
                    active.direction,
                    true
                );

                // Update indicator info
                matchingIndicator.isActive = true;
                matchingIndicator.direction = active.direction;

                // Return the info to update the dropdown's tracking variables
                return matchingIndicator;
            }

           
            return null;
        }
      
        /**
         * Clears all sort indicators to inactive state
         */
        clearAllSortIndicators() {
            indicators.forEach(info => {
                SortIndicatorElementManager.clearIndicator(info.element);
                info.isActive = false;
                info.direction = null;
            });

            activeSort = { container: null, element: null, direction: null, columnIndex: null, source: null };

            document.dispatchEvent(new CustomEvent('sort:cleared', {
                bubbles: true
            }));
        }

        // EVENT DISPATCHING

        /**
         * Dispatches custom event for sort actions
         */
        dispatchSortEvent(container, columnIndex, direction, source, columnName) {
            document.dispatchEvent(new CustomEvent('sortIndicator:sort', {
                bubbles: true,
                detail: {
                    container,
                    columnIndex,
                    direction,
                    source,
                    columnName: columnName || container.textContent.trim()
                }
            }));
        }

        // GETTER METHODS

        /**
         * Gets information about the currently active sort
         */
        getActiveSort() {
            return { ...activeSort };
        }

        /**
         * Gets all registered indicators
         */
        getAllIndicators() {
            return new Map(indicators);
        }
    }

    // Public API
    return {
        /**
         * Initializes the SortIndicatorModule
         */
        initialize() {
            if (!instance) {
                instance = new SortIndicatorManager();
            }
            return instance;
        },

        /**
         * Gets the singleton instance
         */
        getInstance() {
            return instance;
        },

        /**
         * Registers a container for sort indicators
         */
        registerContainer(container, columnIndex, options) {
            return instance?.registerContainer(container, columnIndex, options) || null;
        },

        /**
         * Registers click events for a parent container to trigger sort indicator toggling
         */
        registerContainerEvents(parentContainer, indicatorContainer) {
            return instance?.registerContainerEvents(parentContainer, indicatorContainer);
        },

        /**
         * Handles a sort indicator click
         */
        handleSortIndicatorClick(container, direction) {
            const info = indicators.get(container);
            if (info) {
                instance?.handleSortIndicatorClick(info, direction);
            }
        },

        /**
         * Clears all sort indicators
         */
        clearAllSortIndicators() {
            return instance?.clearAllSortIndicators();
        },

        /**
         * Clears all sort indicators and resets dropdown indicators
         */
        clearAllSortIndicatorsReset() {
            return instance?.clearAllSortIndicatorsReset();
        },

        isColumnSorted(columnIndex) {
            return instance?.isColumnSorted(columnIndex) || false;
        },

        /**
         * Gets information about the currently active sort
         */
        getActiveSort() {
            return instance?.getActiveSort() || {
                container: null,
                element: null,
                direction: null,
                columnIndex: null,
                source: null
            };
        },

        updateColumnIndicators(oldTitle, newTitle) {
            return instance?.updateColumnIndicators(oldTitle, newTitle);
        },

        /**
         * Unregisters a container
         */
        unregisterContainer(container) {
            return instance?.unregisterContainer(container);
        },

        syncDropdownWithActiveSort(dropdownId) {
            return instance?.syncDropdownWithActiveSort(dropdownId) || null;
        },

        /**
         * Gets all registered indicators
         */
        getAllIndicators() {
            return instance?.getAllIndicators() || new Map();
        }
    };
})();