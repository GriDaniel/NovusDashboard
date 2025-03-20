/**
 * @module DropdownContainerModule
 * @author Daniel Oliveira
 * @description Handles animations for different dropdown types and manages
 * interactions with their content. Provides a unified interface for working with
 * various dropdown behaviors across the application.
 */
const DropdownContainerModule = (function () {
    // Store dropdown instances for reference and control
    const instances = new Map();

    // Configuration defines elements needed for each dropdown type
    // and which setup function to use for its behavior
    const dropdownTypeConfig = {
        row: {
            elements: {
                arrow: (container) => DropdownElementManager.getArrow(container),
                valueContainer: (container) => DropdownElementManager.getValueContainer(container),
                valueText: (container) => DropdownElementManager.getValueText(container),
                staticInputButtons: (container) => DropdownElementManager.getStaticInputButtons(container),
                customInput: (container) => DropdownElementManager.getCustomInput(container),
                setButton: (container) => DropdownElementManager.getSetButton(container)
            },
            setup: setupRowDropdown
        },
        column: {
            elements: {
                staticInputButtons: (container) => DropdownElementManager.getStaticInputButtons(container),
                arrow: (container) => DropdownElementManager.getArrow(container),
                checkboxList: (container) => DropdownElementManager.getCheckboxList(container),
                checkboxItem: (container) => DropdownElementManager.getCheckboxItem(container)
            },
            setup: setupColumnDropdown
        },
        sort: {
            elements: {
                arrow: (container) => DropdownElementManager.getArrow(container)
            },
            setup: setupSortDropdown
        },
        search: {
            elements: {
                searchBar: () => SearchElementManager.getSearchInput(false),
                arrow: (container) => DropdownElementManager.getArrow(container)
            },
            setup: setupSearchDropdown
        }
    };

    // Creates a dropdown instance with elements and behaviors
    function createDropdown(container, type) {
        if (!container || !type) return null;

        const typeConfig = dropdownTypeConfig[type];
        if (!typeConfig) {
            console.warn(`Unknown dropdown type: ${type}`);
            return null;
        }

        // Get basic elements needed for any dropdown
        const elements = {
            button: DropdownElementManager.getDropdownButton(container),
            content: DropdownElementManager.getDropdownContent(container)
        };

        // Verify required elements exist
        if (!elements.button || !elements.content) {
            console.warn(`Required elements missing for ${type} dropdown`);
            return null;
        }

        // Add type-specific elements from config
        Object.entries(typeConfig.elements).forEach(([key, getter]) => {
            elements[key] = getter(container);
        });

        // Create dropdown state object
        const dropdown = {
            container,
            type,
            elements,
            isOpen: false,
            isInEditMode: true,
            selectedItem: null,  // Tracks selected item for highlighting
            hasCustomValue: false // Tracks if custom value is used
        };

        // Set up behaviors
        setupToggle(dropdown);
        typeConfig.setup(dropdown);

        return dropdown;
    }

    // Highlights selected item in dropdown
    // Ensures only one item is highlighted at a time
    function highlightSelectedItem(dropdown, button) {
        // Skip header/close button
        if (!button || button === DropdownElementManager.getStaticInputButtons(dropdown.container)[0]) {
            return;
        }

        // Clear previous selection highlight
        if (dropdown.selectedItem && dropdown.selectedItem !== button) {
            dropdown.selectedItem.style.backgroundColor = 'transparent';
        }

        // Apply highlight to new selection
        button.style.backgroundColor = '#8590A2';

        // Update tracking reference
        dropdown.selectedItem = button;

        // Reset custom value flag when selecting static input
        dropdown.hasCustomValue = false;
    }

    // Removes highlighting from all dropdown items
    function clearAllHighlights(dropdown) {
        const { staticInputButtons } = dropdown.elements;
        if (!staticInputButtons) return;

        // Reset background color for all buttons
        staticInputButtons.forEach(button => {
            button.style.backgroundColor = 'transparent';
        });

        // Clear selection reference
        dropdown.selectedItem = null;
    }

    // Sets up open/close behavior of dropdown
    function setupToggle(dropdown) {
        const { button, content } = dropdown.elements;
        const showClass = DropdownElementManager.getClassName('showClass');
        const openClass = DropdownElementManager.getClassName('openClass');

        // Handle button click
        button.addEventListener('click', () => {
            const isCurrentlyOpen = content.classList.contains(showClass);

            if (!isCurrentlyOpen) {
                // Close other dropdowns first
                closeAllDropdowns();

                // Open this dropdown
                DOMUtils.batchUpdate(() => {
                    content.classList.add(showClass);
                    dropdown.elements.arrow && dropdown.elements.arrow.classList.add(openClass);
                });

                dropdown.isOpen = true;

                // Add document click handler for outside clicks
                setTimeout(() => {
                    document.addEventListener('click', dropdown.outsideClickHandler = (event) => {
                        if (!button.contains(event.target) && !content.contains(event.target)) {
                            closeDropdown(dropdown);
                        }
                    });
                }, 0);
            } else {
                closeDropdown(dropdown);
            }
        });
    }

    // Closes a dropdown by removing classes and event handlers
    function closeDropdown(dropdown) {
        if (!dropdown.isOpen) return;

        const { content, arrow } = dropdown.elements;
        const showClass = DropdownElementManager.getClassName('showClass');
        const openClass = DropdownElementManager.getClassName('openClass');

        DOMUtils.batchUpdate(() => {
            content.classList.remove(showClass);
            arrow && arrow.classList.remove(openClass);
        });

        dropdown.isOpen = false;
        document.removeEventListener('click', dropdown.outsideClickHandler);
    }

    // Closes all open dropdowns
    function closeAllDropdowns() {
        instances.forEach(closeDropdown);
    }

    // Sets up row dropdown with row count selection
    function setupRowDropdown(dropdown) {
        const { elements } = dropdown;

        // Set default selection to first option
        const firstItem = DropdownElementManager.getStaticInputButtons(dropdown.container)[1];
        if (firstItem && elements.valueText) {
            setButtonText(dropdown, firstItem.textContent.trim());
            highlightSelectedItem(dropdown, firstItem);
        }

        // Set up handler for static input buttons
        setupStaticButtons(dropdown, (button, text) => {
            setButtonText(dropdown, text);
            resetCustomInput(dropdown);

            // Apply selection to table rows
            const currentPage = PaginationModule.getCurrentPage();
            const headers = ColumnManagerModule.getColumnHeaders();
            RowManagerModule.setRowCountWithData(text, currentPage, headers);

            // Notify about row count change
            const rowCount = parseInt(text, 10);
            if (!isNaN(rowCount)) {
                document.dispatchEvent(new CustomEvent('dropdown:rowCountChanged', {
                    bubbles: true,
                    detail: {
                        rowCount: rowCount,
                        source: 'staticInput'
                    }
                }));
            }
        });

        // Set up custom input
        setupCustomInput(dropdown);
    }

    // Sets up column dropdown with column visibility controls
    function setupColumnDropdown(dropdown) {
        // Track column move mode state
        let isInMoveMode = false;

        // Initialize checkboxes based on current columns
        initializeColumnCheckboxes(dropdown);

        // Update button states based on current columns
        const { staticInputButtons } = dropdown.elements;
        if (staticInputButtons && staticInputButtons.length) {
            const headers = ColumnManagerModule.getColumnHeaders();

            staticInputButtons.forEach(button => {
                const value = button.textContent.trim();
                const isIncluded = headers.includes(value);
                const isDisabled = button.classList.contains('disabled');

                if (isIncluded && !isDisabled) {
                    disableButton(button);
                } else if (!isIncluded && isDisabled) {
                    enableButton(button);
                }
            });
        }

        // Set up checkbox handlers
        setupColumnCheckboxHandlers(dropdown);

        // Function to enter column move mode
        function enterMoveColumnsMode() {
            if (isInMoveMode) return;

            const titleContainer = TableElementManager.getTableTitle();
            const controlsContainer = TableElementManager.getTableControls();
            const heading = TableElementManager.getTableTitleHeading();

            if (!titleContainer || !controlsContainer || !heading) {
                return;
            }

            DOMUtils.batchUpdate(() => {
                // Hide regular UI elements
                heading.style.display = 'none';
                Array.from(controlsContainer.children).forEach(child => {
                    child.style.display = 'none';
                });

                // Create move mode interface elements
                const selectText = TableElementManager.createMoveColumnsHeader();
                const exitButton = TableElementManager.createMoveColumnsExit();

                // Style elements
                selectText.style.fontSize = '20px';
                exitButton.style.fontSize = '18px';
                selectText.style.fontWeight = '400';
                exitButton.style.fontWeight = '400';
                selectText.style.paddingTop = '15px';
                exitButton.style.paddingTop = '15px';

                // Add exit handler
                exitButton.addEventListener('click', exitMoveColumnsMode);

                // Add elements to title area
                titleContainer.appendChild(selectText);
                titleContainer.appendChild(exitButton);
            });

            isInMoveMode = true;
            closeDropdown(dropdown);
        }

        // Function to exit column move mode
        function exitMoveColumnsMode() {
            if (!isInMoveMode) return;

            const titleContainer = TableElementManager.getTableTitle();
            const controlsContainer = TableElementManager.getTableControls();
            const heading = TableElementManager.getTableTitleHeading();

            if (!titleContainer || !controlsContainer) {
                console.warn('Required elements for column moving not found');
                return;
            }

            DOMUtils.batchUpdate(() => {
                // Remove move mode elements
                const selectText = titleContainer.querySelector(`.${TableElementManager.getClassName('moveColumnsHeader')}`);
                const exitButton = titleContainer.querySelector(`.${TableElementManager.getClassName('moveColumnsExit')}`);

                if (selectText) titleContainer.removeChild(selectText);
                if (exitButton) titleContainer.removeChild(exitButton);

                // Restore regular UI
                if (heading) {
                    heading.style.display = '';
                }
                Array.from(controlsContainer.children).forEach(child => {
                    child.style.display = '';
                });
            });

            isInMoveMode = false;
        }

        // Set up handler for static input buttons
        setupStaticButtons(dropdown, (button, text) => {
            if (text === 'Move Column(s)') {
                enterMoveColumnsMode();
            }
        });
    }

    // Initializes column checkboxes based on active columns
    function initializeColumnCheckboxes(dropdown) {
        const { checkboxList } = dropdown.elements;
        if (!checkboxList) return;

        // Get current column headers
        const headers = ColumnManagerModule.getColumnHeaders();

        // Find checkbox items
        const checkboxItemClass = DropdownElementManager.getClassName('checkboxItem');
        const checkboxItems = checkboxList.querySelectorAll(`.${checkboxItemClass}`);

        if (!checkboxItems || checkboxItems.length === 0) return;

        // Update checkboxes to match column state
        checkboxItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const label = item.querySelector('label');

            if (!checkbox || !label) return;

            const labelText = label.textContent.trim();
            const isActive = headers.includes(labelText);

            if (checkbox.checked !== isActive) {
                checkbox.checked = isActive;
            }
        });
    }

    // Sets up handlers for column visibility checkboxes
    function setupColumnCheckboxHandlers(dropdown) {
        const { checkboxList } = dropdown.elements;
        if (!checkboxList) return;

        // Find checkbox items
        const checkboxItemClass = DropdownElementManager.getClassName('checkboxItem');
        const checkboxItems = checkboxList.querySelectorAll(`.${checkboxItemClass}`);

        if (!checkboxItems || checkboxItems.length === 0) return;

        // Set up handlers for each checkbox
        checkboxItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const label = item.querySelector('label');

            if (!checkbox || !label) return;

            // Remove existing handlers to prevent duplicates
            checkbox.removeEventListener('change', checkbox._changeHandler);

            // Add change handler
            checkbox._changeHandler = function () {
                const labelText = label.textContent.trim();
                const isChecked = checkbox.checked;

                if (!isChecked) {
                    // Ensure at least one column remains visible
                    const headers = ColumnManagerModule.getColumnHeaders();
                    if (headers.length <= 3 && headers.includes(labelText)) {
                        checkbox.checked = true;
                        console.warn("At least one column must remain visible");
                        return;
                    }

                    // Remove column
                    const columnIndex = headers.indexOf(labelText);
                    if (columnIndex !== -1) {
                        ColumnManagerModule.deleteColumn(columnIndex, labelText);
                    }
                } else {
                    // Add column
                    ColumnManagerModule.addColumns(1, [labelText]);

                    // Notify about column addition
                    document.dispatchEvent(new CustomEvent('columnManager:columnAdded', {
                        bubbles: true,
                        detail: {
                            column: labelText,
                            page: PaginationModule.getCurrentPage(),
                            rowCount: RowManagerModule.getRowCount()
                        }
                    }));
                }
            };

            checkbox.addEventListener('change', checkbox._changeHandler);
        });
    }

    // Sets up sort dropdown with sorting controls
    function setupSortDropdown(dropdown) {
        const { content } = dropdown.elements;
        const staticInputClass = DropdownElementManager.getClassName('staticInput');
        let activeButton = null;
        let sortDirection = 'asc';

        // Use event delegation
        content.addEventListener('click', (event) => {
            const button = event.target.closest(`.${staticInputClass}`);
            if (!button) return;

            // Handle close button
            const firstButton = content.querySelector(`.${staticInputClass}`);
            if (button === firstButton) {
                closeDropdown(dropdown);
                return;
            }

            DOMUtils.batchUpdate(() => {
                // Clean up previous sort column
                if (activeButton && activeButton !== button) {
                    const oldIndicators = activeButton.querySelector('.sort-indicators');
                    oldIndicators && activeButton.removeChild(oldIndicators);
                    sortDirection = 'asc';
                }

                // Get or create sort indicators
                let indicators = button.querySelector('.sort-indicators');

                if (!indicators) {
                    // Create new indicators
                    indicators = document.createElement('span');
                    indicators.className = 'sort-indicators';
                    indicators.innerHTML = `
                        <span class="triangle-up"></span>
                        <span class="triangle-down disabled"></span>
                    `;
                    button.appendChild(indicators);
                } else {
                    // Toggle direction
                    const up = indicators.querySelector('.triangle-up');
                    const down = indicators.querySelector('.triangle-down');

                    if (sortDirection === 'asc') {
                        up.classList.add('disabled');
                        down.classList.remove('disabled');
                        sortDirection = 'desc';
                    } else {
                        up.classList.remove('disabled');
                        down.classList.add('disabled');
                        sortDirection = 'asc';
                    }
                }

                activeButton = button;
            });
        });
    }

    // Sets up search dropdown with search field controls
    function setupSearchDropdown(dropdown) {
        // Set initial selection
        const { searchBar } = dropdown.elements;
        const buttons = DropdownElementManager.getStaticInputButtons(dropdown.container);
        if (buttons && buttons.length > 1) {
            // Select first option after header
            highlightSelectedItem(dropdown, buttons[1]);
            if (searchBar) SearchBarModule.updateSearchPlaceholder(searchBar, buttons[1].textContent);
        }

        // Set up handlers for search type selection
        setupStaticButtons(dropdown, (button, text) => {
            if (searchBar) SearchBarModule.updateSearchPlaceholder(searchBar, text);
            SearchBarModule.clearSearch();
        });
    }

    // Sets up handlers for static input buttons
    function setupStaticButtons(dropdown, handler) {
        const { content } = dropdown.elements;
        if (!content || !handler) return;

        const staticInputClass = DropdownElementManager.getClassName('staticInput');

        // Use event delegation
        content.addEventListener('click', (event) => {
            const button = event.target.closest(`.${staticInputClass}`);
            if (!button) return;

            const text = button.textContent.trim();
            if (!text) return;

            // Handle header/close button
            if (dropdown.type !== 'sort' && button === DropdownElementManager.getStaticInputButtons(dropdown.container)[0]) {
                closeDropdown(dropdown);
                return;
            }

            // Handle option buttons
            if (text !== 'Close') {
                // Reset custom input when selecting predefined option
                if (dropdown.type === 'row' && dropdown.hasCustomValue) {
                    dropdown.hasCustomValue = false;
                    resetCustomInput(dropdown);
                }

                // Only highlight in non-column dropdowns
                if (dropdown.type !== 'column') {
                    highlightSelectedItem(dropdown, button);
                }

                // Call type-specific handler
                handler(button, text);
            }
        });
    }

    // Updates displayed text on dropdown button
    function setButtonText(dropdown, text) {
        if (!text) return;

        const { button, valueText } = dropdown.elements;

        if (valueText) {
            // Update existing text element
            DOMUtils.batchUpdate(() => {
                valueText.textContent = text;
                button.setAttribute('title', text);
            });
        } else if (button) {
            // Create structure for displaying value
            createValueStructure(dropdown, text);
        }
    }

    // Creates structure for displaying values in button
    function createValueStructure(dropdown, text) {
        const { button } = dropdown.elements;

        DOMUtils.batchUpdate(() => {
            const containerClass = DropdownElementManager.getClassName('valueContainer');
            const arrowClass = DropdownElementManager.getClassName('arrow');

            // Create elements
            const container = document.createElement('div');
            container.className = `${containerClass} gap-3 align-items-center justify-content-center mx-2`;

            const textElem = document.createElement('span');
            textElem.textContent = text;

            const arrow = document.createElement('span');
            arrow.className = arrowClass;

            // Save existing label text
            const buttonText = Array.from(button.childNodes)
                .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            const labelText = buttonText ? buttonText.textContent.trim() : '';

            // Rebuild button
            button.innerHTML = '';
            if (labelText) {
                button.appendChild(document.createTextNode(labelText));
            }

            container.appendChild(textElem);
            container.appendChild(arrow);
            button.appendChild(container);
            button.setAttribute('title', text);

            // Save references
            dropdown.elements.valueContainer = container;
            dropdown.elements.valueText = textElem;
            dropdown.elements.arrow = arrow;
        });
    }

    // Sets up custom input for entering values
    function setupCustomInput(dropdown) {
        const { customInput, setButton } = dropdown.elements;
        if (!customInput || !setButton) return;

        // Initial setup
        setButton.textContent = "Set";

        // Handle input validation with debounce
        let inputTimer;
        customInput.addEventListener('input', (event) => {
            // Allow only digits
            const value = event.target.value;
            if (value !== '' && !/^\d*$/.test(value)) {
                customInput.value = value.replace(/\D/g, '');
                return;
            }

            // Debounce constraint checking
            clearTimeout(inputTimer);
            inputTimer = setTimeout(() => {
                if (value !== '') {
                    const num = parseInt(value, 10);
                    if (num < 5) {
                        customInput.value = '5';  // Minimum value
                    } else if (num > 35) {
                        customInput.value = '35'; // Maximum value
                    }
                }
            }, 300);
        });

        // Validate on focus loss
        customInput.addEventListener('blur', () => {
            if (customInput.value.trim() !== '') {
                let value = parseInt(customInput.value, 10);
                if (isNaN(value) || value < 5) {
                    value = 5;  // Minimum value
                } else if (value > 35) {
                    value = 35; // Maximum value
                }
                customInput.value = value;
            }
        });

        // Initialize in edit mode
        dropdown.isInEditMode = true;
        setButton.textContent = "Set";
        customInput.disabled = false;

        // Handle Set/Edit button
        setButton.addEventListener('click', () => {
            if (dropdown.isInEditMode) {
                // In Edit mode, apply value
                const value = customInput.value.trim();
                const num = parseInt(value, 10);

                if (value && num >= 5 && num <= 35) {
                    // Clear existing static selection
                    clearAllHighlights(dropdown);

                    // Set button text
                    setButtonText(dropdown, value);

                    // Apply value to data
                    const currentPage = PaginationModule.getCurrentPage();
                    const headers = ColumnManagerModule.getColumnHeaders();
                    RowManagerModule.setRowCountWithData(value, currentPage, headers);

                    // Switch to view mode
                    setButton.textContent = "Edit";
                    customInput.disabled = true;
                    dropdown.isInEditMode = false;
                    dropdown.hasCustomValue = true;

                    // Notify about row count change
                    document.dispatchEvent(new CustomEvent('dropdown:rowCountChanged', {
                        bubbles: true,
                        detail: {
                            rowCount: num,
                            source: 'customInput'
                        }
                    }));
                }
            } else {
                // In View mode, switch to Edit mode
                setButton.textContent = "Set";
                customInput.disabled = false;
                dropdown.isInEditMode = true;
            }
        });
    }

    // Resets custom input to initial state
    function resetCustomInput(dropdown) {
        const { customInput, setButton } = dropdown.elements;
        if (!customInput || !setButton) return;

        DOMUtils.batchUpdate(() => {
            setButton.textContent = "Set";
            customInput.disabled = false;
            customInput.value = '';
        });

        dropdown.isInEditMode = true;
        dropdown.hasCustomValue = false;
    }

    // Disables a button
    function disableButton(button) {
        DOMUtils.batchUpdate(() => {
            button.disabled = true;
            button.classList.add('disabled');
        });
    }

    // Enables a button
    function enableButton(button) {
        DOMUtils.batchUpdate(() => {
            button.disabled = false;
            button.classList.remove('disabled');
        });
    }

    // Gets custom input value if set
    function getCustomInputValue(dropdown) {
        if (!dropdown.hasCustomValue) return null;

        const { valueText } = dropdown.elements;
        if (valueText) {
            const text = valueText.textContent.trim();
            const count = parseInt(text, 10);
            return !isNaN(count) ? count : null;
        }

        return null;
    }

    // Public API
    return {
        // Initializes dropdown functionality for containers
        initialize(containers) {
            try {
                // Initialize element manager if needed
                !DropdownElementManager.getInstance() && DropdownElementManager.initialize(document.body);

                // Handle container formats
                const containerArray = Array.isArray(containers) || containers instanceof NodeList
                    ? containers
                    : [containers];

                // Create dropdown instances
                containerArray.forEach(container => {
                    const type = DropdownElementManager.getDropdownType(container);
                    if (!type) return;

                    const dropdown = createDropdown(container, type);
                    if (dropdown) {
                        instances.set(container, dropdown);
                    }
                });

                return this;
            } catch (error) {
                console.error('Error initializing dropdowns:', error);
                return null;
            }
        },

        // Gets instance for specific container
        getDropdownInstance(container) {
            return instances.get(container) || null;
        },

        // Gets instances of specific dropdown type
        getInstancesByType(type) {
            if (!type) return [];

            const typeInstances = [];
            const containers = DropdownElementManager.getInstancesByType(type);

            containers.forEach(container => {
                const instance = instances.get(container);
                instance && typeInstances.push(instance);
            });

            return typeInstances;
        },

        // Gets custom row count if set
        getCustomRowCount() {
            // Find row-type dropdowns
            const rowDropdowns = this.getInstancesByType('row');

            // Return null if none exist
            if (!rowDropdowns || rowDropdowns.length === 0) {
                return null;
            }

            // Get first dropdown
            const dropdown = rowDropdowns[0];

            // Return custom value if present
            return dropdown.hasCustomValue ? getCustomInputValue(dropdown) : null;
        },

        // Gets selected row count (custom or predefined)
        getSelectedRowCount() {
            // Find row-type dropdowns
            const rowDropdowns = this.getInstancesByType('row');

            // Use default if none exist
            if (!rowDropdowns || rowDropdowns.length === 0) {
                return 10; // Default value
            }

            // Get first dropdown
            const dropdown = rowDropdowns[0];

            // Check custom value first
            if (dropdown.hasCustomValue) {
                const customValue = getCustomInputValue(dropdown);
                if (customValue !== null) {
                    return customValue;
                }
            }

            // Try value from display text
            if (dropdown.elements.valueText) {
                const text = dropdown.elements.valueText.textContent.trim();
                const count = parseInt(text, 10);
                return !isNaN(count) ? count : 10;
            }

            // Try value from selected item
            if (dropdown.selectedItem) {
                const text = dropdown.selectedItem.textContent.trim();
                const count = parseInt(text, 10);
                return !isNaN(count) ? count : 10;
            }

            // Default value
            return 10;
        },

        // Checks if custom row count is being used
        hasCustomRowCount() {
            // Find row-type dropdowns
            const rowDropdowns = this.getInstancesByType('row');

            // Return false if none exist
            if (!rowDropdowns || rowDropdowns.length === 0) {
                return false;
            }

            // Return custom value state
            return rowDropdowns[0].hasCustomValue === true;
        },

        // Exposes dropdown closing function
        closeAllDropdowns
    };
})();