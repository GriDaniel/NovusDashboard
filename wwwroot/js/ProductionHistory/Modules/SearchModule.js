/**
 * @title SearchBarModule
 * @description   Manages the interaction with the search bar and dispatches
 *                search events to the system
 * @author Daniel Oliveira
 */
const SearchBarModule = (function () {
    // Module state
    const elements = {};
    let currentSearchType = '';
    let searchTimeout = null;
    const SEARCH_DELAY = 300; // ms delay after typing

    // SEARCH LOGIC METHODS

    /**
     * Extracts search type from placeholder text
     */
    function extractSearchType(placeholder) {
        if (!placeholder) return '';
        const match = placeholder.match(/Search by (.+)/i);
        return match?.[1]?.trim() || '';
    }

    /**
     * Performs search with current input
     */
    function performSearch() {
        const searchTerm = elements.input.value.trim();

        if (searchTerm.length === 0) {
            document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }));
            return;
        }

        const searchType = extractSearchType(elements.input.placeholder || '');

        // Get current row count
        const rowCount = DropdownContainerModule?.getSelectedRowCount?.() ||
            RowManagerModule.getRowCount();

        // Send search request
        document.dispatchEvent(new CustomEvent('search:performed', {
            bubbles: true,
            detail: {
                term: searchTerm,
                type: searchType,
                page: PaginationModule.getCurrentPage(),
                rowCount
            }
        }));
    }

    // EVENT HANDLING METHODS

    /**
     * Sets up input event handlers
     */
    function setupInputHandler() {
        if (!elements.input) return;

        elements.input.addEventListener('input', () => {
            // Update UI
            const isEmpty = elements.input.value.length === 0;
            updateClearButtonVisibility(!isEmpty);
            SortIndicatorModule.clearAllSortIndicatorsReset();

            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, SEARCH_DELAY);
        });
    }

    /**
     * Sets up clear button handler
     */
    function setupClearButtonHandler() {
        if (!elements.clear) return;

        elements.clear.addEventListener('click', () => {
            clearSearch();
            elements.input.focus();
        });
    }

    // UI UPDATE METHODS

    /**
     * Updates clear button visibility
     */
    function updateClearButtonVisibility(isVisible) {
        if (!elements.clear) return;

        SearchElementManager.updateClearButtonVisibility(elements.clear, isVisible);
    }

    /**
     * Clears the search input and dispatches event
     */
    function clearSearch() {
        if (!elements.input) return;

        SearchElementManager.clearSearchInput(elements.input, elements.clear, elements.container);

        clearTimeout(searchTimeout);
        searchTimeout = null;

        document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }));
    }

    // INITIALIZATION

    /**
     * Sets up the search component
     */
    function initialize(container) {
        try {
            // Initialize dependencies and cache elements
            !SearchElementManager.getInstance() && SearchElementManager.initialize(container);

            // Cache DOM elements
            elements.input = SearchElementManager.getSearchInput(false);
            elements.clear = SearchElementManager.getClearIcon(false);
            elements.container = SearchElementManager.getSearchContainer(false);

            if (!elements.input || !elements.clear) {
                console.warn('SearchBarModule: Required elements not found');
                return null;
            }

            // Set up event handlers
            setupInputHandler();
            setupClearButtonHandler();

            return this;
        } catch (error) {
            console.error('SearchBarModule: Initialization error:', error);
            return null;
        }
    }

    // Public API
    return {
        initialize,

        updateSearchPlaceholder(inputElement, buttonText) {
            if (!buttonText) return;

            const input = inputElement || elements.input;
            if (!input) return;

            SearchElementManager.updatePlaceholder(input, `Search by ${buttonText}`);
            currentSearchType = buttonText;

            // Trigger search if input has content
            if (input.value.trim().length > 0) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, SEARCH_DELAY);
            }
        },

        clearSearch() {
            clearSearch();
        },

        getCurrentSearchType: () => currentSearchType,
        getCurrentSearchTerm: () => elements.input?.value.trim() || '',
        isSearchActive: () => elements.input?.value.trim().length > 0 || false,
        getSearchInput: () => elements.input,
        getSearchContainer: () => elements.container,
        getClearIcon: () => elements.clear,
        refreshElementCache: initialize
    };
})();