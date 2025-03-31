/**
 * @title TableElementManager
 * @description  Manages table-specific elements
 * @author Daniel Oliveira
 */
const TableElementManager = (function () {
    let instance = null;

    function createManager(container) {
        const manager = BaseElementManager.createElementManager('tableUI', container);

        // CLASS NAMES SETUP
        const classNames = {
            tableTitle: 'data-table__title',
            tableControls: 'data-table__controls',
            moveColumnsHeader: 'move-columns-header',
            moveColumnsExit: 'move-columns-exit'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // ELEMENT ACCESS METHODS
        manager.getTableTitle = forceQuery =>
            manager.getElement(`.${manager.getClassName('tableTitle')}`, "getTableTitle()", forceQuery);

        manager.getTableControls = forceQuery =>
            manager.getElement(`.${manager.getClassName('tableControls')}`, "getTableControls()", forceQuery);

        manager.getTableTitleHeading = forceQuery => {
            const title = manager.getTableTitle(forceQuery);
            return title ? title.querySelector('h4') : null;
        };

        // ELEMENT CREATION METHODS
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

        manager.getOrCreateSubtitle = function (container) {
            if (!container) return null;

            const existingSubtitle = container.querySelector('.data-table__subtitle');
            if (existingSubtitle) return existingSubtitle;

            const subtitle = document.createElement('p');
            subtitle.classList.add('data-table__subtitle');

            DOMUtils.batchUpdate(() => {
                container.appendChild(subtitle);
            });

            return subtitle;
        };

        // DOM MANIPULATION METHODS
        manager.updateTitleText = function (titleElement, text) {
            if (!titleElement) return;

            DOMUtils.batchUpdate(() => {
                titleElement.textContent = text;
            });
        };

        manager.updateSubtitleText = function (subtitleElement, text) {
            if (!subtitleElement) return;

            DOMUtils.batchUpdate(() => {
                subtitleElement.textContent = text;
            });
        };

        manager.applyMoveColumnsHeaderStyle = function (element) {
            if (!element) return element;

            DOMUtils.batchUpdate(() => {
                element.style.fontSize = '20px';
                element.style.fontWeight = '400';
                element.style.paddingTop = '15px';
            });

            return element;
        };

        manager.applyMoveColumnsExitStyle = function (element) {
            if (!element) return element;

            DOMUtils.batchUpdate(() => {
                element.style.fontSize = '18px';
                element.style.fontWeight = '400';
                element.style.paddingTop = '15px';
            });

            return element;
        };

        return manager;
    }

    // PUBLIC API
    return {
        initialize(container) {
            if (!instance) instance = createManager(container);
            return instance;
        },

        getInstance: () => instance,

        // Element access methods
        getTableTitle: forceQuery => instance?.getTableTitle(forceQuery) ?? null,
        getTableControls: forceQuery => instance?.getTableControls(forceQuery) ?? null,
        getTableTitleHeading: forceQuery => instance?.getTableTitleHeading(forceQuery) ?? null,

        // Element creation methods
        createMoveColumnsHeader: text => instance?.createMoveColumnsHeader(text) ?? null,
        createMoveColumnsExit: text => instance?.createMoveColumnsExit(text) ?? null,
        getOrCreateSubtitle: container => instance?.getOrCreateSubtitle(container) ?? null,

        // DOM manipulation methods
        updateTitleText: (titleElement, text) => {
            if (instance) instance.updateTitleText(titleElement, text);
        },
        updateSubtitleText: (subtitleElement, text) => {
            if (instance) instance.updateSubtitleText(subtitleElement, text);
        },
        applyMoveColumnsHeaderStyle: element => instance?.applyMoveColumnsHeaderStyle(element) ?? element,
        applyMoveColumnsExitStyle: element => instance?.applyMoveColumnsExitStyle(element) ?? element,

        // Base methods
        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache()
    };
})();