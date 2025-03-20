/**
 * @module DropdownElementManager
 * @author Daniel Oliveira
 * @description Manages the caching and retrieval of dropdown-specific elements and class names
 */
const DropdownElementManager = (function () {
    let instance = null;

    function createDropdownManager(container) {
        const manager = BaseElementManager.createElementManager('dropdown', container);

        // Setup all the class names the dropdown module implementation depends on
        const classNames = {
            dropdownButton: 'data-table__control-btn',
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
            sortIndicatos: 'sort-indicators',
            checkboxList: 'checkbox-list',
            checkboxItem: 'checkbox-item'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // Built-in mapping for dropdown types [classname, identifier]
        manager.dropdownTypes = {
            "column-dropdown": "column",
            "row-dropdown": "row",
            "search-dropdown": "search",
            "sort-dropdown": "sort"
        };

        // Helper method 
        manager.getDropdownType = function (container) {
            if (!container) return null;
            for (const [className, type] of Object.entries(this.dropdownTypes)) {
                if (container.classList.contains(className)) return type;
            }
            return null;
        };

        // DOM element getter
        // Defines a local version of getElement as a re-usable function
        // Checks for container validity before calling the base element manager's getElement method
        const getElement= (container, className, context) =>
            container ? manager.getElement(`.${manager.getClassName(className)}`, context, false, container) : null;

        manager.getDropdownButton = container => getElement(container, 'dropdownButton', '@getDropdownButton()');
        manager.getDropdownContent = container => getElement(container, 'dropdownContent', '@getDropdownContent()');
        manager.getArrow = container => getElement(container, 'arrow', '@getArrow()');

        manager.getValueContainer = function (container) {
            if (!container) return null;
            const button = this.getDropdownButton(container);
            return getElement(button, 'valueContainer', '@getValueContainer()');
        };

        manager.getValueText = function (container) {
            if (!container) return null;
            const valueContainer = this.getValueContainer(container);
            return valueContainer ? this.getElement(this.getClassName('valueText'), "@getValueText()", false, valueContainer) : null;
        };

        manager.getStaticInputButtons = container =>
            container ? Array.from(container.querySelectorAll(`.${manager.getClassName('staticInput')}`)) : [];

        manager.getSetButton = container => getElement(container, 'setButton', '@getSetButton()');
        manager.getCustomInput = container => getElement(container, 'customInput', '@getCustomInput()');
        manager.getCheckboxList = container => getElement(container, 'checkboxList', '@getCheckboxList()');
        manager.getCheckboxItem = container => getElement(container, 'checkboxItem', '@getCheckboxItem()');

        manager.getFirstDropdownItem = function (container) {
            if (!container) return null;
            const content = this.getDropdownContent(container);
            return content ? this.getElement(`.${this.getClassName('dropdownItem')}:first-child`, "@getFirstDropdownItem()", false, content) : null;
        };

        manager.getAllDropdownContainers = () =>
            manager.getElements(`.${manager.getClassName('dropdownContainer')}`, "@getAllDropdownContainers()");

        manager.getSortIndicators = container =>
            container ? Array.from(container.querySelectorAll(`.${manager.getClassName('sortIndicators')}`)) : [];

        return manager;
    }

    // Public API
    return {
        initialize(container) {
            if (!instance) instance = createDropdownManager(container);
            return instance;
        },

        getInstance() {
            return instance;
        },

        // Initialize an instance of all methods
        getDropdownType: container => instance?.getDropdownType(container) ?? null,
        getDropdownButton: container => instance?.getDropdownButton(container) ?? null,
        getDropdownContent: container => instance?.getDropdownContent(container) ?? null,
        getArrow: container => instance?.getArrow(container) ?? null,
        getValueContainer: container => instance?.getValueContainer(container) ?? null,
        getValueText: container => instance?.getValueText(container) ?? null,
        getStaticInputButtons: container => instance?.getStaticInputButtons(container) ?? [],
        getSetButton: container => instance?.getSetButton(container) ?? null,
        getCustomInput: container => instance?.getCustomInput(container) ?? null,
        getFirstDropdownItem: container => instance?.getFirstDropdownItem(container) ?? null,
        getAllDropdownContainers: () => instance?.getAllDropdownContainers() ?? document.querySelectorAll('.dropdown-container'),
        getClassName: key => instance?.getClassName(key) ?? '',
        clearCache: () => instance?.clearCache(),

        getInstancesByType(type) {
            if (!type) return [];
            const containers = this.getAllDropdownContainers();
            return Array.from(containers).filter(container => this.getDropdownType(container) === type);
        },

        getCheckboxList: container => instance?.getCheckboxList(container) ?? null,
        getCheckboxItem: container => instance?.getCheckboxItem(container) ?? null,
        getSortIndicators: container => instance?.getSortIndicators(container) ?? []
    };
})();
