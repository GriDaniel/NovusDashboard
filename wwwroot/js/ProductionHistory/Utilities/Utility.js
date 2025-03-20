/**
 * @module Utilities
 * @author Daniel Oliveira
 * @description Provides global utility helper functions for other modules
 */

/**
 * Performance monitoring tools
 */
const PerformanceTracker = (function () {
    const operationTimers = {};
    const enableDebugLogging = false;

    return {
        start(operationName) {
            operationTimers[operationName] = performance.now();
        },

        end(operationName) {
            if (!operationTimers[operationName]) return null;

            const durationMs = performance.now() - operationTimers[operationName];

            if (enableDebugLogging) {
                console.debug(`Performance: ${operationName} took ${durationMs.toFixed(2)}ms`);
            }

            delete operationTimers[operationName];
            return durationMs;
        }
    };
})();

/**
 * Batched DOM manipulation
 */
const DOMUtils = (function () {
    const pendingDOMUpdates = [];
    let isUpdateScheduled = false;

    return {
        batchUpdate(updateFunction) {
            if (typeof updateFunction !== 'function') {
                console.error('DOMUtils: Invalid update function');
                return;
            }

            pendingDOMUpdates.push(updateFunction);
            this.scheduleProcess();
        },

        scheduleProcess() {
            if (!isUpdateScheduled) {
                isUpdateScheduled = true;
                requestAnimationFrame(() => this.processUpdates());
            }
        },

        processUpdates() {
            PerformanceTracker.start('processDomUpdates');

            const updateBatch = [...pendingDOMUpdates];
            pendingDOMUpdates.length = 0;
            isUpdateScheduled = false;

            updateBatch.forEach(updateFn => {
                try {
                    updateFn();
                } catch (error) {
                    console.error('DOMUtils: Error in update operation:', error);
                }
            });

            PerformanceTracker.end('processDomUpdates');
        }
    };
})();

/**
 * DOM element caching system
 */
const ElementCache = (function () {
    const moduleElementCaches = new Map();

    return {
        createCache(moduleId) {
            if (!moduleId) {
                console.error('ElementCache: Module ID required');
                return null;
            }

            if (!moduleElementCaches.has(moduleId)) {
                moduleElementCaches.set(moduleId, {
                    containerElementMaps: new WeakMap()
                });
            }

            return {
                get(selector, container, forceQuery = false) {
                    if (!selector || !container) return null;

                    const moduleCache = moduleElementCaches.get(moduleId);
                    let containerMap = moduleCache.containerElementMaps.get(container);

                    if (!containerMap) {
                        containerMap = new Map();
                        moduleCache.containerElementMaps.set(container, containerMap);
                    }

                    if (!forceQuery && containerMap.has(selector)) {
                        return containerMap.get(selector);
                    }

                    const element = container.querySelector(selector);
                    if (element) containerMap.set(selector, element);

                    return element;
                },

                set(selector, element, container) {
                    if (!selector || !element || !container) return;

                    const moduleCache = moduleElementCaches.get(moduleId);
                    let containerMap = moduleCache.containerElementMaps.get(container);

                    if (!containerMap) {
                        containerMap = new Map();
                        moduleCache.containerElementMaps.set(container, containerMap);
                    }

                    containerMap.set(selector, element);
                },

                clear(container = null) {
                    const moduleCache = moduleElementCaches.get(moduleId);

                    if (container) {
                        const containerMap = moduleCache.containerElementMaps.get(container);
                        if (containerMap) containerMap.clear();
                    } else {
                        moduleCache.containerElementMaps = new WeakMap();
                    }
                },

                getAll(selector, container, forceQuery = false) {
                    if (!selector || !container) return [];

                    const moduleCache = moduleElementCaches.get(moduleId);
                    const collectionKey = `collection:${selector}`;

                    let containerMap = moduleCache.containerElementMaps.get(container);
                    if (!containerMap) {
                        containerMap = new Map();
                        moduleCache.containerElementMaps.set(container, containerMap);
                    }

                    if (!forceQuery && containerMap.has(collectionKey)) {
                        return containerMap.get(collectionKey);
                    }

                    const elements = Array.from(container.querySelectorAll(selector));
                    containerMap.set(collectionKey, elements);

                    return elements;
                }
            };
        }
    };
})();