/**
 * @module BaseElementManager
 * @Author Da
 * @description Factory for creating element managers with built-in caching methods 
 */
const BaseElementManager = (function () {
    return {
        createElementManager(moduleType, container) {
            return {
                moduleContainer: container instanceof NodeList ? container[0] : container,
                elementCache: ElementCache.createCache(moduleType),
                classNameRegistry: {},

                getElement(selector, errorContext = moduleType, forceQuery = false, targetContainer) {
                    const container = targetContainer || this.moduleContainer;
                    const element = this.elementCache.get(selector, container, forceQuery);
                    if (!element) console.warn(`${errorContext} --> Element not found: ${selector}`);
                    return element;
                },

                getElements(selector, errorContext = moduleType, forceQuery = false, targetContainer) {
                    const container = targetContainer || this.moduleContainer;
                    const elements = this.elementCache.getAll(selector, container, forceQuery);
                    if (!elements?.length) console.warn(`${errorContext} --> Elements not found: ${selector}`);
                    return elements || [];
                },

                setClassName(key, value) {
                    this.classNameRegistry[key] = value;
                },

                getClassName(key) {
                    return this.classNameRegistry[key] || '';
                },

                clearCache() {
                    this.elementCache.clear();
                }
            };
        }
    };
})();