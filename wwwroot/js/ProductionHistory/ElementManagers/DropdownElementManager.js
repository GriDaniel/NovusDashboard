/**
 * @title DropdownElementManager
 * @description Manages dropdown-related elements
 * @author Daniel Oliveira
 */
const DropdownElementManager = (function () {
    let instance = null;

    function createDropdownManager(container) {
        const manager = BaseElementManager.createElementManager('dropdown', container);

        // CLASS NAMES SETUP
        const classNames = {
            dropdownButton: 'data-table__control-btn',
            dropdownButtonColumn: 'data-table__control-btn-column',
            dropdownContent: 'dropdown-content-container',
            arrow: 'dropdown-arrow',
            showClass: 'show',
            openClass: 'open',
            staticInput: 'static-input',
            dropdownItem: 'dropdown-item',
            dropdownContainer: 'dropdown-container',
            customInput: 'custom-input',
            setButton: 'set-button',
            valueContainer: 'd-flex',
            valueText: 'span:first-child',
            sortIndicators: 'sort-indicators', // Fixed typo from 'sortIndicatos'
            checkboxList: 'checkbox-list',
            checkboxItem: 'checkbox-item',
            closeIcon: 'close-static-input',
            closeButton: 'close-button',
            titleElement: 'title-element'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // DROPDOWN TYPES
        manager.dropdownTypes = {
            'column-dropdown': 'column',
            'row-dropdown': 'row',
            'search-dropdown': 'search',
            'sort-dropdown': 'sort',
            'column-title-dropdown': 'column-title',
            'row-info-dropdown': 'row-info'
        };

        // ELEMENT ACCESS METHODS
        manager.getDropdownType = container => {
            if (!container) return null;
            for (const [className, type] of Object.entries(manager.dropdownTypes)) {
                if (container.classList.contains(className)) return type;
            }
            return null;
        };

        const getElement = (container, className, context) =>
            container ? manager.getElement(`.${manager.getClassName(className)}`, context, false, container) : null;

        manager.getDropdownButton = container => getElement(container, 'dropdownButton', 'getDropdownButton()');
        manager.getDropdownButtonColumn = container => getElement(container, 'dropdownButtonColumn', 'getDropdownButtonColumn()');
        manager.getDropdownContent = container => getElement(container, 'dropdownContent', 'getDropdownContent()');
        manager.getCloseIcon = container => getElement(container, 'closeIcon', 'getCloseIcon()');
        manager.getArrow = container => getElement(container, 'arrow', 'getArrow()');
        manager.getCloseButton = container => getElement(container, 'closeButton', 'getCloseButton()');
        manager.getTitleElement = container => getElement(container, 'titleElement', 'getTitleElement()');

        manager.getValueContainer = container => {
            if (!container) return null;
            const button = manager.getDropdownButton(container);
            return getElement(button, 'valueContainer', 'getValueContainer()');
        };

        manager.getValueText = container => {
            if (!container) return null;
            const valueContainer = manager.getValueContainer(container);
            return valueContainer ? manager.getElement(manager.getClassName('valueText'), 'getValueText()', false, valueContainer) : null;
        };

        manager.getStaticInputButtons = container =>
            container ? Array.from(container.querySelectorAll(`.${manager.getClassName('staticInput')}`)) : [];

        manager.getSetButton = container => getElement(container, 'setButton', 'getSetButton()');
        manager.getCustomInput = container => getElement(container, 'customInput', 'getCustomInput()');
        manager.getCheckboxList = container => getElement(container, 'checkboxList', 'getCheckboxList()');
        manager.getCheckboxItem = container => getElement(container, 'checkboxItem', 'getCheckboxItem()');

        manager.getFirstDropdownItem = container => {
            if (!container) return null;
            const content = manager.getDropdownContent(container);
            return content ? manager.getElement(`.${manager.getClassName('dropdownItem')}:first-child`, 'getFirstDropdownItem()', false, content) : null;
        };

        manager.getAllDropdownContainers = () =>
            manager.getElements(`.${manager.getClassName('dropdownContainer')}`, 'getAllDropdownContainers()');

        manager.getSortIndicators = container =>
            container ? Array.from(container.querySelectorAll(`.${manager.getClassName('sortIndicators')}`)) : [];

        // DOM MANIPULATION METHODS
        manager.createCloseButton = (key) => {
            const closeButton = document.createElement('button');
            closeButton.className = `${manager.getClassName('dropdownItem')} ${manager.getClassName('staticInput')} ${manager.getClassName('closeButton')}`;

            // Use key text if provided, otherwise use "Close"
            const buttonText = key ? key : 'Close';

            closeButton.innerHTML = `
        ${buttonText}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
            return closeButton;
        };

        manager.createValueStructure = (button, text) => {
            if (!button || !text) return { textElem: null, arrow: null };

            const textElem = document.createElement('span');
            const arrow = document.createElement('span');
            arrow.className = manager.getClassName('arrow');

            const buttonText = Array.from(button.childNodes)
                .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            const labelText = buttonText ? buttonText.textContent.trim() : '';

            DOMUtils.batchUpdate(() => {
                textElem.textContent = text;
                button.innerHTML = '';
                if (labelText) button.appendChild(document.createTextNode(labelText));
                button.appendChild(textElem);
                button.appendChild(arrow);
                button.setAttribute('title', text);
            });

            return { textElem, arrow };
        };

        return manager;
    }

    // PUBLIC API
    return {
        initialize(container) {
            if (!instance) instance = createDropdownManager(container);
            return instance;
        },

        getInstance: () => instance,

        // Element Access Methods
        getDropdownType: container => instance?.getDropdownType(container) ?? null,
        getDropdownButton: container => instance?.getDropdownButton(container) ?? null,
        getDropdownButtonColumn: container => instance?.getDropdownButtonColumn(container) ?? null,
        getDropdownContent: container => instance?.getDropdownContent(container) ?? null,
        getArrow: container => instance?.getArrow(container) ?? null,
        getValueContainer: container => instance?.getValueContainer(container) ?? null,
        getValueText: container => instance?.getValueText(container) ?? null,
        getStaticInputButtons: container => instance?.getStaticInputButtons(container) ?? [],
        getSetButton: container => instance?.getSetButton(container) ?? null,
        getCustomInput: container => instance?.getCustomInput(container) ?? null,
        getCheckboxList: container => instance?.getCheckboxList(container) ?? null,
        getCheckboxItem: container => instance?.getCheckboxItem(container) ?? null,
        getCloseIcon: container => instance?.getCloseIcon(container) ?? null,
        getFirstDropdownItem: container => instance?.getFirstDropdownItem(container) ?? null,
        getAllDropdownContainers: () => instance?.getAllDropdownContainers() ?? [],
        getSortIndicators: container => instance?.getSortIndicators(container) ?? [],
        getCloseButton: container => instance?.getCloseButton(container) ?? null,
        getTitleElement: container => instance?.getTitleElement(container) ?? null,

        // DOM Manipulation Methods
        createCloseButton: (key) => instance?.createCloseButton(key) ?? null,
        createValueStructure: (button, text) => instance?.createValueStructure(button, text) ?? { textElem: null, arrow: null },

        // Utility Method
        getInstancesByType: type => {
            if (!instance || !type) return [];
            return Array.from(instance.getAllDropdownContainers())
                .filter(container => instance.getDropdownType(container) === type);
        },

        // Base Methods
        getClassName: key => instance?.getClassName(key) ?? '',
        clearCache: () => instance?.clearCache()
    };
})();