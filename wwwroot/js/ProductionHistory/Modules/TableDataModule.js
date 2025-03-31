/**
 * @title TableDataModule
 * @description Handles data retrieval and event management for table data
 * @author Daniel Oliveira
 */
const TableDataModule = (function () {
    // STATE MANAGEMENT
    const state = {
        mode: 'regular',    // 'regular', 'search', or 'sort'
        search: { term: '', type: '' },
        sort: { column: '', direction: '' },
        currentPage: 1,
        isBusy: false,
        totalCount: null,
        stashedCount: null
    };

    // HELPER METHODS
    const getRowsPerPage = (defaultValue = 10) => DropdownContainerModule?.getSelectedRowCount?.() || defaultValue;
    const getColumns = () => ColumnElementManager.getColumnHeaders() || [];
    const getRowCount = () => RowManagerModule.getRowCount();

    /**
     * Dispatches a data event
     */
    function dispatchEvent(eventName, detail) {
        document.dispatchEvent(new CustomEvent(`tableData:${eventName}`, {
            bubbles: true,
            detail
        }));
    }

    /**
     * Updates pagination state
     */
    function updatePagination(page, totalCount, rowsPerPage) {
        document.dispatchEvent(new CustomEvent('pagination:stateUpdated', {
            bubbles: true,
            detail: {
                page,
                totalPages: Math.max(1, Math.ceil(totalCount / rowsPerPage)),
                totalCount
            }
        }));
    }

    // UNIFIED DATA RETRIEVAL METHODS

    /**
     * Fetches data from the API with standardized error handling
     */
    async function fetchData(endpoint, params = {}) {
        // Build query parameters
        const queryParams = Object.entries(params)
            .flatMap(([key, value]) => {
                if (key === 'columns') {
                    const cols = Array.isArray(value) ? value : [value];
                    return cols.map(c => `columns=${encodeURIComponent(c)}`);
                }
                return [`${key}=${encodeURIComponent(value)}`];
            })
            .join('&');

        const url = `/ProductionHistory/${endpoint}${queryParams ? `?${queryParams}` : ''}`;

        // Execute request
        const response = await fetch(url, {
            headers: { 'Connection': 'keep-alive' }
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const responseData = await response.json();

        // Update totalCount if this is a count endpoint
        if (endpoint === "GetCount") {
            state.totalCount = responseData;
            state.stashedCount = state.totalCount;
        }

      
        return responseData;
    }

    /**
     * Unified method to get data based on current mode and parameters
     * This replaces all the various data retrieval methods (getPageData, getRangeData, etc.)
     */
    async function getData(options = {}) {
        const { startIndex, count, columns, page, rowsPerPage } = options;

        // Calculate startIndex from page and rowsPerPage if not directly provided
        const calculatedStartIndex = startIndex !== undefined ? startIndex :
            (page !== undefined && rowsPerPage !== undefined) ? (page - 1) * rowsPerPage : 0;

        // Use provided count or calculate from rowsPerPage
        const calculatedCount = count !== undefined ? count :
            rowsPerPage !== undefined ? rowsPerPage : 10;

        // Base parameters
        const params = {
            startIndex: calculatedStartIndex,
            count: calculatedCount,
            columns: columns || getColumns()
        };

        // Add search parameters if in search mode
        if (state.mode === 'search' && state.search.term) {
            params.searchTerm = state.search.term;
            params.searchType = state.search.type;
        }

        // Add sort parameters if in sort mode
        if (state.mode === 'sort' && state.sort.column) {
            params.sortColumn = state.sort.column;
            params.sortDirection = state.sort.direction;
        }

        return fetchData('GetData', params);
    }

    /**
     * Unified method to get count based on current mode
     * This replaces all the various count methods (getTotalCount, searchCount, etc.)
     */
    async function getCount() {
        const params = {};

        // Add search parameters if in search mode
        if (state.mode === 'search' && state.search.term) {
            params.searchTerm = state.search.term;
            params.searchType = state.search.type;
        }

        return fetchData('GetCount', params);
    }

    // MODE MANAGEMENT METHODS

    /**
     * Sets search mode
     */
    function setSearchMode(term, type) {
        state.mode = 'search';
        state.search = { term, type };
        state.sort = { column: '', direction: '' };
    }

    /**
     * Sets sort mode
     */
    function setSortMode(column, direction) {
        state.mode = 'sort';
        state.sort = { column, direction };
        state.search = { term: '', type: '' };
    }

    /**
     * Sets regular mode
     */
    function setRegularMode() {
        state.mode = 'regular';
        state.search = { term: '', type: '' };
        state.sort = { column: '', direction: '' };

    }

    /**
     * Activates search mode
     */
    function activateSearch(term, type) {
        setSearchMode(term, type);
    }

    /**
     * Deactivates search mode
     */
    async function deactivateSearch() {
        setRegularMode();
        return await getCount();
    }

    /**
     * Activates sort mode
     */
    function activateSort(column, direction) {
        setSortMode(column, direction);
    }

    /**
     * Deactivates sort mode
     */
    async function deactivateSort() {
        setRegularMode();
        return state.totalCount;
    }

    /**
     * Handles rows added event
     */
    async function handleRowsAdded(rows, count) {
        if (state.isBusy) return;
        if (!rows?.length || !count) return;

        const columns = getColumns();
        if (!columns.length) return;

        state.isBusy = true;
        try {
            const currentRowCount = getRowCount();
            const previousRowCount = currentRowCount - count;
            const startIndex = (state.currentPage - 1) * previousRowCount + previousRowCount;

            // Get data for new rows
            getData({ startIndex, count, columns })
                .then(newRowsData => {
                    // Directly call DataApplierModule
                    DataApplierModule.applyDataToRows(rows, newRowsData, columns);
                })
                .catch(error => {
                    console.error("Error fetching data for new rows:", error);
                })
                .finally(() => {
                    state.isBusy = false;
                });
        } catch (error) {
            console.error("Error handling rows added:", error);
            state.isBusy = false;
        }
    }

    // EVENT HANDLERS

    const handlers = {
        /**
         * Handles page changed event
         */
        async pageChanged(event) {
            if (state.isBusy) return;

            state.isBusy = true;

            const { page, rows, columns, rowsPerPage } = event.detail;
            if (!columns?.length) return;

            try {
                // Update current page
                state.currentPage = page;

                // Get counts if needed
                if (state.totalCount === null) {
                    state.totalCount = await getCount();
                }

                const totalCount = state.totalCount;
                const currentRowsPerPage = rowsPerPage || getRowsPerPage();

                // Calculate items for this page
                const startIndex = (page - 1) * currentRowsPerPage;
                const itemsOnThisPage = Math.min(currentRowsPerPage, totalCount - startIndex);

                // Check for valid page
                if (startIndex >= totalCount) {
                    const maxValidPage = Math.max(1, Math.ceil(totalCount / currentRowsPerPage));

                    dispatchEvent('pageOutOfBounds', {
                        currentPage: page,
                        maxValidPage,
                        totalCount,
                        rowsPerPage: currentRowsPerPage
                    });

                    return;
                }

                // Fetch page data
                const pageData = await getData({
                    page,
                    rowsPerPage: currentRowsPerPage,
                    columns
                });

                // Dispatch event with data
                dispatchEvent('pageDataFetched', {
                    page,
                    rowCount: itemsOnThisPage,
                    totalCount,
                    rows,
                    data: pageData,
                    columns,
                    currentRowCount: getRowCount(),
                    needsRowUpdate: getRowCount() !== itemsOnThisPage
                });

                // Update pagination
         
                updatePagination(page, totalCount, currentRowsPerPage);
            } catch (error) {
                console.error('Error during page change:', error);
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles column added event
         */
        async columnAdded(event) {
            if (state.isBusy) return;

            const { column, page, rowCount, columnIndex } = event.detail;
            if (!column) return;

            state.isBusy = true;
            try {
                const startIndex = (page - 1) * rowCount;
                const columnData = await getData({
                    startIndex,
                    count: rowCount,
                    columns: [column]
                });

                dispatchEvent('columnDataFetched', {
                    column,
                    columnIndex,
                    data: columnData,
                    page,
                    rowCount,
                    startIndex
                });
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles search performed event
         */
        async searchPerformed(event) {
            if (state.isBusy) return;

            const { term, type, rowCount } = event.detail;
            if (!term || !type) return;

            state.isBusy = true;
            try {
                // Activate search mode
                setSearchMode(term, type);

                // Get columns and count
                const columns = getColumns();
                const searchCount = await getCount();

                // Reset to page 1
                state.currentPage = 1;

                // Calculate rows to display
                const rowsPerPage = DropdownContainerModule.getLastSelectedRow();
                const rowsToShow = Math.min(rowsPerPage, searchCount);

                // Fetch search results
                const searchResults = await getData({
                    page: 1,
                    rowsPerPage: rowsToShow,
                    columns
                });

                // Dispatch event with results
                dispatchEvent('searchDataFetched', {
                    term,
                    type,
                    page: 1,
                    rowCount: rowsToShow,
                    totalResults: searchCount,
                    columns,
                    data: searchResults,
                    currentRowCount: getRowCount(),
                    needsRowUpdate: getRowCount() !== rowsToShow
                });

                // Update pagination
                updatePagination(1, searchCount, rowsPerPage);
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles search cleared event
         */
        async searchCleared() {
            if (state.isBusy) return;

            state.isBusy = true;
            try {
                // Deactivate search
                const totalCount = await deactivateSearch();

                // Reset to page 1
                state.currentPage = 1;

                // Get display settings
                const columns = getColumns();
                const rowsPerPage = getRowsPerPage();
                const rowsToShow = Math.min(rowsPerPage, totalCount);

                // Fetch normal data
                const normalData = await getData({
                    page: 1,
                    rowsPerPage: rowsToShow,
                    columns
                });

                // Dispatch event with data
                dispatchEvent('searchCleared', {
                    page: 1,
                    rowCount: rowsToShow,
                    totalCount,
                    columns,
                    data: normalData,
                    currentRowCount: getRowCount(),
                    needsRowUpdate: getRowCount() !== rowsToShow
                });

                // Update pagination
                updatePagination(1, totalCount, rowsPerPage);
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles sort applied event
         */
        async sortApplied(event) {
            if (state.isBusy) return;

            const { column, direction, columns } = event.detail;
            if (!column || !direction || !columns?.length) return;

            state.isBusy = true;
            try {
                // Activate sort mode
                setSortMode(column, direction);

                // Get total count
                
                const totalCount = await getCount();

                // Reset to page 1
                state.currentPage = 1;

                // Get display settings
                const rowsPerPage = getRowsPerPage();
                const rowsToShow = Math.min(rowsPerPage, totalCount);

                // Fetch sorted data
                const sortedData = await getData({
                    page: 1,
                    rowsPerPage: rowsToShow,
                    columns
                });

                // Dispatch event with data
                dispatchEvent('sortDataFetched', {
                    column,
                    direction,
                    page: 1,
                    rowCount: rowsToShow,
                    totalCount,
                    columns,
                    data: sortedData,
                    currentRowCount: getRowCount(),
                    needsRowUpdate: getRowCount() !== rowsToShow
                });

                // Update pagination
                updatePagination(1, totalCount, rowsPerPage);
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles sort cleared event
         */
        async sortCleared() {
            if (state.isBusy) return;

            state.isBusy = true;
            try {
                // Deactivate sort
                const totalCount = await deactivateSort();
                

                // Reset to page 1
                state.currentPage = 1;

                // Get display settings
                const columns = getColumns();
                const rowsPerPage = getRowsPerPage();
                const rowsToShow = Math.min(rowsPerPage, totalCount);

                // Fetch normal data
                const normalData = await getData({
                    page: 1,
                    rowsPerPage: rowsToShow,
                    columns
                });

                // Dispatch event with data
                dispatchEvent('sortCleared', {
                    page: 1,
                    rowCount: rowsToShow,
                    totalCount,
                    columns,
                    data: normalData,
                    currentRowCount: getRowCount(),
                    needsRowUpdate: getRowCount() !== rowsToShow
                });

                // Update pagination
                updatePagination(1, totalCount, rowsPerPage);
            } finally {
                state.isBusy = false;
            }
        },

        /**
         * Handles sort indicator sort event
         */
        sortIndicatorSort(event) {
            const { direction, columnName } = event.detail;

            // Update sort state
            setSortMode(columnName, direction);

            // Trigger data fetch
            document.dispatchEvent(new CustomEvent('sort:applied', {
                bubbles: true,
                detail: {
                    column: columnName,
                    direction,
                    columns: getColumns()
                }
            }));
        }
    };

    // PUBLIC API
    return {
        // Unified data retrieval methods
        getData,
        getCount,

        // Legacy compatibility methods
        getPageData(page, rowsPerPage, columns) {
            return getData({ page, rowsPerPage, columns });
        },

        getTotalCount() {
            return getCount();
        },

        getRangeJobData(columns, startIndex, count) {
            return getData({ columns, startIndex, count });
        },

        handleRowCountChange(currentPage, currentRowCount, rowCountChange, columns) {
            const startIndex = (currentPage - 1) * currentRowCount + currentRowCount;
            return getData({ startIndex, count: rowCountChange, columns });
        },

        // Mode management methods
        activateSearch,
        activateSort,
        deactivateSearch,
        deactivateSort,
        getStoredCount: () => state.totalCount,
        handleRowsAdded,

        // State accessors
        isSearchModeActive: () => state.mode === 'search',
        isSortModeActive: () => state.mode === 'sort',
        getCurrentSearchTerm: () => state.search.term,
        getCurrentSearchType: () => state.search.type,
        getCurrentSortColumn: () => state.sort.column,
        getCurrentSortDirection: () => state.sort.direction,
        getCurrentPage: () => state.currentPage,
        setCurrentPage: (page) => { state.currentPage = page; },

        // Initialization
        initialize() {
            document.addEventListener('pagination:pageChanged', handlers.pageChanged);
            document.addEventListener('columnManager:columnAdded', handlers.columnAdded);
            document.addEventListener('search:performed', handlers.searchPerformed);
            document.addEventListener('search:cleared', handlers.searchCleared);
            document.addEventListener('sort:applied', handlers.sortApplied);
            document.addEventListener('sort:cleared', handlers.sortCleared);
            document.addEventListener('sortIndicator:sort', handlers.sortIndicatorSort);

            return this;
        }
    };
})();