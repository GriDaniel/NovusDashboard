/**
 * @module PaginationElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of pagination-specific elements and class names
 */
const PaginationElementManager = (function () {
    let instance = null;

    function createPaginationManager(container) {
        const manager = BaseElementManager.createElementManager('pagination', container);

        // Setup all the class names the pagination module implementation depends on
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

        // Local version of getElement
        // to help initialize caching of elements
        const getElement = (className, context, forceQuery = false) =>
            manager.getElement(`.${manager.getClassName(className)}`, context, forceQuery);

        // Element access methods
        manager.getPaginationControls = (forceQuery = false) => getElement('paginationControls', '@getPaginationControls()', forceQuery);
        manager.getPaginationInfo = (forceQuery = false) => getElement('paginationInfo', '@getPaginationInfo()', forceQuery);

        manager.getCurrentPage = (forceQuery = false) => {
            const info = manager.getPaginationInfo(forceQuery);
            return info ? getElement('currentPage', '@getCurrentPage()', forceQuery, info) : null;
        };

        manager.getMaxPage = (forceQuery = false) => {
            const info = manager.getPaginationInfo(forceQuery);
            return info ? getElement('maxPage', '@getMaxPage()', forceQuery, info) : null;
        };

        manager.getPrevious = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            if (!controls) return null;
            const leftGroup = controls.querySelector('.d-flex.flex-row.h-100:first-of-type');
            const buttons = leftGroup?.querySelectorAll('.pagination-button');
            return buttons?.[1] ?? null;
        };

        manager.getFastBackward = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            return controls?.querySelector(`.${manager.getClassName('fastBackwardButton')}`)?.closest('.pagination-button') ?? null;
        };

        manager.getNext = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            const rightGroup = controls?.querySelector('.d-flex.flex-row.h-100:last-of-type');
            const buttons = rightGroup?.querySelectorAll('.pagination-button');
            return buttons?.[0] ?? null;
        };

        manager.getFastForward = (forceQuery = false) => {
            const controls = manager.getPaginationControls(forceQuery);
            return controls?.querySelector(`.${manager.getClassName('fastForwardButton')}`)?.closest('.pagination-button') ?? null;
        };

        return manager;
    }

    // Public API
    return {
        initialize(container) {
            if (!instance) instance = createPaginationManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Initialize an instance of all methods
        getPaginationControls: forceQuery => instance?.getPaginationControls(forceQuery) ?? null,
        getPaginationInfo: forceQuery => instance?.getPaginationInfo(forceQuery) ?? null,
        getCurrentPage: forceQuery => instance?.getCurrentPage(forceQuery) ?? null,
        getMaxPage: forceQuery => instance?.getMaxPage(forceQuery) ?? null,
        getPrevious: forceQuery => instance?.getPrevious(forceQuery) ?? null,
        getFastBackward: forceQuery => instance?.getFastBackward(forceQuery) ?? null,
        getNext: forceQuery => instance?.getNext(forceQuery) ?? null,
        getFastForward: forceQuery => instance?.getFastForward(forceQuery) ?? null,
        getClassName: key => instance?.getClassName(key) ?? '',
        clearCache: () => instance?.clearCache()
    };
})();
