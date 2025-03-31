/**
 * @title PaginationElementManager
 * @description Manages pagination-specific elements and DOM operations
 * @author Daniel Oliveira
 */
const PaginationElementManager = (function () {
    let instance = null;

    function createPaginationManager(container) {
        const manager = BaseElementManager.createElementManager('pagination', container);

        // CLASS NAMES SETUP
        const classNames = {
            paginationContainer: 'data-table__pagination',
            paginationControls: 'pagination-controls',
            paginationInfo: 'pagination-info',
            currentPage: 'current',
            maxPage: 'next',
            fastForwardButton: 'double-triangle-east',
            fastBackwardButton: 'double-triangle-west'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // ELEMENT ACCESS METHODS

        /**
         * Helper function for element retrieval
         */
        const getElement = (className, context, forceQuery = false, parent = null) => {
            const selector = `.${manager.getClassName(className)}`;
            return parent
                ? parent.querySelector(selector)
                : manager.getElement(selector, context, forceQuery);
        };

        /**
         * Gets the pagination controls container
         */
        manager.getPaginationControls = (forceQuery = false) =>
            getElement('paginationControls', '@getPaginationControls()', forceQuery);

        /**
         * Gets the pagination info container
         */
        manager.getPaginationInfo = (forceQuery = false) =>
            getElement('paginationInfo', '@getPaginationInfo()', forceQuery);

        /**
         * Gets the current page element
         */
        manager.getCurrentPage = (forceQuery = false) => {
            const info = manager.getPaginationInfo(forceQuery);
            return info ? getElement('currentPage', '@getCurrentPage()', forceQuery, info) : null;
        };

        /**
         * Gets the max page element
         */
        manager.getMaxPage = (forceQuery = false) => {
            const info = manager.getPaginationInfo(forceQuery);
            return info ? getElement('maxPage', '@getMaxPage()', forceQuery, info) : null;
        };

        /**
         * Gets the previous page button
         */
        manager.getPrevious = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            if (!controls) return null;

            const leftGroup = controls.querySelector('.d-flex.flex-row.h-100:first-of-type');
            const buttons = leftGroup?.querySelectorAll('.pagination-button');
            return buttons?.[1] ?? null;
        };

        /**
         * Gets the fast backward button
         */
        manager.getFastBackward = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            if (!controls) return null;

            const fastBackwardClass = manager.getClassName('fastBackwardButton');
            return controls.querySelector(`.${fastBackwardClass}`)?.closest('.pagination-button') ?? null;
        };

        /**
         * Gets the next page button
         */
        manager.getNext = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            if (!controls) return null;

            const rightGroup = controls.querySelector('.d-flex.flex-row.h-100:last-of-type');
            const buttons = rightGroup?.querySelectorAll('.pagination-button');
            return buttons?.[0] ?? null;
        };

        /**
         * Gets the fast forward button
         */
        manager.getFastForward = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            if (!controls) return null;

            const fastForwardClass = manager.getClassName('fastForwardButton');
            return controls.querySelector(`.${fastForwardClass}`)?.closest('.pagination-button') ?? null;
        };

        // DOM MANIPULATION METHODS

        /**
         * Updates the current page text
         */
        manager.setCurrentPageText = function (page) {
            const currentPageEl = this.getCurrentPage();
            if (!currentPageEl) return;

            DOMUtils.batchUpdate(() => {
                currentPageEl.textContent = page;
            });
        };

        /**
         * Updates the max page text
         */
        manager.setMaxPageText = function (totalPages) {
            const maxPageEl = this.getMaxPage();
            if (!maxPageEl) return;

            const text = `${totalPages} page${totalPages !== 1 ? 's' : ''}`;

            DOMUtils.batchUpdate(() => {
                maxPageEl.textContent = text;
            });
        };

        /**
         * Updates the button states based on page position
         */
        manager.updateButtonStates = function (currentPage, totalPages) {
            const buttons = {
                prev: this.getPrevious(),
                fastBack: this.getFastBackward(),
                next: this.getNext(),
                fastForward: this.getFastForward()
            };

            // Skip if no buttons found
            if (!buttons.prev && !buttons.fastBack && !buttons.next && !buttons.fastForward) {
                return;
            }

            DOMUtils.batchUpdate(() => {
                // First/prev buttons are disabled on first page
                if (buttons.prev) buttons.prev.classList.toggle('disabled', currentPage <= 1);
                if (buttons.fastBack) buttons.fastBack.classList.toggle('disabled', currentPage <= 1);

                // Next/last buttons are disabled on last page
                if (buttons.next) buttons.next.classList.toggle('disabled', currentPage >= totalPages);
                if (buttons.fastForward) buttons.fastForward.classList.toggle('disabled', currentPage >= totalPages);
            });
        };

        return manager;
    }

    // PUBLIC API
    return {
        initialize(container) {
            if (!instance) instance = createPaginationManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Element access methods
        getPaginationControls: forceQuery => instance?.getPaginationControls(forceQuery) ?? null,
        getPaginationInfo: forceQuery => instance?.getPaginationInfo(forceQuery) ?? null,
        getCurrentPage: forceQuery => instance?.getCurrentPage(forceQuery) ?? null,
        getMaxPage: forceQuery => instance?.getMaxPage(forceQuery) ?? null,
        getPrevious: forceQuery => instance?.getPrevious(forceQuery) ?? null,
        getFastBackward: forceQuery => instance?.getFastBackward(forceQuery) ?? null,
        getNext: forceQuery => instance?.getNext(forceQuery) ?? null,
        getFastForward: forceQuery => instance?.getFastForward(forceQuery) ?? null,

        // DOM manipulation methods
        setCurrentPageText: page => {
            if (instance) instance.setCurrentPageText(page);
        },
        setMaxPageText: totalPages => {
            if (instance) instance.setMaxPageText(totalPages);
        },
        updateButtonStates: (currentPage, totalPages) => {
            if (instance) instance.updateButtonStates(currentPage, totalPages);
        },

        // Base methods
        getClassName: key => instance?.getClassName(key) ?? '',
        clearCache: () => instance?.clearCache()
    };
})();