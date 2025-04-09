/**
 * @module TableInitialization
 * @description Lightweight initialization module with configurable preferences
 */
document.addEventListener('DOMContentLoaded', async function () {
    // Configuration with developer options
    const CONFIG = {
        baseUrl: '',  // Empty for relative URLs
        defaultColumnTitles: ["Name", "Profile Name", "File Path"],
        defaultRowCount: 10,
        apiEndpoints: {
            getPreferences: '/TablePreferences/GetPreferences',
            updateColumns: '/TablePreferences/UpdateColumns',
            updateRowCount: '/TablePreferences/UpdateRowCount'
        },
        useServerPreferences: true, // Developer can set to false to use defaults
        initialPage: 1,
        
    };

    // Utility function for error logging
    const logError = (context, error) => {
        console.error(`[TableInit] ${context}:`, error);
    };

    // Main initialization function
    async function initializeTable() {
        try {
            // Get DOM references
            const areaContainer = document.querySelector('.data-table');
            const rowDropdownContainers = document.querySelectorAll('.dropdown-container');

            // Validate container exists
            if (!areaContainer) {
                throw new Error('Data table container not found');
            }

            // Initialize core modules
            initializeCoreModules(areaContainer);

            // Retrieve and apply preferences
            const prefs = await getTablePreferences();

            // Set up columns
            ColumnManagerModule.addColumns(prefs.columnTitles.length, prefs.columnTitles);

            // Initialize remaining modules
            TableDataModule.initialize();
            DataApplierModule.initialize();

            // Apply row count from preferences
            RowManagerModule.setRowCountWithData(prefs.rowCount, CONFIG.initialPage);
            DropdownContainerModule.initialize(rowDropdownContainers);
            DropdownContainerModule.setSelectedRowCount(prefs.rowCount);

            PaginationModule.initialize();
            TableTitleModule.initialize();

            // Set up handlers for saving preferences
            setupPreferencesPersistence();

           

        } catch (error) {
            logError('Table initialization failed', error);
        }
    }

    // Initialize all core modules
    function initializeCoreModules(container) {
        [
            () => SearchElementManager.initialize(container),
            () => RowElementManager.initialize(container),
            () => ColumnElementManager.initialize(container),
            () => TableElementManager.initialize(container),
            () => DropdownElementManager.initialize(container),
            () => PaginationElementManager.initialize(container),
            () => SearchBarModule.initialize(container),
            () => SortIndicatorElementManager.initialize(container),
            () => ColumnManagerModule.initialize(),
            () => RowManagerModule.initialize(),
            () => SortIndicatorModule.initialize()
        ].forEach(initializer => {
            try {
                initializer();
            } catch (initError) {
                logError(`Module initialization failed`, initError);
            }
        });
    }

    /**
     * Get table preferences from server or use defaults
     */
    async function getTablePreferences() {
        // Default preferences
        const defaultPrefs = {
            columnTitles: CONFIG.defaultColumnTitles,
            rowCount: CONFIG.defaultRowCount
        };

        // Skip server if developer opts out
        if (!CONFIG.useServerPreferences) {
            return defaultPrefs;
        }

        try {
            const response = await fetch(CONFIG.baseUrl + CONFIG.apiEndpoints.getPreferences);
            if (!response.ok) throw new Error(`Server returned ${response.status}`);

            const prefs = await response.json();

            // Validate received preferences
            return {
                columnTitles: (prefs?.columnTitles?.length > 0)
                    ? prefs.columnTitles
                    : CONFIG.defaultColumnTitles,
                rowCount: (prefs?.rowCount >= 5 && prefs?.rowCount <= 35)
                    ? prefs.rowCount
                    : CONFIG.defaultRowCount
            };
        } catch (error) {
            logError('Failed to fetch preferences', error);
            return defaultPrefs;
        }
    }

    /**
     * Set up event handlers to persist preferences when they change
     */
    function setupPreferencesPersistence() {
        // Track column changes
        document.addEventListener('columnManager:columnsChanged', debounce(() => {
            persistColumnTitles();
        }, 500));

        // Track row count changes
        document.addEventListener('dropdown:rowCountChanged', debounce((event) => {
            persistRowCount(event.detail.rowCount);
        }, 500));

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            try {
                const currentTitles = ColumnElementManager.getColumnHeaders();
                const currentRowCount = DropdownContainerModule.getSelectedRowCount();

                // Use sendBeacon for reliable transmission
                navigator.sendBeacon(
                    CONFIG.baseUrl + CONFIG.apiEndpoints.updateColumns,
                    new Blob([JSON.stringify(currentTitles)], { type: 'application/json' })
                );

                navigator.sendBeacon(
                    CONFIG.baseUrl + CONFIG.apiEndpoints.updateRowCount,
                    new Blob([JSON.stringify(currentRowCount)], { type: 'application/json' })
                );
            } catch (error) {
                logError('Failed to save preferences on unload', error);
            }
        });
    }

    /**
     * Persist current column titles to server
     */
    async function persistColumnTitles() {
        if (!CONFIG.useServerPreferences) return;

        try {
            const currentTitles = ColumnElementManager.getColumnHeaders();
            await fetch(CONFIG.baseUrl + CONFIG.apiEndpoints.updateColumns, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTitles)
            });
        } catch (error) {
            logError('Failed to update column titles', error);
        }
    }

    /**
     * Persist current row count to server
     */
    async function persistRowCount(rowCount) {
        if (!CONFIG.useServerPreferences) return;

        try {
            await fetch(CONFIG.baseUrl + CONFIG.apiEndpoints.updateRowCount, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rowCount)
            });
        } catch (error) {
            logError('Failed to update row count', error);
        }
    }

    /**
     * Simple debounce function to prevent excessive API calls
     */
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Execute main initialization
    await initializeTable();

   

});