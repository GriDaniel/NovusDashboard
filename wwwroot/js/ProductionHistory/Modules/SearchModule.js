/**
 * @module SearchManagerModule
 * @author Daniel Oliveira
 * @description Manages the interaction with the search bar and dispatches
 *              necessary events to preform search actions on the database
 */
const SearchBarModule = (function () {
    const elements = {};
    let currentSearchType = '';
    let searchTimeout = null;
    const SEARCH_DELAY = 300; // ms delay after typing

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

    /**
     * Sets up the search component
     */
    function initialize(container) {
        try {
            // Initialize dependencies and cache elements
            !SearchElementManager.getInstance() && SearchElementManager.initialize(container);
            elements.input = SearchElementManager.getSearchInput(false);
            elements.clear = SearchElementManager.getClearIcon(false);
            elements.container = SearchElementManager.getSearchContainer(false);

            if (!elements.input || !elements.clear) {
                console.warn('SearchBarModule: Required elements not found');
                return null;
            }

            // Input handler with debounce
            elements.input.addEventListener('input', () => {
                // Update UI
                const isEmpty = elements.input.value.length === 0;
                elements.clear.classList.toggle(SearchElementManager.getHiddenClass(), isEmpty);

                if (elements.container) {
                    const text = elements.input.value.trim();
                    elements.container.textContent = text ? `Searching '${text}'` : '';
                }

                // Debounce search
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, SEARCH_DELAY);
            });

            // Clear button handler
            elements.clear.addEventListener('click', () => {
                DOMUtils.batchUpdate(() => {
                    elements.input.value = '';
                    elements.clear.classList.add(SearchElementManager.getHiddenClass());
                    if (elements.container) elements.container.textContent = '';
                    elements.input.focus();

                    clearTimeout(searchTimeout);
                    searchTimeout = null;

                    document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }));
                });
            });

            // Initial state check
            if (elements.input.value.trim().length === 0) {
                document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }));
            }

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

            DOMUtils.batchUpdate(() => {
                input.placeholder = `Search by ${buttonText}`;
            });

            currentSearchType = buttonText;

            // Trigger search  if input has content
            if (input.value.trim().length > 0) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, SEARCH_DELAY);
            }
        },

        clearSearch() {
            if (!elements.input) return;

            DOMUtils.batchUpdate(() => {
                elements.input.value = '';
                elements.clear?.classList.add(SearchElementManager.getHiddenClass());
                if (elements.container) elements.container.textContent = '';

                clearTimeout(searchTimeout);
                searchTimeout = null;

                document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }));
            });
        },

        search(term, type) {
            if (!elements.input) return;

            elements.input.value = term;
            elements.clear.classList.toggle(SearchElementManager.getHiddenClass(), term.length === 0);

            if (elements.container) {
                elements.container.textContent = term ? `Searching '${term}'` : '';
            }

            if (type) {
                elements.input.placeholder = `Search by ${type}`;
                currentSearchType = type;
            }

            term.trim().length === 0
                ? document.dispatchEvent(new CustomEvent('search:cleared', { bubbles: true }))
                : performSearch();
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