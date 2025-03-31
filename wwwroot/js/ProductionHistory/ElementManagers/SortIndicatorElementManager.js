/**
 * @title SortIndicatorElementManager
 * @description   Manages sort indicator elements
 * @author Daniel Oliveira
 */
const SortIndicatorElementManager = (function () {
    let instance = null;

    function createSortIndicatorElementManager(container) {
        const manager = BaseElementManager.createElementManager('sortIndicator', container);

        // CLASS NAMES SETUP
        const classNames = {
            sortIndicatorsClass: 'sort-indicators',
            triangleUpClass: 'triangle-up',
            triangleDownClass: 'triangle-down',
            disabledClass: 'disabled'
        };
        Object.entries(classNames).forEach(([key, value]) => manager.setClassName(key, value));

        // CLASS NAME GETTERS
        manager.getSortIndicatorsClass = () => manager.getClassName('sortIndicatorsClass');
        manager.getTriangleUpClass = () => manager.getClassName('triangleUpClass');
        manager.getTriangleDownClass = () => manager.getClassName('triangleDownClass');
        manager.getDisabledClass = () => manager.getClassName('disabledClass');

        // ELEMENT CREATION METHODS
        manager.createSortIndicatorTemplate = function () {
            // Create container
            const sortIndicators = document.createElement('div');
            sortIndicators.className = this.getClassName('sortIndicatorsClass');

            // Create triangles
            const upTriangle = document.createElement('span');
            upTriangle.className = `${this.getClassName('triangleUpClass')} ${this.getClassName('disabledClass')}`;
            upTriangle.style.cursor = 'pointer';
            upTriangle.style.scale = 1.5;

            const downTriangle = document.createElement('span');
            downTriangle.className = `${this.getClassName('triangleDownClass')} ${this.getClassName('disabledClass')}`;
            downTriangle.style.cursor = 'pointer';
            downTriangle.style.scale = 1.5;

            // Assemble and style
            sortIndicators.appendChild(upTriangle);
            sortIndicators.appendChild(downTriangle);

            DOMUtils.batchUpdate(() => {
                sortIndicators.style.gap = '10px';
                sortIndicators.style.marginBottom = '6px';
                sortIndicators.style.display = 'flex';
            });

            return sortIndicators;
        };

        manager.createSortPlaceholder = function () {
            const placeholder = document.createElement('div');
            placeholder.className = 'sort-indicator-placeholder';
            return placeholder;
        };

        // DOM MANIPULATION METHODS
        manager.setTriangleState = function (element, direction, isActive) {
            if (!element) return;

            const upTriangle = element.querySelector(`.${this.getClassName('triangleUpClass')}`);
            const downTriangle = element.querySelector(`.${this.getClassName('triangleDownClass')}`);

            if (!upTriangle || !downTriangle) return;

            DOMUtils.batchUpdate(() => {
                // Reset both triangles to disabled
                upTriangle.classList.add(this.getClassName('disabledClass'));
                downTriangle.classList.add(this.getClassName('disabledClass'));

                // Set the active direction
                if (isActive && direction === 'up') {
                    upTriangle.classList.remove(this.getClassName('disabledClass'));
                } else if (isActive && direction === 'down') {
                    downTriangle.classList.remove(this.getClassName('disabledClass'));
                }
            });
        };

        manager.clearIndicator = function (element) {
            if (!element) return;

            const upTriangle = element.querySelector(`.${this.getClassName('triangleUpClass')}`);
            const downTriangle = element.querySelector(`.${this.getClassName('triangleDownClass')}`);

            DOMUtils.batchUpdate(() => {
                if (upTriangle) upTriangle.classList.add(this.getClassName('disabledClass'));
                if (downTriangle) downTriangle.classList.add(this.getClassName('disabledClass'));
            });
        };

        manager.removeIndicator = function (element) {
            if (!element || !element.parentNode) return;

            DOMUtils.batchUpdate(() => {
                element.parentNode.removeChild(element);
            });
        };

        return manager;
    }

    // PUBLIC API
    return {
        initialize(container) {
            if (!instance) instance = createSortIndicatorElementManager(container);
            return instance;
        },

        getInstance: () => instance,

        // Class name getters
        getSortIndicatorsClass: () => instance?.getSortIndicatorsClass() ?? 'sort-indicators',
        getTriangleUpClass: () => instance?.getTriangleUpClass() ?? 'triangle-up',
        getTriangleDownClass: () => instance?.getTriangleDownClass() ?? 'triangle-down',
        getDisabledClass: () => instance?.getDisabledClass() ?? 'disabled',

        // Element creation methods
        createSortIndicatorTemplate: () => instance?.createSortIndicatorTemplate() ?? null,
        createSortPlaceholder: () => instance?.createSortPlaceholder() ?? null,

        // DOM manipulation methods
        setTriangleState: (element, direction, isActive) => {
            if (instance) instance.setTriangleState(element, direction, isActive);
        },
        clearIndicator: (element) => {
            if (instance) instance.clearIndicator(element);
        },
        removeIndicator: (element) => {
            if (instance) instance.removeIndicator(element);
        },

        // Base methods
        setClassName: (key, value) => instance?.setClassName(key, value),
        getClassName: key => instance?.getClassName(key) ?? null,
        clearCache: () => instance?.clearCache()
    };
})();