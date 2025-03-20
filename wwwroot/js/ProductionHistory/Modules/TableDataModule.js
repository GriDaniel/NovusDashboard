/**
 * @module TableDataModule
 * @author Daniel Oliveira
 * @description Provides methods for calling C# backend to retrieve data batches
 *              that are later applied to columns and rows
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
        
        // DEBUG: Log columns being requested
        console.log('[DEBUG] Columns requested:', columnArray);
        
        // DEBUG: Check if Profile Name is in requested columns
        if (columnArray.includes('Profile Name')) {
            console.log('[DEBUG] Profile Name is in the requested columns');
        }
        
        return columnArray.map(c => `columns=${encodeURIComponent(c)}`).join('&');
    }

    /**
     * Routes to search or regular data based on state
     */
    async function useSearchOrRegular(regularFetch, searchFetch) {
        // DEBUG: Log search state
        console.log(`[DEBUG] Search active: ${_isSearchActive}, Term: ${_currentSearchTerm}, Type: ${_currentSearchType}`);
        
        // DEBUG: Special tracking for Profile Name search
        if (_isSearchActive && _currentSearchType === 'Profile Name') {
            console.log('[DEBUG] Performing search with Profile Name as the search type');
        }
        
        return (_isSearchActive && _currentSearchTerm && _currentSearchType)
            ? await searchFetch()
            : await regularFetch();
    }

    /**
     * Fetches page data with pagination
     */
    async function getPageData(page, rowsPerPage, columns) {
        try {
            console.log(`[DEBUG] getPageData called - page: ${page}, rowsPerPage: ${rowsPerPage}`);
            
            const data = await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/GetPageData?page=${page}&rowsPerPage=${rowsPerPage}&${columnsQuery}`;
                    console.log(`[DEBUG] Fetching regular page data with URL: ${url}`);
                    
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const data = await response.json();
                    
                    // DEBUG: Check response for Profile Name data
                    console.log(`[DEBUG] Received ${data.length} rows of data`);
                    if (columns.includes('Profile Name')) {
                        console.log('[DEBUG] Checking response for Profile Name values:');
                        data.forEach((item, index) => {
                            console.log(`[DEBUG] Row ${index} - Profile Name value: ${JSON.stringify(item['Profile Name'])}`);
                        });
                    }
                    
                    return data;
                },
                async () => searchData(_currentSearchTerm, _currentSearchType, page, rowsPerPage, columns)
            );
            
            return data;
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
                    console.log('[DEBUG] Fetching regular total count');
                    const response = await fetch(`${baseUrl}/GetTotalCount`);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    return await response.json();
                },
                async () => {
                    const url = `${baseUrl}/SearchCount?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}`;
                    console.log(`[DEBUG] Fetching search count with URL: ${url}`);
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
            console.log(`[DEBUG] getRangeJobData called - startIndex: ${startIndex}, count: ${count}`);
            
            const data = await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/GetRangeJobData?startIndex=${startIndex}&count=${count}&${columnsQuery}`;
                    console.log(`[DEBUG] Fetching range data with URL: ${url}`);
                    
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const data = await response.json();
                    
                    // DEBUG: Check response for Profile Name data
                    if (columns.includes('Profile Name')) {
                        console.log('[DEBUG] Checking range response for Profile Name values:');
                        data.forEach((item, index) => {
                            console.log(`[DEBUG] Range row ${index} - Profile Name value: ${JSON.stringify(item['Profile Name'])}`);
                        });
                    }
                    
                    return data;
                },
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/SearchRange?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}&startIndex=${startIndex}&count=${count}&${columnsQuery}`;
                    console.log(`[DEBUG] Fetching search range with URL: ${url}`);
                    
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const data = await response.json();
                    
                    // DEBUG: Check response for Profile Name data in search results
                    if (columns.includes('Profile Name')) {
                        console.log('[DEBUG] Checking search range response for Profile Name values:');
                        data.forEach((item, index) => {
                            console.log(`[DEBUG] Search range row ${index} - Profile Name value: ${JSON.stringify(item['Profile Name'])}`);
                        });
                    }
                    
                    return data;
                }
            );
            
            return data;
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
            console.log(`[DEBUG] handleRowCountChange - page: ${currentPage}, currentRowCount: ${currentRowCount}, change: ${rowCountChange}`);
            
            return await useSearchOrRegular(
                async () => {
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/HandleRowCountChange?currentPage=${currentPage}&currentRowCount=${currentRowCount}&rowCountChange=${rowCountChange}&${columnsQuery}`;
                    console.log(`[DEBUG] Handling row count change with URL: ${url}`);
                    
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                    const data = await response.json();
                    
                    // DEBUG: Check response for Profile Name data
                    if (columns.includes('Profile Name')) {
                        console.log('[DEBUG] Checking row count change response for Profile Name values:');
                        data.forEach((item, index) => {
                            console.log(`[DEBUG] Row count change row ${index} - Profile Name value: ${JSON.stringify(item['Profile Name'])}`);
                        });
                    }
                    
                    return data;
                },
                async () => {
                    // Use SearchRange for search mode
                    const startIndex = (currentPage - 1) * currentRowCount + currentRowCount;
                    const columnsQuery = formatColumnsQuery(columns);
                    const url = `${baseUrl}/SearchRange?term=${encodeURIComponent(_currentSearchTerm)}&type=${encodeURIComponent(_currentSearchType)}&startIndex=${startIndex}&count=${rowCountChange}&${columnsQuery}`;
                    console.log(`[DEBUG] Handling row count change in search mode with URL: ${url}`);
                    
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

            console.log(`[DEBUG] searchData called - term: "${term}", type: "${type}", page: ${page}`);
            
            // Special debugging for Profile Name searches
            if (type === 'Profile Name') {
                console.log('[DEBUG] Performing search with Profile Name as the search type');
            }

            // Get current row count
            const effectiveRowsPerPage = DropdownContainerModule?.getSelectedRowCount?.() || rowsPerPage;
            console.log(`[DEBUG] effectiveRowsPerPage: ${effectiveRowsPerPage}`);

            const columnsQuery = formatColumnsQuery(columns);
            const url = `${baseUrl}/Search?term=${encodeURIComponent(term)}&type=${encodeURIComponent(type)}&page=${page}&rowsPerPage=${effectiveRowsPerPage}&${columnsQuery}`;
            console.log(`[DEBUG] Search URL: ${url}`);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            
            console.log(`[DEBUG] Search returned ${data.length} results`);
            
            // Check if Profile Name is in the requested columns and in search results
            if (columns.includes('Profile Name')) {
                console.log('[DEBUG] Checking search results for Profile Name values:');
                data.forEach((item, index) => {
                    console.log(`[DEBUG] Search result ${index} - Profile Name value: ${JSON.stringify(item['Profile Name'])}`);
                    console.log(`[DEBUG] Full row data for result ${index}:`, item);
                });
            }
            
            return data;
        } catch (error) {
            console.error('Error searching data:', error);
            throw error;
        }
    }

    /**
     * Enables search mode
     */
    function activateSearch(term, type) {
        console.log(`[DEBUG] Activating search - term: "${term}", type: "${type}"`);
        
        // Special debugging for Profile Name searches
        if (type === 'Profile Name') {
            console.log('[DEBUG] Activating search with Profile Name as the search type');
        }
        
        _isSearchActive = true;
        _currentSearchTerm = term;
        _currentSearchType = type;
    }

    /**
     * Disables search mode
     */
    async function deactivateSearch() {
        console.log('[DEBUG] Deactivating search');
        
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
        console.log('[DEBUG] Fetching total count directly');
        const response = await fetch(`${baseUrl}/GetTotalCount`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
    }

    // Set up event listeners
    document.addEventListener('search:performed', (event) => {
        const { term, type } = event.detail;
        console.log(`[DEBUG] 'search:performed' event received - term: "${term}", type: "${type}"`);
        activateSearch(term, type);
    });

    document.addEventListener('search:cleared', () => {
        console.log('[DEBUG] \'search:cleared\' event received');
        deactivateSearch();
    });

    // Add utility function to check response data structure
    function _debugInspectObject(obj, label = '') {
        console.log(`[DEBUG] Inspecting object${label ? ' ' + label : ''}:`, obj);
        console.log(`[DEBUG] Object type: ${typeof obj}`);
        console.log(`[DEBUG] Keys: ${Object.keys(obj).join(', ')}`);
        
        // Special check for Profile fields
        const profileKey = Object.keys(obj).find(key => key === 'Profile' || key === 'Profile Name');
        if (profileKey) {
            console.log(`[DEBUG] Found profile key: ${profileKey} with value:`, obj[profileKey]);
        }
    }

    // Initialize - add debug log
    console.log('[DEBUG] TableDataModule initialized');

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
        // Debug helper exposed for debugging in browser console
        debug: {
            inspectObject: _debugInspectObject,
            checkProfileName: (data) => {
                console.log('[DEBUG] Manually checking data for Profile Name:');
                if (Array.isArray(data)) {
                    data.forEach((item, index) => {
                        console.log(`[DEBUG] Item ${index} - Profile Name: ${JSON.stringify(item['Profile Name'])}`);
                        if (item.Profile) {
                            console.log(`[DEBUG] Item ${index} - Profile object:`, item.Profile);
                        }
                    });
                } else {
                    console.log('[DEBUG] Data is not an array, checking single object');
                    console.log(`[DEBUG] Profile Name: ${JSON.stringify(data['Profile Name'])}`);
                    if (data.Profile) {
                        console.log('[DEBUG] Profile object:', data.Profile);
                    }
                }
            }
        }
    };
})();