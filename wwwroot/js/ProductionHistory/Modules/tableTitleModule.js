const TableTitleModule = (function () {
    let instance = null;

    // STATE MANAGEMENT

    // Cache DOM elements
    const elements = {
        titleContainer: null,
        titleHeading: null,
        subtitle: null
    };

    // Track current state
    const state = {
        mode: 'regular', // 'regular', 'search', or 'sort'
        search: { term: '', type: '', totalResults: 0 },
        sort: { column: '', direction: '' },
        normalCount: 0, // Single source of truth for total count
        initialized: false
    };

    class TableTitleManager {
        constructor() {
            this.sortingInProgress = false;
            this.initializeElements();
            this.setupEventListeners();
        }

        // DOM METHODS

        /**
         * Initialize DOM elements
         */
        initializeElements() {
            // Get title element using TableElementManager
            elements.titleContainer = TableElementManager.getTableTitle(true);
            if (!elements.titleContainer) {
                return;
            }

            elements.titleHeading = TableElementManager.getTableTitleHeading(true);

            // Create subtitle element if it doesn't exist
            elements.subtitle = this.getOrCreateSubtitle();

            // Set initial title text
            this.setInitialTitle();

            // Try to initialize immediately if possible
            this.attemptInitialization();
        }

        /**
         * Gets existing subtitle or creates new one
         */
        getOrCreateSubtitle() {
            const existingSubtitle = elements.titleContainer.querySelector('.data-table__subtitle');
            if (existingSubtitle) {
                return existingSubtitle;
            }

            const subtitle = document.createElement('h6');
            subtitle.classList.add('data-table__subtitle');
            elements.titleContainer.appendChild(subtitle);
            return subtitle;
        }

        /**
         * Sets initial title text
         */
        setInitialTitle() {
            if (elements.titleHeading) {
                TableElementManager.updateTitleText(elements.titleHeading, 'Showing All Data');
            }

            if (elements.subtitle) {
                TableElementManager.updateSubtitleText(elements.subtitle, 'Loading...');
            }
        }

        /**
         * Update title for search state
         */
        updateTitleForSearchState() {
            if (!elements.titleHeading || !elements.subtitle) return;

            const { term, totalResults } = state.search;
            const resultText = `${totalResults} result${totalResults !== 1 ? 's' : ''} found`;

            DOMUtils.batchUpdate(() => {
                elements.titleHeading.textContent = `Search for "${term}"`;
                elements.subtitle.textContent = resultText;
            });
        }

        /**
         * Update title for sort state
         */
        updateTitleForSortState() {
            if (!elements.titleHeading || !elements.subtitle) return;

            const { column, direction } = state.sort;
            const directionText = direction === 'up' ? 'ascending' : 'descending';
            const totalCount = state.normalCount;
            
            const subtitleText = totalCount === 0 ?
                `${directionText} • loading...` :
                `${totalCount} item${totalCount !== 1 ? 's' : ''} | ${directionText} `;

            DOMUtils.batchUpdate(() => {
                elements.titleHeading.textContent = `Sorted by ${column}`;
                elements.subtitle.textContent = subtitleText;
            });
        }

        /**
         * Update title for normal state
         */
        updateTitleForNormalState() {
            if (!elements.titleHeading || !elements.subtitle) return;

            const totalCount = state.normalCount;
            const countText = `${totalCount} item${totalCount !== 1 ? 's' : ''}`;

            DOMUtils.batchUpdate(() => {
                elements.titleHeading.textContent = `Showing All Data`;
                elements.subtitle.textContent = countText;
            });
        }

        // DATA INITIALIZATION METHODS

        /**
         * Attempt to initialize the title with data from TableDataModule
         */
        attemptInitialization() {
            if (typeof TableDataModule === 'undefined') return;

            TableDataModule.getTotalCount()
                .then(count => {
                    if (count > 0) {
                        state.normalCount = count;
                        this.updateTitleForNormalState();
                        state.initialized = true;
                    }
                })
                .catch(() => {
                    // Silent fail, will be retried later
                });
        }

        // EVENT SETUP METHODS

        /**
         * Set up event listeners for state changes
         */
        setupEventListeners() {
            // Search events
            document.addEventListener('tableData:searchDataFetched', this.handleSearchData.bind(this));
            document.addEventListener('tableData:searchCleared', this.handleSearchCleared.bind(this));

            // Sort events
            document.addEventListener('tableData:sortDataFetched', this.handleSortData.bind(this));
            document.addEventListener('sort:cleared', this.handleSortCleared.bind(this));
            document.addEventListener('sort:applied', this.handleSortApplied.bind(this));
            document.addEventListener('sortIndicator:sort', this.handleSortIndicatorSort.bind(this));

            // Normal data events
            document.addEventListener('tableData:pageDataFetched', this.handlePageData.bind(this));
        }

        // EVENT HANDLERS

        /**
         * Handle search data fetched event
         */
        handleSearchData(event) {
            const { term, type, totalResults } = event.detail;

            state.mode = 'search';
            state.search = { term, type, totalResults };
            state.initialized = true;

            this.updateTitleForSearchState();
        }

        /**
         * Handle sort applied event (direct from SortIndicatorModule)
         */
        handleSortApplied(event) {
            const { column, direction } = event.detail;

            this.sortingInProgress = true;
            state.mode = 'sort';
            state.sort = { column, direction };
            state.initialized = true;

            this.updateTitleForSortState();
        }

        /**
         * Handle sort indicator sort event (direct from SortIndicatorModule)
         */
        handleSortIndicatorSort(event) {
            const { columnName, direction } = event.detail;

            this.sortingInProgress = true;
            state.mode = 'sort';
            state.sort = { column: columnName, direction };
            state.initialized = true;

            this.updateTitleForSortState();
        }

        /**
         * Handle search cleared event
         */
        handleSearchCleared(event) {
            const { totalCount } = event.detail;

            state.mode = 'regular';
            state.normalCount = totalCount;
            state.initialized = true;

            this.updateTitleForNormalState();
        }

        /**
         * Handle sort data fetched event
         */
        handleSortData(event) {
            const { column, direction, totalCount } = event.detail;

            // Update normalCount if provided and not already set
            if (totalCount && (!state.normalCount || state.normalCount === 0)) {
                state.normalCount = totalCount;
            }

            state.mode = 'sort';
            state.sort = { column, direction };
            state.initialized = true;

            this.updateTitleForSortState();
            this.sortingInProgress = false;
        }

        /**
         * Handle sort cleared event
         */
        handleSortCleared() {
            // Only process if we're not in the middle of a search operation
            if (state.mode === 'search') return;

            state.mode = 'regular';

            // Use cached normalCount or set to a loading state
            if (state.normalCount > 0) {
                this.updateTitleForNormalState();
            } else {
                DOMUtils.batchUpdate(() => {
                    elements.titleHeading.textContent = `Showing All Data`;
                    elements.subtitle.textContent = `Loading...`;
                });

                this.attemptInitialization();
            }

            state.initialized = true;
        }

        /**
         * Handle normal page data fetched event
         */
        handlePageData(event) {
            // Only update if we're in regular mode and not sorting
            if (state.mode !== 'regular' || this.sortingInProgress) return;

            const { totalCount } = event.detail;

            // Always update normalCount as reference for other modes
            state.normalCount = totalCount;
            state.initialized = true;
            this.updateTitleForNormalState();
        }

        // PUBLIC METHODS

        /**
         * Force title update based on current state
         */
        refreshTitle() {
            // If not initialized yet, try to get count data
            if (!state.initialized) {
                this.attemptInitialization();
                return;
            }

            switch (state.mode) {
                case 'search':
                    this.updateTitleForSearchState();
                    break;
                case 'sort':
                    this.updateTitleForSortState();
                    break;
                default:
                    this.updateTitleForNormalState();
                    break;
            }
        }
    }

    // Public API
    return {
        /**
         * Initialize the TableTitleModule
         */
        initialize() {
            if (!instance) {
                instance = new TableTitleManager();
            }
            return instance;
        },

        /**
         * Get the singleton instance
         */
        getInstance() {
            return instance;
        },

        /**
         * Force title refresh based on current state
         */
        refreshTitle() {
            return instance?.refreshTitle();
        },

        /**
         * Get current state information
         */
        getState() {
            return { ...state };
        }
    };
})();