/**
 * @module SearchElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of search-specific elements and class names
 */
const SearchElementManager = (function () {
    let instance = null;

    function createSearchManager(container) {
        const manager = BaseElementManager.createElementManager('search', container);

        // Setup all the class names the search module implementation depends on
        const classNames = {
            searchInput: 'search-input',
            clearButton: 'clear-button',
            searchContainer: 'search-text',
            searchIcon: 'search-icon',
            searchArea: 'data-table__search',
            searchResults: 'search-results-container',
            hidden: 'd-none'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // Element getters
        manager.getSearchInput = forceQuery =>
            manager.getElement(`.${manager.getClassName('searchInput')}`, "getSearchInput()", forceQuery);

        manager.getClearIcon = forceQuery =>
            manager.getElement(`.${manager.getClassName('clearButton')}`, "getClearIcon()", forceQuery);

        manager.getSearchContainer = forceQuery =>
            manager.getElement(`.${manager.getClassName('searchContainer')}`, "getSearchContainer()", forceQuery);

        manager.getSearchIcon = forceQuery =>
            manager.getElement(`.${manager.getClassName('searchIcon')}`, "getSearchIcon()", forceQuery);

        manager.getSearchArea = forceQuery =>
            manager.getElement(`.${manager.getClassName('searchArea')}`, "getSearchArea()", forceQuery);

        manager.getSearchResultsContainer = forceQuery =>
            manager.getElement(`.${manager.getClassName('searchResults')}`, "getSearchResultsContainer()", forceQuery);

        manager.getHiddenClass = () => manager.getClassName('hidden');

        return manager;
    }

    // Public API
    return {
        initialize(container) {
            if (!instance) instance = createSearchManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Initialize an instance of all methods
        getSearchInput: forceQuery => instance?.getSearchInput(forceQuery) ?? null,
        getClearIcon: forceQuery => instance?.getClearIcon(forceQuery) ?? null,
        getSearchContainer: forceQuery => instance?.getSearchContainer(forceQuery) ?? null,
        getSearchIcon: forceQuery => instance?.getSearchIcon(forceQuery) ?? null,
        getSearchArea: forceQuery => instance?.getSearchArea(forceQuery) ?? null,
        getSearchResultsContainer: forceQuery => instance?.getSearchResultsContainer(forceQuery) ?? null,
        getHiddenClass: () => instance?.getHiddenClass() ?? 'd-none',
        clearCache: () => instance?.clearCache()
    };
})();