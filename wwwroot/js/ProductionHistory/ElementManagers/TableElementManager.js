/**
 * @module TableElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of table-specific (general elements) elements and class names
 */
const TableElementManager = (function () {
    let instance = null;

    function createManager(container) {
        const manager = BaseElementManager.createElementManager('tableUI', container);

        // Set up general class names
        const classNames = {
            tableTitle: 'data-table__title',
            tableControls: 'data-table__controls',
            moveColumnsHeader: 'move-columns-header',
            moveColumnsExit: 'move-columns-exit'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // Element access methods
        manager.getTableTitle = forceQuery =>
            manager.getElement(`.${manager.getClassName('tableTitle')}`, "getTableTitle()", forceQuery);

        manager.getTableControls = forceQuery =>
            manager.getElement(`.${manager.getClassName('tableControls')}`, "getTableControls()", forceQuery);

        manager.getTableTitleHeading = forceQuery => {
            const title = manager.getTableTitle(forceQuery);
            return title ? title.querySelector('h2') : null;
        };

        // Element creation methods
        manager.createMoveColumnsHeader = (text = 'Select Column(s) to Move') => {
            const header = document.createElement('div');
            header.classList.add(manager.getClassName('moveColumnsHeader'));
            header.textContent = text;
            return header;
        };

        manager.createMoveColumnsExit = (text = '← Return') => {
            const button = document.createElement('div');
            button.classList.add(manager.getClassName('moveColumnsExit'));
            button.textContent = text;
            button.style.cursor = 'pointer';
            return button;
        };

        return manager;
    }

    // Public API
    return {
        initialize(container) {
            if (!instance) instance = createManager(container);
            return instance;
        },

        getInstance: () => instance,

        // Initialize an instance of all methods
        getTableTitle: forceQuery => instance?.getTableTitle(forceQuery) ?? null,
        getTableControls: forceQuery => instance?.getTableControls(forceQuery) ?? null,
        getTableTitleHeading: forceQuery => instance?.getTableTitleHeading(forceQuery) ?? null,
        createMoveColumnsHeader: text => instance?.createMoveColumnsHeader(text) ?? null,
        createMoveColumnsExit: text => instance?.createMoveColumnsExit(text) ?? null,
        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache()
    };
})();