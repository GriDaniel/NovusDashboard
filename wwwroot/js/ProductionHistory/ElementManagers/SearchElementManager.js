/**
 * @title SearchElementManager
 * @description   Manages search-related elements
 * @author Daniel Oliveira
 */
const SearchElementManager = (function () {
    let instance = null;

    function createSearchManager(container) {
        const manager = BaseElementManager.createElementManager('search', container);

        // CLASS NAMES SETUP
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

        // ELEMENT ACCESS METHODS
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

        // DOM MANIPULATION METHODS
        manager.updatePlaceholder = function (input, placeholderText) {
            if (!input) return;

            DOMUtils.batchUpdate(() => {
                input.placeholder = placeholderText;
            });
        };

        manager.updateClearButtonVisibility = function (clearButton, isVisible) {
            if (!clearButton) return;

            DOMUtils.batchUpdate(() => {
                if (isVisible) {
                    clearButton.classList.remove(this.getClassName('hidden'));
                } else {
                    clearButton.classList.add(this.getClassName('hidden'));
                }
            });
        };

        manager.clearSearchInput = function (input, clearButton, container) {
            if (!input) return;

            DOMUtils.batchUpdate(() => {
                input.value = '';

                if (clearButton) {
                    clearButton.classList.add(this.getClassName('hidden'));
                }

                if (container) {
                    container.textContent = '';
                }
            });
        };

        manager.setSearchResultText = function (container, text) {
            if (!container) return;

            DOMUtils.batchUpdate(() => {
                container.textContent = text;
            });
        };

        return manager;
    }

    // PUBLIC API
    return {
        initialize(container) {
            if (!instance) instance = createSearchManager(container);
            return instance;
        },

        getInstance: () => instance,

        // Element access methods
        getSearchInput: forceQuery => instance?.getSearchInput(forceQuery) ?? null,
        getClearIcon: forceQuery => instance?.getClearIcon(forceQuery) ?? null,
        getSearchContainer: forceQuery => instance?.getSearchContainer(forceQuery) ?? null,
        getSearchIcon: forceQuery => instance?.getSearchIcon(forceQuery) ?? null,
        getSearchArea: forceQuery => instance?.getSearchArea(forceQuery) ?? null,
        getSearchResultsContainer: forceQuery => instance?.getSearchResultsContainer(forceQuery) ?? null,
        getHiddenClass: () => instance?.getHiddenClass() ?? 'd-none',

        // DOM manipulation methods
        updatePlaceholder: (input, placeholderText) => {
            if (instance) instance.updatePlaceholder(input, placeholderText);
        },
        updateClearButtonVisibility: (clearButton, isVisible) => {
            if (instance) instance.updateClearButtonVisibility(clearButton, isVisible);
        },
        clearSearchInput: (input, clearButton, container) => {
            if (instance) instance.clearSearchInput(input, clearButton, container);
        },
        setSearchResultText: (container, text) => {
            if (instance) instance.setSearchResultText(container, text);
        },

        // Base methods
        clearCache: () => instance?.clearCache()
    };
})();