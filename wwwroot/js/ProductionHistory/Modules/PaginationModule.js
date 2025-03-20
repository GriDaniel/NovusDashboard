/**
 * @module PaginationManagerModule
 * @author Daniel Oliveira
 * @description Handles interactions with the pagination buttons and
 *              dynamic setting of the min/max page values
 */
const PaginationModule = (function () {
    let currentPage = 1;
    let totalPages = 1;
    let rowsPerPage = 10; // Default rows per page

    /**
     * Recalculates pages based on total items and updates UI
     */
    async function updateMaxPages() {
        // Get rows per page if available
        if (RowManagerModule?.getRowCount) {
            rowsPerPage = RowManagerModule.getRowCount();
        }

        try {
            const totalItemCount = await TableDataModule.getTotalCount();
            const newTotalPages = Math.max(1, Math.ceil(totalItemCount / rowsPerPage));

            // Only update if changed
            if (newTotalPages !== totalPages) {
                totalPages = newTotalPages;
            }

            // Update page count display
            const maxPageEl = PaginationElementManager.getMaxPage();
            if (maxPageEl) {
                maxPageEl.textContent = `${totalPages} page${totalPages !== 1 ? 's' : ''}`;
            }

            // Fix current page if needed
            if (currentPage > totalPages) {
                await goToPage(totalPages);
            } else {
                updateButtonStates();
            }
        } catch (error) {
            console.error('Error updating pagination:', error);
            totalPages = 1;

            // Reset UI on error
            const maxPageEl = PaginationElementManager.getMaxPage();
            if (maxPageEl) maxPageEl.textContent = '1 page';

            if (currentPage !== 1) await goToPage(1);
        }
    }

    /**
     * Updates page number in the UI
     */
    function updateCurrentPage() {
        const currentPageEl = PaginationElementManager.getCurrentPage();
        if (currentPageEl) {
            currentPageEl.textContent = currentPage;
        }
        updateButtonStates();
    }

    /**
     * Updates navigation button states
     */
    function updateButtonStates() {
        const buttons = {
            prev: PaginationElementManager.getPrevious(),
            fastBack: PaginationElementManager.getFastBackward(),
            next: PaginationElementManager.getNext(),
            fastForward: PaginationElementManager.getFastForward()
        };

        // Disable/enable buttons based on current page
        if (buttons.prev) buttons.prev.classList.toggle('disabled', currentPage <= 1);
        if (buttons.fastBack) buttons.fastBack.classList.toggle('disabled', currentPage <= 1);
        if (buttons.next) buttons.next.classList.toggle('disabled', currentPage >= totalPages);
        if (buttons.fastForward) buttons.fastForward.classList.toggle('disabled', currentPage >= totalPages);
    }

    /**
     * Changes to specified page
     */
    async function goToPage(page) {
        // Ensure page is within valid range
        page = Math.max(1, Math.min(page, totalPages));

        if (page !== currentPage) {
            const previousPage = currentPage;
            currentPage = page;
            updateCurrentPage();

            // Get needed data references
            const rows = RowManagerModule.getAllRows();
            const columns = ColumnElementManager.getColumnHeaders();

            // Notify about page change
            document.dispatchEvent(new CustomEvent('pagination:pageChanged', {
                bubbles: true,
                detail: { previousPage, page: currentPage, rows, columns, rowsPerPage }
            }));
        } else {
            updateButtonStates();
        }
    }

    /**
     * Sets up button click handlers
     */
    function setupEventListeners() {
        const buttons = {
            next: PaginationElementManager.getNext(),
            prev: PaginationElementManager.getPrevious(),
            fastForward: PaginationElementManager.getFastForward(),
            fastBack: PaginationElementManager.getFastBackward()
        };

        // Add click handlers for each button
        if (buttons.next) {
            buttons.next.addEventListener('click', function () {
                if (!this.classList.contains('disabled')) goToPage(currentPage + 1);
            });
        }

        if (buttons.prev) {
            buttons.prev.addEventListener('click', function () {
                if (!this.classList.contains('disabled')) goToPage(currentPage - 1);
            });
        }

        if (buttons.fastForward) {
            buttons.fastForward.addEventListener('click', function () {
                if (!this.classList.contains('disabled')) goToPage(totalPages);
            });
        }

        if (buttons.fastBack) {
            buttons.fastBack.addEventListener('click', function () {
                if (!this.classList.contains('disabled')) goToPage(1);
            });
        }
    }

    /**
     * Sets up listeners for data changes that affect pagination
     */
    function setupRowCountListeners() {
        // Event registration for search events
        document.addEventListener('search:performed', updateMaxPages);
        document.addEventListener('search:cleared', updateMaxPages);
        document.addEventListener('dataApplier:searchApplied', updateMaxPages);
        document.addEventListener('dataApplier:searchCleared', updateMaxPages);
    }

    // Handle row count changes from dropdown
    document.addEventListener('dropdown:rowCountChanged', async (event) => {
        if (event.detail?.rowCount) {
            rowsPerPage = event.detail.rowCount;

            try {
                // Recalculate pagination
                const totalItemCount = await TableDataModule.getTotalCount();
                totalPages = Math.max(1, Math.ceil(totalItemCount / rowsPerPage));

                // Update UI
                const maxPageEl = PaginationElementManager.getMaxPage();
                if (maxPageEl) {
                    maxPageEl.textContent = `${totalPages} page${totalPages !== 1 ? 's' : ''}`;
                }

                // Fix page number if needed
                if (currentPage > totalPages) {
                    await goToPage(totalPages);
                } else {
                    updateButtonStates();
                }

                // Notify about the change
                document.dispatchEvent(new CustomEvent('pagination:rowCountUpdated', {
                    bubbles: true,
                    detail: { page: currentPage, rowsPerPage }
                }));
            } catch (error) {
                console.error('Error updating pagination after row count change:', error);
            }
        }
    });

    // Handle pagination state updates
    document.addEventListener('pagination:stateUpdated', async (event) => {
        if (event.detail) {
            const { page, totalPages: newTotalPages, totalCount } = event.detail;

            // Update total pages directly if provided
            if (newTotalPages !== undefined) {
                totalPages = newTotalPages;
                const maxPageEl = PaginationElementManager.getMaxPage();
                if (maxPageEl) {
                    maxPageEl.textContent = `${totalPages} page${totalPages !== 1 ? 's' : ''}`;
                }
            }
            // Recalculate if total count available
            else if (totalCount !== undefined) {
                // Get current rows per page setting
                const currentRowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() || rowsPerPage;

                // Recalculate pages
                const calculatedTotalPages = Math.max(1, Math.ceil(totalCount / currentRowsPerPage));

                if (calculatedTotalPages !== totalPages) {
                    totalPages = calculatedTotalPages;
                    const maxPageEl = PaginationElementManager.getMaxPage();
                    if (maxPageEl) {
                        maxPageEl.textContent = `${totalPages} page${totalPages !== 1 ? 's' : ''}`;
                    }
                }
            }

            // Update navigation
            updateButtonStates();

            // Fix current page if needed
            if (currentPage > totalPages) {
                await goToPage(totalPages);
            }
        }
    });

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
        updateCurrentPage();
        setupEventListeners();
        setupRowCountListeners();

        // Final sync check after short delay
        setTimeout(async () => {
            await updateMaxPages();
            updateButtonStates();
        }, 100);
    }

    // Public API
    return {
        initialize,
        goToPage,
        updateMaxPages,
        updateButtonStates,
        getCurrentPage: () => currentPage,
        getTotalPages: () => totalPages,
        getRowsPerPage: () => rowsPerPage,
        setRowsPerPage: (count) => {
            if (count > 0) {
                rowsPerPage = count;
                updateMaxPages();
            }
        }
    };
})();