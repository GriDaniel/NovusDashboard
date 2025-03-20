/**
 * @module TableDataModule
 * @author Daniel Oliveira
 * @description Provides methods for calling C# backend to retrieve data batches
 *              taht are later applied to columns and rows
 */
const TableDataModule = (function () {
    const baseUrl = '/ProductionHistory';

    // Search state
    let _isSearchActive = false;
    let _currentSearchTerm = '';
    let _currentSearchType = '';

    /**
     * Formats column parameters for API requests
     */
    function formatColumnsQuery(columns) {
        const columnArray = Array.isArray(columns) ? columns : [columns];
        return columnArray.map(c => `columns=${encodeURIComponent(c)}`).join('&');
    }

    /**
     * Routes to search or regular data based on state
     */
    async function useSearchOrRegular(regularFetch, searchFetch) {
        return (_isSearchActive && _currentSearchTerm && _currentSearchType)
            ? await searchFetch()
            : await regularFetch();
    }

    /**
     * Fetches page data with pagination
     */
    async function getPageData(page, rowsPerPage, columns) {
        try {
            return await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/GetPageData?page=${page}&rowsPerPage=${rowsPerPage}&${columnsQuery}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                },
                async () => searchData(_currentSearchTerm, _currentSearchType, page, rowsPerPage, columns)
            );
        } catch (error) {
            console.error('Error fetching page data:', error);
            throw error;
        }
    }

    /**
     * Gets total item count
     */
    async function getTotalCount() {
        try {
            return await useSearchOrRegular(
                async () => {
                    const response = await fetch(`${baseUrl}/GetTotalCount`);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                },
                async () => {
                    const url = `${baseUrl}/SearchCount?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error fetching total count:', error);
            throw error;
        }
    }

    /**
     * Fetches data by range
     */
    async function getRangeJobData(columns, startIndex, count) {
        try {
            return await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/GetRangeJobData?startIndex=${startIndex}&count=${count}&${columnsQuery}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                },
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/SearchRange?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}&startIndex=${startIndex}&count=${count}&${columnsQuery}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error fetching range data:', error);
            throw error;
        }
    }

    /**
     * Handles changes to row count
     */
    async function handleRowCountChange(currentPage, currentRowCount, rowCountChange, columns) {
        try {
            return await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/HandleRowCountChange?currentPage=${currentPage}&currentRowCount=${currentRowCount}&rowCountChange=${rowCountChange}&${columnsQuery}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                },
                async () => {
                    // Use SearchRange for search mode
                    const startIndex = (currentPage - 1) * currentRowCount + currentRowCount;
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/SearchRange?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}&startIndex=${startIndex}&count=${rowCountChange}&${columnsQuery}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error handling row count change:', error);
            throw error;
        }
    }

    /**
     * Performs data search
     */
    async function searchData(term, type, page, rowsPerPage, columns) {
        try {
            if (!term || !type) {
                throw new Error('Search term and type are required');
            }

            // Get current row count
            const effectiveRowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() || rowsPerPage;

            const columnsQuery = formatColumnsQuery(columns);
            const url = `${baseUrl}/Search?term=${encodeURIComponent(term)}&type=${encodeURIComponent(type)}&page=${page}&rowsPerPage=${effectiveRowsPerPage}&${columnsQuery}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching data:', error);
            throw error;
        }
    }

    /**
     * Enables search mode
     */
    function activateSearch(term, type) {
        _isSearchActive = true;
        _currentSearchTerm = term;
        _currentSearchType = type;
    }

    /**
     * Disables search mode
     */
    async function deactivateSearch() {
        _isSearchActive = false;
        _currentSearchTerm = '';
        _currentSearchType = '';

        // Refresh count after deactivation
        try {
            return await _fetchTotalCount();
        } catch (error) {
            console.error('Error refreshing count after search deactivation:', error);
            throw error;
        }
    }

    /**
     * Fetches total count directly
     */
    async function _fetchTotalCount() {
        const response = await fetch(`${baseUrl}/GetTotalCount`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
    }

    // Set up event listeners
    document.addEventListener('search:performed', (event) => {
        const { term, type } = event.detail;
        activateSearch(term, type);
    });

    document.addEventListener('search:cleared', () => {
        deactivateSearch();
    });

    // Public API
    return {
        getPageData,
        getTotalCount,
        getRangeJobData,
        handleRowCountChange,
        searchData,
        activateSearch,
        deactivateSearch,
        isSearchModeActive: () => _isSearchActive,
        getCurrentSearchTerm: () => _currentSearchTerm,
        getCurrentSearchType: () => _currentSearchType,
        _currentSearchTerm,
        _currentSearchType
    };
})();