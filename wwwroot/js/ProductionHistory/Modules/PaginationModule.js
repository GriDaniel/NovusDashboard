/**
 * @title PaginationModule
 * @description  Handles pagination interactions and dynamic page navigation
 * @author Daniel Oliveira
 */
const PaginationModule = (function () {
    // Core state
    let currentPage = 1;
    let totalPages = 1;
    let rowsPerPage = 10; // Default rows per page

    // Navigation tracking
    let pendingNavigations = new Map(); // Maps page numbers to timestamps
    let lastDispatchedPage = null;

    // Request cancellation
    let abortController = null;

    // PAGE STATE MANAGEMENT METHODS

    /**
     * Recalculates pages based on total items and updates UI
     */
    async function updateMaxPages() {
        try {
            rowsPerPage = DropdownContainerModule.getSelectedRowCount();

            // Fetch count directly
            const totalItemCount = await TableDataModule.getTotalCount();
            const newTotalPages = Math.max(1, Math.ceil(totalItemCount / rowsPerPage));

            // Update if needed
            if (newTotalPages !== totalPages) {
                totalPages = newTotalPages;
                updateMaxPageUI();
            }

            // Fix page if needed
            if (currentPage > totalPages) {
                goToPage(totalPages);
            } else {
                updateButtonStates();
            }
        } catch (error) {
            console.error('Error updating pagination:', error);
            totalPages = 1;
            updateMaxPageUI();

            if (currentPage !== 1) goToPage(1);
        }
    }

   

    function setMaxPage(pages) {
        // Ensure valid number
        pages = Math.max(1, Math.floor(pages));

        // Only update if changed
        if (pages !== totalPages) {
            totalPages = pages;
            updateMaxPageUI();

        }

        return totalPages;
    }

    // UI UPDATE METHODS

    /**
     * Updates current page display in the UI
     */
    function updateCurrentPageUI() {
        PaginationElementManager.setCurrentPageText(currentPage);
    }

    /**
     * Updates max page display in the UI
     */
    function updateMaxPageUI() {
        PaginationElementManager.setMaxPageText(totalPages);
    }

    /**
     * Updates navigation button states
     */
    function updateButtonStates() {
        PaginationElementManager.updateButtonStates(currentPage, totalPages);
    }

    // NAVIGATION METHODS

    /**
     * Changes to specified page with optimized event dispatching
     */
    function goToPage(page, forceFlag) {
        // Ensure page is within valid range
        page = Math.max(1, Math.min(page, totalPages));
       
        // Only process valid page changes
        if (page !== null) {
            const previousPage = currentPage;

            // Update state immediately
            currentPage = page;
            updateCurrentPageUI();
            updateButtonStates();

            // Dispatch event with minimal delay
            
            dispatchPageChangeEvent(previousPage, currentPage, forceFlag);
        } else {
            // Just update UI
            updateButtonStates();
        }

        // Return a resolved promise to maintain API compatibility
        return Promise.resolve();
    }

    // EVENT HANDLING METHODS

    /**
     * Creates and dispatches a page change event with minimal delay
     */
    function dispatchPageChangeEvent(previousPage, newPage, forceFlag) {
       
        // Cancel any in-progress request
        if (abortController) {
            abortController.abort();
        }
       
        // Create a new abort controller for this request
        abortController = new AbortController();

        // Get required data synchronously
        const rows = RowManagerModule.getAllRows();
        const columns = ColumnElementManager.getColumnHeaders();

        // Record this navigation attempt
        const timestamp = Date.now();
        pendingNavigations.set(newPage, timestamp);
        lastDispatchedPage = newPage;

        // Only dispatch if needed data is available
        if (!columns || !rows) {
            console.error('Missing data - cannot dispatch page change event');
            return;
        }
      
        // Dispatch event immediately without waiting
        if (!forceFlag) {
            requestAnimationFrame(() => {
                // Only dispatch if this is still the most recent request
                if (pendingNavigations.get(newPage) === timestamp) {
                    document.dispatchEvent(new CustomEvent('pagination:pageChanged', {
                        bubbles: true,
                        detail: {
                            previousPage,
                            page: newPage,
                            rows,
                            columns,
                            rowsPerPage,
                            signal: abortController.signal,
                            timestamp
                        }
                    }));
                }
            });
        }
    }

    /**
     * Sets up event listeners with optimized handlers
     */
    function setupEventListeners() {
        setupNavigationButtonListeners();
        setupDataEventListeners();
        setupSortSearchEventListeners();
        setupRowCountChangeListener();
        setupPaginationStateListener();
    }

    function setupNavigationButtonListeners() {
        const buttons = {
            next: PaginationElementManager.getNext(),
            prev: PaginationElementManager.getPrevious(),
            fastForward: PaginationElementManager.getFastForward(),
            fastBack: PaginationElementManager.getFastBackward()
        };

        // Add optimized click handlers
        if (buttons.next) {
            buttons.next.addEventListener('click', function(e) {
                if (!this.classList.contains('disabled')) {
                    e.preventDefault();
                    goToPage(currentPage + 1);
                }
            });
        }

        if (buttons.prev) {
            buttons.prev.addEventListener('click', function(e) {
                if (!this.classList.contains('disabled')) {
                    e.preventDefault();
                    goToPage(currentPage - 1);
                }
            });
        }

        if (buttons.fastForward) {
            buttons.fastForward.addEventListener('click', function(e) {
                if (!this.classList.contains('disabled')) {
                    e.preventDefault();
                    goToPage(totalPages);
                }
            });
        }

        if (buttons.fastBack) {
            buttons.fastBack.addEventListener('click', function(e) {
                if (!this.classList.contains('disabled')) {
                    e.preventDefault();
                    goToPage(1);
                }
            });
        }
    }

    function setupDataEventListeners() {
        // Listen for data loading completion
        document.addEventListener('dataApplier:pageDataApplied', function(event) {
            // Clean up navigation tracking
            if (event.detail?.page) {
                pendingNavigations.delete(event.detail.page);
            }
        });
    }

    function setupSortSearchEventListeners() {
        // Handle sorting and search events
        document.addEventListener('sort:applied', (event) => {
            if (event.detail && currentPage !== 1) {
                goToPage(1);
            }
        });

        document.addEventListener('sort:cleared', (event) => {
            if (currentPage !== 1) {
                goToPage(1);
            }
        });

        document.addEventListener('search:performed', (event) => {
            if (currentPage !== 1) {
                goToPage(1, true);
            }
        });

        document.addEventListener('search:cleared', (event) => {
            if (currentPage !== 1) {
                goToPage(1, true);
            }
        });
    }

    function setupRowCountChangeListener() {
        // Handle row count changes
        document.addEventListener('dropdown:rowCountChanged', async (event) => {
            if (event.detail?.rowCount) {
                rowsPerPage = event.detail.rowCount;
                
                try {
                    // Recalculate pagination
                    const totalItemCount = TableDataModule.getStoredCount();
                    console.log("stored coint is", totalItemCount);
                    totalPages = Math.max(1, Math.ceil(totalItemCount / rowsPerPage));
                    
                    // Update UI
                    updateMaxPageUI();
                    
                    // Fix page if needed
                    if (currentPage > totalPages) {
                        
                       
                    } else {
                        updateButtonStates();
                        // Notify about the change
                        
                        document.dispatchEvent(new CustomEvent('pagination:rowCountUpdated', {
                            bubbles: true,
                            detail: { page: currentPage, rowsPerPage }
                        }));
                    }
                } catch (error) {
                    console.error('Error updating pagination after row count change:', error);
                }
            }
        });
    }

    function setupPaginationStateListener() {
        // Handle pagination state updates
        document.addEventListener('pagination:stateUpdated', (event) => {
            if (event.detail) {
                const { page, totalPages: newTotalPages, totalCount } = event.detail;
                
                // Update total pages if provided
                if (newTotalPages !== undefined) {
                    totalPages = newTotalPages;
                    updateMaxPageUI();
                    
                    if (totalPages === 1) {
                        DropdownContainerModule.enableAllResults(totalCount);
                        DropdownContainerModule.setSelectedRowCount(totalCount);
                    } else {
                        DropdownContainerModule.disableAllResults();
                    }
                }
                // Recalculate if total count available
                else if (totalCount !== undefined) {
                    const currentRowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() || rowsPerPage;
                    const calculatedTotalPages = Math.max(1, Math.ceil(totalCount / currentRowsPerPage));

                    if (calculatedTotalPages !== totalPages) {
                        totalPages = calculatedTotalPages;
                        updateMaxPageUI();
                    }
                }

                // Update navigation
                updateButtonStates();

                // Fix page if needed
                if (currentPage > totalPages) {
                    goToPage(totalPages);
                }
            }
        });
    }

    // INITIALIZATION

    /**
     * Sets up the pagination system
     */
    async function initialize() {
        // Get initial rows per page setting
        if (DropdownContainerModule?.getSelectedRowCount) {
            rowsPerPage = DropdownContainerModule.getSelectedRowCount();
        }

        await updateMaxPages();
        currentPage = 1;  // Start at first page
        updateCurrentPageUI();
        setupEventListeners();

        // Final sync check after short delay
        setTimeout(() => {
            updateMaxPages();
        }, 100);
    }

    // Public API
    return {
        initialize,
        goToPage,
        updateMaxPages,
        updateButtonStates,
        setMaxPage,
        getCurrentPage: () => currentPage,
        getTotalPages: () => totalPages,
        getRowsPerPage: () => rowsPerPage,
        getPendingNavigationCount: () => pendingNavigations.size
    };
})();