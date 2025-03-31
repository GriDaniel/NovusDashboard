/**
 * @title DropdownContainerModule
 * @description  Handles animations and interactions for different dropdown types
 *               Provides a unified interface for various dropdown behaviors
 * @author Daniel Oliveira
 */
const DropdownContainerModule = (function () {
    let instance = null;

    class DropdownManager {
        static SUPPORTED_COLUMNS = [
            'Name',
            'File Path',
            'Profile Name',
            'Length',
            'Front-cut Off Distance',
            'Square-up Distance'
        ];

        constructor() {
            this.instances = new Map();
            this._lastSelectedRow = null;

            // Configuration for dropdown types with element selection and setup method
            this.dropdownTypeConfig = {
                row: {
                    elements: {
                        button: DropdownElementManager.getDropdownButton,
                        valueContainer: DropdownElementManager.getValueContainer,
                        valueText: DropdownElementManager.getValueText,
                        customInput: DropdownElementManager.getCustomInput,
                        setButton: DropdownElementManager.getSetButton
                    },
                    setup: this.setupRowDropdown.bind(this)
                },
                column: {
                    elements: {
                        button: DropdownElementManager.getDropdownButton,
                        checkboxList: DropdownElementManager.getCheckboxList,
                        checkboxItem: DropdownElementManager.getCheckboxItem
                    },
                    setup: this.setupColumnDropdown.bind(this)
                },
                sort: {
                    elements: {
                        button: DropdownElementManager.getDropdownButton,
                        closeIcon: DropdownElementManager.getCloseIcon
                    },
                    setup: this.setupSortDropdown.bind(this)
                },
                search: {
                    elements: {
                        button: DropdownElementManager.getDropdownButton,
                        searchBar: () => SearchElementManager.getSearchInput(false)
                    },
                    setup: this.setupSearchDropdown.bind(this)
                },
                'column-title': {
                    elements: {
                        button: DropdownElementManager.getDropdownButtonColumn
                    },
                    setup: this.setupColumnTitleDropdown.bind(this)
                }
            };
        }

        // DROPDOWN INITIALIZATION & MANAGEMENT METHODS

        createDropdown(container, type) {
            if (!container || !type) return null;

            const typeConfig = this.dropdownTypeConfig[type];
            if (!typeConfig) {
                console.warn(`Unknown dropdown type: ${type}`);
                return null;
            }

            // Get basic elements common to all dropdowns
            const elements = {
                content: DropdownElementManager.getDropdownContent(container),
                arrow: DropdownElementManager.getArrow(container),
                staticInputButtons: DropdownElementManager.getStaticInputButtons(container)
            }

            // Add type-specific elements
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
                selectedItem: null,
                hasCustomValue: false
            };

            // Set up behaviors
            this.setupToggle(dropdown);
            typeConfig.setup(dropdown);

            return dropdown;
        }

        initializeDropdowns(containers) {
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

                const dropdown = this.createDropdown(container, type);
                if (dropdown) {
                    this.instances.set(container, dropdown);
                }
            });
        }

        getDropdownInstance(container) {
            return this.instances.get(container) || null;
        }

        getInstancesByType(type) {
            if (!type) return [];

            const typeInstances = [];
            const containers = DropdownElementManager.getInstancesByType(type);

            containers.forEach(container => {
                const instance = this.instances.get(container);
                instance && typeInstances.push(instance);
            });

            return typeInstances;
        }

        // DROPDOWN VISIBILITY CONTROLS

        setupToggle(dropdown) {
            const { button, content } = dropdown.elements;
            const showClass = DropdownElementManager.getClassName('showClass');
            const openClass = DropdownElementManager.getClassName('openClass');
            const sortIndicatorsClass = SortIndicatorElementManager.getSortIndicatorsClass();

            button.addEventListener('click', () => {
                const isCurrentlyOpen = content.classList.contains(showClass);

                if (!isCurrentlyOpen) {
                    // Close other dropdowns first
                    this.closeAllDropdowns();

                    // Open this dropdown
                    DOMUtils.batchUpdate(() => {
                        content.classList.add(showClass);
                        dropdown.elements.arrow && dropdown.elements.arrow.classList.add(openClass);
                    });

                    dropdown.isOpen = true;

                    // Add document click handler for outside clicks
                    setTimeout(() => {
                        document.addEventListener('click', dropdown.outsideClickHandler = (event) => {
                            if (dropdown.type === 'sort' && event.target.closest(`.${sortIndicatorsClass}`)) {
                                return; // Prevent closing if clicking inside a sort indicator
                            }

                            // Close on clicks outside dropdown
                            if (!button.contains(event.target) && !content.contains(event.target)) {
                                this.closeDropdown(dropdown);
                            }
                        });
                    }, 0);
                } else {
                    this.closeDropdown(dropdown);
                }
            });
        }

        closeDropdown(dropdown) {
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

        closeAllDropdowns() {
            this.instances.forEach(dropdown => this.closeDropdown(dropdown));
        }

        // DROPDOWN SELECTION & HIGHLIGHTING METHODS

        setupCloseListener(dropdown) {
            const { staticInputButtons } = dropdown.elements;
            if (!staticInputButtons || staticInputButtons.length === 0) return;

            // Get the first button (header/close button)
            const closeButton = staticInputButtons[0];
            if (!closeButton) return;

            closeButton.addEventListener('click', () => {
                this.closeDropdown(dropdown);
            });
        }

        highlightSelectedItem(dropdown, button) {
            // Skip header/close button
            if (!button || button === dropdown.elements.staticInputButtons[0]) {
                return;
            }

            // Clear previous selection highlight
            if (dropdown.selectedItem && dropdown.selectedItem !== button) {
                dropdown.selectedItem.style.backgroundColor = 'transparent';
            }

            // Apply highlight to new selection
            button.style.backgroundColor = '#DCDFE4';
            dropdown.selectedItem = button;
            dropdown.hasCustomValue = false;
        }

        clearAllHighlights(dropdown) {
            const { staticInputButtons } = dropdown.elements;
            if (!staticInputButtons) return;

            staticInputButtons.forEach(button => {
                button.style.backgroundColor = 'transparent';
            });

            dropdown.selectedItem = null;
        }

        setButtonText(dropdown, text) {
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
                this.createValueStructure(dropdown, text);
            }
        }

        createValueStructure(dropdown, text) {
            const { button } = dropdown.elements;
            const { textElem, arrow } = DropdownElementManager.createValueStructure(button, text);

            if (textElem && arrow) {
                dropdown.elements.valueText = textElem;
                dropdown.elements.arrow = arrow;
            }

            DOMUtils.batchUpdate(() => {
                const arrowClass = DropdownElementManager.getClassName('arrow');

                textElem.textContent = text;
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

                button.appendChild(textElem);
                button.appendChild(arrow);
                button.setAttribute('title', text);

                // Save references
                dropdown.elements.valueText = textElem;
                dropdown.elements.arrow = arrow;
            });
        }

        // BUTTON STATE METHODS

        disableButton(button) {
            DOMUtils.batchUpdate(() => {
                button.disabled = true;
                button.classList.add('disabled');
            });
        }

        enableButton(button) {
            DOMUtils.batchUpdate(() => {
                button.disabled = false;
                button.classList.remove('disabled');
            });
        }

        // ROW COUNT METHODS

        getLastSelectedRow() {
            return this._lastSelectedRow;
        }

        getCustomRowCount() {
            const rowDropdowns = this.getInstancesByType('row');
            if (!rowDropdowns || rowDropdowns.length === 0) return null;

            const dropdown = rowDropdowns[0];
            return dropdown.hasCustomValue ? this.getCustomInputValue(dropdown) : null;
        }

        getSelectedRowCount() {
            const rowDropdowns = this.getInstancesByType('row');
            if (!rowDropdowns || rowDropdowns.length === 0) return 10; // Default

            const dropdown = rowDropdowns[0];

            // Check custom value first
            if (dropdown.hasCustomValue) {
                const customValue = this.getCustomInputValue(dropdown);
                if (customValue !== null) return customValue;
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

            return 10; // Default
        }

        setSelectedRowCount(rowCount) {
            rowCount = parseInt(rowCount, 10);
            console.log("setting with rowcount,", rowCount);
            if (isNaN(rowCount) || rowCount < 0) {
                console.warn('Invalid row count provided:', rowCount);
                return false;
            }

            const rowDropdowns = this.getInstancesByType('row');
            if (!rowDropdowns || rowDropdowns.length === 0) {
                console.warn('No row dropdown found to update');
                return false;
            }

            const dropdown = rowDropdowns[0];
            const { elements } = dropdown;
            const { staticInputButtons, customInput, setButton } = elements;

            // Update button text
            this.setButtonText(dropdown, rowCount.toString());

            // Check if count matches a predefined option
            let matchingOption = null;
            if (staticInputButtons && staticInputButtons.length > 1) {
                for (let i = 1; i < staticInputButtons.length; i++) {
                    const btnText = staticInputButtons[i].textContent.trim();
                    const btnValue = parseInt(btnText, 10);
                    if (btnValue === rowCount) {
                        matchingOption = staticInputButtons[i];
                        break;
                    }
                }
            }

            // If we found a matching preset option
            if (matchingOption) {
                if (dropdown.hasCustomValue) {
                    dropdown.hasCustomValue = false;
                    this.resetCustomInput(dropdown);
                }
                this.highlightSelectedItem(dropdown, matchingOption);
            }
            // Otherwise, set as custom value
            else if (customInput && setButton) {
                this.clearAllHighlights(dropdown);
                customInput.value = rowCount.toString();
                setButton.textContent = "Edit";
                customInput.disabled = true;
                dropdown.isInEditMode = false;
                dropdown.hasCustomValue = true;
            }

            return true;
        }

        hasCustomRowCount() {
            const rowDropdowns = this.getInstancesByType('row');
            return rowDropdowns && rowDropdowns.length > 0 ?
                rowDropdowns[0].hasCustomValue === true : false;
        }

        // CUSTOM INPUT HANDLING METHODS

        getCustomInputValue(dropdown) {
            if (!dropdown.hasCustomValue) return null;

            const { valueText } = dropdown.elements;
            if (valueText) {
                const text = valueText.textContent.trim();
                const count = parseInt(text, 10);
                return !isNaN(count) ? count : null;
            }

            return null;
        }

        setupCustomInput(dropdown) {
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
                if (!dropdown.isInEditMode) {
                    // In View mode, switch to Edit mode
                    setButton.textContent = "Set";
                    customInput.disabled = false;
                    dropdown.isInEditMode = true;
                    return;
                }

                // In Edit mode, get and validate value
                const value = customInput.value.trim();
                const num = parseInt(value, 10);

                // Validate input
                if (!value || num < 5 || num > 35) return;

                // Clear existing static selection
                this.clearAllHighlights(dropdown);

                // Switch to view mode
                setButton.textContent = "Edit";
                customInput.disabled = true;
                dropdown.isInEditMode = false;
                dropdown.hasCustomValue = true;

                // Update tracking variables
                this._lastSelectedRow = value;

                // Get stored count and current page
                const storedCount = TableDataModule.getStoredCount();
                const currentPage = PaginationModule.getCurrentPage();

                // Check if value exceeds stored count
                if (num > storedCount) {
                    
                    DropdownContainerModule.setSelectedRowCount(storedCount);
                    DropdownContainerModule.enableAllResults(storedCount);
                    RowManagerModule.setRowCountWithData(storedCount, currentPage);
                    PaginationModule.setMaxPage(1);
                    PaginationModule.goToPage(1);
                    return;
                }

                // Dispatch row count change event
                document.dispatchEvent(new CustomEvent('dropdown:rowCountChanged', {
                    bubbles: true,
                    detail: {
                        rowCount: num,
                        source: 'customInput'
                    }
                }));

                // Process in next event loop
                setTimeout(() => {
                    const maxPageText = PaginationElementManager.getMaxPage().textContent;
                    const maxPage = parseInt(maxPageText.match(/\d+/)[0], 10);
                    const currentRowAmount = DropdownContainerModule.getSelectedRowCount();
                    const startingIndex = (currentPage - 1) * currentRowAmount;

                    // Calculate new page based on new row count
                    const newRowAmount = num;
                    const newPage = Math.max(1, Math.floor(startingIndex / newRowAmount) + 1);

                    // Validate new page doesn't exceed max page
                    const validNewPage = Math.min(newPage, maxPage);

                    // Get data for the new page configuration
                    const columns = ColumnElementManager.getColumnHeaders();

                    // Handle row count for last page or regular pages
                    if (validNewPage === maxPage) {
                        const remainingRows = storedCount - ((maxPage - 1) * newRowAmount);
                        RowManagerModule.setRowCountWithData(remainingRows, validNewPage);
                    } else {
                        RowManagerModule.setRowCount(value);
                    }

                    // Update UI after row count is set
                    setTimeout(() => {
                        const allRows = RowElementManager.getAllRows();
                        PaginationModule.goToPage(validNewPage);
                        DropdownContainerModule.disableAllResults();
                        this.setButtonText(dropdown, value);
                    }, 10);

                }, 10);
            });
        }

        resetCustomInput(dropdown) {
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

        // RESULTS DISPLAY METHODS

        enableAllResults(key) {
            const searchText = SearchElementManager.getSearchContainer();
            searchText.textContent = `Showing ${key} ${key === 1 ? 'item' : 'items'}`;
        }

        disableAllResults() {
            const searchText = SearchElementManager.getSearchContainer();
            searchText.textContent = '';
            DropdownContainerModule.setSelectedRowCount(this._lastSelectedRow);
        }

        // DROPDOWN TYPE-SPECIFIC SETUP METHODS

        setupRowDropdown(dropdown) {
            const { elements } = dropdown;
            const { staticInputButtons, content } = elements;

            // Setup close listener
            this.setupCloseListener(dropdown);

            // Set default selection to first option
            let loadValue;
            const loadItem = staticInputButtons.find(button => button.textContent.trim() == RowManagerModule.getRowCount());
            if (loadItem) { loadValue = loadItem.textContent; }
            else {
                loadValue = RowManagerModule.getRowCount();
            }
            console.log("I set with value", loadValue);
            this._lastSelectedRow = loadValue;
            this.setButtonText(dropdown, loadValue);
           
               
                
           

            // Set up handler for static input buttons
            const staticInputClass = DropdownElementManager.getClassName('staticInput');

            // Use event delegation
            content.addEventListener('click', (event) => {
                const button = event.target.closest(`.${staticInputClass}`);
                if (!button) return;
                console.log("clicked!");
                // Skip the first button (header/close)
                if (button === staticInputButtons[0]) return;

                const text = button.textContent.trim();
                if (!text) return;

           
                if ((parseInt(text, 10) === RowElementManager.getRowCount()) && PaginationElementManager.getCurrentPage() === 1) {
                    return;
                }
                // Reset custom input if active
                if (dropdown.hasCustomValue) {
                    dropdown.hasCustomValue = false;
                    this.resetCustomInput(dropdown);
                }

                // Highlight selected item
                this.highlightSelectedItem(dropdown, button);

                this._lastSelectedRow = text;
                const storedCount = TableDataModule.getStoredCount();
                const currentPage = PaginationModule.getCurrentPage();
                if (text > storedCount) {
                 
                    DropdownContainerModule.setSelectedRowCount(storedCount);
                    DropdownContainerModule.enableAllResults(storedCount);
                    RowManagerModule.setRowCountWithData(storedCount, currentPage);
                    PaginationModule.setMaxPage(1);
                    PaginationModule.goToPage(1);
                    return;

                }
                else {
                    const rowCount = parseInt(text, 10);
                    if (!isNaN(rowCount)) {
                        document.dispatchEvent(new CustomEvent('dropdown:rowCountChanged', {
                            bubbles: true,
                            detail: { rowCount: rowCount, source: 'staticInput' }
                        }));
                        // Process in next event loop
                        setTimeout(() => {
                            const maxPageText = PaginationElementManager.getMaxPage().textContent;
                            const maxPage = parseInt(maxPageText.match(/\d+/)[0], 10);
                            const currentRowAmount = DropdownContainerModule.getSelectedRowCount();
                            const startingIndex = (currentPage - 1) * currentRowAmount;
                            // Calculate new page based on new row count
                            const newRowAmount = parseInt(text, 10);
                            const newPage = Math.max(1, Math.floor(startingIndex / newRowAmount) + 1);
                            // Validate new page doesn't exceed max page
                            const validNewPage = Math.min(newPage, maxPage);
                            // Get data for the new page configuration
                            const columns = ColumnElementManager.getColumnHeaders();
                            let remainingRows = null;
                            if (validNewPage === maxPage) {
                                remainingRows = storedCount - ((maxPage - 1) * newRowAmount);
                                RowManagerModule.setRowCountWithData(remainingRows, validNewPage);
                            }
                            else {
                                RowManagerModule.setRowCount(text);
                            }
                            setTimeout(() => {
                                const allRows = RowElementManager.getAllRows();
                                PaginationModule.goToPage(validNewPage);
                                DropdownContainerModule.disableAllResults();
                            }, 10); 
                            
                        }, 10);
                    }
                }
               
            });

            document.addEventListener('search:cleared', function (event) {
                this.disableAllResults();
            }.bind(this));

            // Set up custom input
            this.setupCustomInput(dropdown);
        }

        setupColumnDropdown(dropdown) {
            const { elements } = dropdown;
            const { staticInputButtons, content } = elements;

            // Setup close listener
            this.setupCloseListener(dropdown);

            // Track column move mode state
            let isInMoveMode = false;

            // Initialize checkboxes based on current columns
            this.initializeColumnCheckboxes(dropdown);

            // Update button states based on current columns
            if (staticInputButtons && staticInputButtons.length) {
                const headers = ColumnManagerModule.getColumnHeaders();

                staticInputButtons.forEach(button => {
                    const value = button.textContent.trim();
                    const isIncluded = headers.includes(value);
                    const isDisabled = button.classList.contains('disabled');

                    if (isIncluded && !isDisabled) {
                        this.disableButton(button);
                    } else if (!isIncluded && isDisabled) {
                        this.enableButton(button);
                    }
                });
            }

            // Set up checkbox handlers
            this.setupColumnCheckboxHandlers(dropdown);

            document.addEventListener('columnTitle:changed', (event) => {
                const { oldTitle, newTitle } = event.detail;

                // Find checkbox items
                const checkboxItemClass = DropdownElementManager.getClassName('checkboxItem');
                const checkboxList = dropdown.elements.checkboxList;
                if (!checkboxList) return;

                const checkboxItems = checkboxList.querySelectorAll(`.${checkboxItemClass}`);

                // Update all checkboxes - uncheck the old title's checkbox
                checkboxItems.forEach(item => {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    const label = item.querySelector('label');

                    if (!checkbox || !label) return;

                    const labelText = label.textContent.trim();

                    // If label matches the old title, uncheck it
                    if (labelText === oldTitle) {
                        checkbox.checked = false;
                    }

                    // If label matches the new title, make sure it's checked
                    if (labelText === newTitle) {
                        checkbox.checked = true;
                    }
                });
            });

            

            // Set up handler for static input buttons
            const staticInputClass = DropdownElementManager.getClassName('staticInput');

            // Use event delegation
            content.addEventListener('click', (event) => {
                const button = event.target.closest(`.${staticInputClass}`);
                if (!button) return;

                // Skip the first button (header/close)
                if (button === staticInputButtons[0]) return;

                const text = button.textContent.trim();
                if (!text) return;

               
            });
        }

        initializeColumnCheckboxes(dropdown) {
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

        setupColumnCheckboxHandlers(dropdown) {
            const { checkboxList } = dropdown.elements;
            if (!checkboxList) return;

            // Find checkbox items
            const checkboxItemClass = DropdownElementManager.getClassName('checkboxItem');

            // Clear existing handlers to prevent duplication
            if (checkboxList._changeHandler) {
                checkboxList.removeEventListener('change', checkboxList._changeHandler);
            }
            if (checkboxList._clickHandler) {
                checkboxList.removeEventListener('click', checkboxList._clickHandler);
            }

            // Create a proper queue system for column operations
            dropdown._operationQueue = {
                isProcessing: false,      // Flag to track if an operation is in progress
                pendingOperations: [],    // Queue of operations to process

                // Add an operation to the queue and process if not busy
                enqueue: function (operation) {
                    this.pendingOperations.push(operation);
                    if (!this.isProcessing) {
                        this.processNext();
                    }
                },

                // Process the next operation in the queue
                processNext: function () {
                    if (this.pendingOperations.length === 0) {
                        this.isProcessing = false;
                        return;
                    }

                    this.isProcessing = true;
                    const nextOperation = this.pendingOperations.shift();

                    // Execute the operation, which should return a promise
                    nextOperation()
                        .then(() => {
                            // Process the next operation when this one completes
                            this.processNext();
                        })
                        .catch(error => {
                            console.error('Error processing column operation:', error);
                            // Continue with next operation even if this one failed
                            this.processNext();
                        });
                }
            };

            // CLICK HANDLER: This is the primary handler that addresses dead zones
            checkboxList._clickHandler = function (event) {
                // Get the checkbox item, regardless of which child was clicked
                const item = event.target.closest(`.${checkboxItemClass}`);
                if (!item) return;

                // Find the checkbox within the item
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (!checkbox || checkbox.disabled) return;

                // Get label text
                const label = item.querySelector('label');
                if (!label) return;
                const labelText = label.textContent.trim();

                // If we clicked on the item but NOT directly on the checkbox, toggle it manually
                if (event.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;

                    // We need to prevent default behavior here to avoid any browser quirks
                    event.preventDefault();
                    event.stopPropagation();
                }

                // Now that the checkbox is in the correct state, get its checked value
                const isChecked = checkbox.checked;

                // Set visual state immediately for better UX
                item.classList.add('waiting');

                // Create an operation function that returns a promise
                const performOperation = () => {
                    return new Promise((resolve) => {
                        // Visual feedback that operation is in progress
                        item.classList.remove('waiting');
                        item.classList.add('processing');
                        checkbox.disabled = true;

                        if (!isChecked) {
                            // Ensure at least three columns remains visible
                            const headers = ColumnManagerModule.getColumnHeaders();
                            if (headers.length <= 3 && headers.includes(labelText)) {
                                // Revert checkbox state - minimum columns requirement
                                checkbox.checked = true;
                                checkbox.disabled = false;
                                item.classList.remove('processing', 'waiting');
                                resolve();
                                return;
                            }

                            // Remove column
                            const columnIndex = headers.indexOf(labelText);
                            if (columnIndex !== -1) {
                                const deleteOperation = ColumnManagerModule.deleteColumn(columnIndex, labelText);

                                // Handle both Promise and non-Promise returns
                                if (deleteOperation instanceof Promise) {
                                    deleteOperation.finally(() => {
                                        checkbox.disabled = false;
                                        item.classList.remove('processing', 'waiting');
                                        resolve();
                                    });
                                } else {
                                    setTimeout(() => {
                                        checkbox.disabled = false;
                                        item.classList.remove('processing', 'waiting');
                                        resolve();
                                    }, 50);
                                }
                            } else {
                                // Column not found - just resolve
                                checkbox.disabled = false;
                                item.classList.remove('processing', 'waiting');
                                resolve();
                            }
                        } else {
                            // Add column
                            const addOperation = ColumnManagerModule.addColumns(1, [labelText]);
                            const columnIndex = ColumnElementManager.getColumnTitleIndex(labelText);

                            // Notify about column addition
                            document.dispatchEvent(new CustomEvent('columnManager:columnAdded', {
                                bubbles: true,
                                detail: {
                                    column: labelText,
                                    columnIndex,
                                    page: PaginationModule.getCurrentPage(),
                                    rowCount: RowManagerModule.getRowCount()
                                }
                            }));

                            // Handle both Promise and non-Promise returns
                            if (addOperation instanceof Promise) {
                                addOperation.finally(() => {
                                    checkbox.disabled = false;
                                    item.classList.remove('processing', 'waiting');
                                    resolve();
                                });
                            } else {
                                setTimeout(() => {
                                    checkbox.disabled = false;
                                    item.classList.remove('processing', 'waiting');
                                    resolve();
                                }, 300);
                            }
                        }
                    });
                };

                // Add this operation to the queue
                dropdown._operationQueue.enqueue(performOperation);
            };

            // CHANGE HANDLER: As a backup for normal checkbox changes
            checkboxList._changeHandler = function (event) {
                // Only process direct checkbox changes
                if (event.target.type !== 'checkbox') return;

                const item = event.target.closest(`.${checkboxItemClass}`);
                if (!item) return;

                // If this item is already being processed, do nothing
                if (item.classList.contains('waiting') || item.classList.contains('processing')) {
                    return;
                }

                // The checkbox was directly clicked, so let's handle it
                // (This is a backup for the click handler)
                const checkbox = event.target;
                const label = item.querySelector('label');
                if (!label) return;

                const labelText = label.textContent.trim();
                const isChecked = checkbox.checked;

                // We'll reuse the same operation queue logic as the click handler
                // But we'll apply it directly through the API here

                // Set visual state immediately
                item.classList.add('waiting');

                // Create operation function
                const performOperation = () => {
                    // Same implementation as in click handler
                    // ...
                    return new Promise((resolve) => {
                        // Same implementation as above - identical to click handler
                        // This is just a fallback
                        item.classList.remove('waiting');
                        item.classList.add('processing');
                        checkbox.disabled = true;

                        if (!isChecked) {
                            // Ensure minimum columns
                            const headers = ColumnManagerModule.getColumnHeaders();
                            if (headers.length <= 3 && headers.includes(labelText)) {
                                checkbox.checked = true;
                                checkbox.disabled = false;
                                item.classList.remove('processing', 'waiting');
                                resolve();
                                return;
                            }

                            // Remove column
                            const columnIndex = headers.indexOf(labelText);
                            if (columnIndex !== -1) {
                                const deleteOperation = ColumnManagerModule.deleteColumn(columnIndex, labelText);

                                if (deleteOperation instanceof Promise) {
                                    deleteOperation.finally(() => {
                                        checkbox.disabled = false;
                                        item.classList.remove('processing', 'waiting');
                                        resolve();
                                    });
                                } else {
                                    setTimeout(() => {
                                        checkbox.disabled = false;
                                        item.classList.remove('processing', 'waiting');
                                        resolve();
                                    }, 50);
                                }
                            } else {
                                checkbox.disabled = false;
                                item.classList.remove('processing', 'waiting');
                                resolve();
                            }
                        } else {
                            // Add column
                            const addOperation = ColumnManagerModule.addColumns(1, [labelText]);
                            const columnIndex = ColumnElementManager.getColumnTitleIndex(labelText);

                            document.dispatchEvent(new CustomEvent('columnManager:columnAdded', {
                                bubbles: true,
                                detail: {
                                    column: labelText,
                                    columnIndex,
                                    page: PaginationModule.getCurrentPage(),
                                    rowCount: RowManagerModule.getRowCount()
                                }
                            }));

                            if (addOperation instanceof Promise) {
                                addOperation.finally(() => {
                                    checkbox.disabled = false;
                                    item.classList.remove('processing', 'waiting');
                                    resolve();
                                });
                            } else {
                                setTimeout(() => {
                                    checkbox.disabled = false;
                                    item.classList.remove('processing', 'waiting');
                                    resolve();
                                }, 300);
                            }
                        }
                    });
                };

                // Add this operation to the queue
                dropdown._operationQueue.enqueue(performOperation);
            };

            // Add both handlers - CLICK handler in CAPTURE phase for maximum reliability
            checkboxList.addEventListener('click', checkboxList._clickHandler, true);
            checkboxList.addEventListener('change', checkboxList._changeHandler);

            // Add CSS for better visual feedback
            const styleId = 'checkbox-item-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
            .${checkboxItemClass} {
                cursor: pointer;
                position: relative;
            }
            .${checkboxItemClass}.waiting {
                background-color: rgba(0, 0, 0, 0.05);
            }
            .${checkboxItemClass}.processing {
                opacity: 0.7;
                background-color: rgba(0, 0, 0, 0.1);
            }
            .${checkboxItemClass} label {
                cursor: pointer;
            }
        `;
                document.head.appendChild(style);
            }

            // Clear operation queue when dropdown closes
            const clearHandler = () => {
                if (dropdown._operationQueue) {
                    dropdown._operationQueue.pendingOperations = [];
                    dropdown._operationQueue.isProcessing = false;

                    // Reset all visual states
                    const items = checkboxList.querySelectorAll(`.${checkboxItemClass}`);
                    items.forEach(item => {
                        item.classList.remove('processing', 'waiting');
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        if (checkbox) checkbox.disabled = false;
                    });
                }
            };

            dropdown.onClose = clearHandler;

            // Update existing document click handler
            document.addEventListener('click', (event) => {
                if (!checkboxList.contains(event.target) &&
                    !dropdown.elements.button.contains(event.target) &&
                    dropdown.isOpen) {
                    clearHandler();
                }
            });
        }

            

        setupSortDropdown(dropdown) {
            const { elements } = dropdown;
            const { staticInputButtons, content } = dropdown.elements;
            const staticInputClass = DropdownElementManager.getClassName('staticInput');

            this.setupCloseListener(dropdown);

            // Generate a unique identifier for this dropdown instance
            dropdown.id = `dropdown-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Track the currently active sort option
            dropdown.activeSortButton = null;
            dropdown.activeSortPlaceholder = null;
            dropdown.activeSortDirection = null;

            // Initialize SortIndicatorModule if needed
            if (!SortIndicatorElementManager.getInstance()) {
                SortIndicatorElementManager.initialize(document.body);
            }

            if (!SortIndicatorModule.getInstance()) {
                SortIndicatorModule.initialize();
            }

            // Function to clear the previous sort indicator
            const clearPreviousIndicator = () => {
                if (dropdown.activeSortPlaceholder) {
                    // Unregister from central module
                    SortIndicatorModule.unregisterContainer(dropdown.activeSortPlaceholder);

                    // Remove from DOM
                    if (dropdown.activeSortPlaceholder.parentNode) {
                        dropdown.activeSortPlaceholder.parentNode.removeChild(dropdown.activeSortPlaceholder);
                    }

                    dropdown.activeSortPlaceholder = null;
                    dropdown.activeSortButton = null;
                    dropdown.activeSortDirection = null;
                }
            };

            const syncWithActiveColumnSort = () => {
                // Clear previous indicator first
                clearPreviousIndicator();

                // Get the active indicator from SortIndicatorModule
                const activeIndicator = SortIndicatorModule.getInstance().syncDropdownWithActiveSort(dropdown.id);

                // If we found a matching active indicator, update the dropdown's state
                if (activeIndicator) {
                    // Find the button with matching column name
                    const matchingButton = Array.from(staticInputButtons).find(button =>
                        button.textContent.trim() === activeIndicator.columnName
                    );

                    if (matchingButton) {
                        // Update dropdown's tracking variables
                        dropdown.activeSortButton = matchingButton;
                        dropdown.activeSortPlaceholder = activeIndicator.container;
                        dropdown.activeSortDirection = activeIndicator.direction;

                        
                    }
                }
            };

            const originalToggle = dropdown.toggle;
            dropdown.toggle = function (force) {
                const wasOpen = this.isOpen;
                originalToggle.call(this, force);

                // If the dropdown was just opened, sync with active sort
                if (!wasOpen && this.isOpen) {
                    syncWithActiveColumnSort();
                }
            };

            // Use event delegation for handling clicks on sort options
            content.addEventListener('click', (event) => {
                const button = event.target.closest(`.${staticInputClass}`);
                const searchMode = TableDataModule.isSearchModeActive();
                const sortMode = TableDataModule.isSortModeActive();
                if (!button) return;

                // Check if this is the first button (header/close)
                if (button === staticInputButtons[0]) {
                    this.closeDropdown(dropdown);
                    return;
                }

                // Check if this is the second button (clear all indicators)
                if (button === staticInputButtons[1]) {
                    // Direct call to the global module for clearing all indicators
                    if (searchMode || !sortMode)  return;
                    SortIndicatorModule.clearAllSortIndicators();

                    // Also clear our local reference
                    clearPreviousIndicator();
                    return;
                }

                // Get the text for this sort option
                const sortOptionText = button.textContent.trim();

                // Get column index based on button position (skip header button)
                const buttonIndex = Array.from(staticInputButtons).indexOf(button) - 1;

                // Check if clicking the same button (toggle case)
                const isSameButton = (button === dropdown.activeSortButton);

                if (isSameButton) {
                    // Toggle direction for same button
                    const newDirection = dropdown.activeSortDirection === 'up' ? 'down' : 'up';
                    dropdown.activeSortDirection = newDirection;

                    // Apply new direction
                    SortIndicatorModule.handleSortIndicatorClick(dropdown.activeSortPlaceholder, newDirection);
                    return;
                }

                // This is a new button selection

                // Clear previous indicator (if any)
                clearPreviousIndicator();

                // Create a new placeholder for the sort indicator
                const placeholder = SortIndicatorElementManager.createSortPlaceholder();
                placeholder.className = 'sort-indicator-placeholder';

                // Add the placeholder to the button
                DOMUtils.batchUpdate(() => {
                    button.appendChild(placeholder);
                });

                // Track the currently active elements
                dropdown.activeSortButton = button;
                dropdown.activeSortPlaceholder = placeholder;
                dropdown.activeSortDirection = 'up'; // Default to 'up' for first selection

                // Register with SortIndicatorModule with enhanced metadata
                SortIndicatorModule.registerContainer(placeholder, buttonIndex, {
                    source: 'dropdown',
                    columnName: sortOptionText,
                    parentDropdownId: dropdown.id
                });

                // Apply initial direction
                SortIndicatorModule.handleSortIndicatorClick(placeholder, 'up');
            });

            document.addEventListener('sortIndicator:sort', (event) => {
                const { source, columnName, direction } = event.detail;
                // Only handle column-sourced sort events
                if (source !== 'column') return;
               
                // Clear previous indicator
                clearPreviousIndicator();

                

                // Find the button with the matching column name
                const matchingButton = Array.from(staticInputButtons).find(button =>
                    button.textContent.trim() === columnName
                );

                if (matchingButton) {
                  

                    // Create a new placeholder for the sort indicator
                    const placeholder = SortIndicatorElementManager.createSortPlaceholder();
                    placeholder.className = 'sort-indicator-placeholder';

                    // Add the placeholder to the button
                    DOMUtils.batchUpdate(() => {
                        matchingButton.appendChild(placeholder);
                    });

                    // Track the currently active elements
                    dropdown.activeSortButton = matchingButton;
                    dropdown.activeSortPlaceholder = placeholder;
                    dropdown.activeSortDirection = direction;

                    // Register with SortIndicatorModule
                    const indicatorInfo = SortIndicatorModule.registerContainer(placeholder,
                        Array.from(staticInputButtons).indexOf(matchingButton) - 1, {
                        source: 'dropdown',
                        columnName: columnName,
                        parentDropdownId: dropdown.id
                    });

                    // Apply the direction without triggering another sort event
                    SortIndicatorElementManager.setTriangleState(placeholder, direction, true);

                    // Update the indicator info
                    if (indicatorInfo) {
                        indicatorInfo.isActive = true;
                        indicatorInfo.direction = direction;
                    }

                   
                } 
            });
        }

        setupSearchDropdown(dropdown) {
            const { elements } = dropdown;
            const { staticInputButtons, content, searchBar } = elements;

            // Setup close listener
            this.setupCloseListener(dropdown);

            // Set initial selection
            if (staticInputButtons && staticInputButtons.length > 1) {
                // Select first option after header
                this.highlightSelectedItem(dropdown, staticInputButtons[1]);
                if (searchBar) SearchBarModule.updateSearchPlaceholder(searchBar, staticInputButtons[1].textContent);
            }

            // Set up handlers for search type selection
            const staticInputClass = DropdownElementManager.getClassName('staticInput');

            // Use event delegation
            content.addEventListener('click', (event) => {
                const button = event.target.closest(`.${staticInputClass}`);
                if (!button) return;

                // Skip the first button (header/close)
                if (button === staticInputButtons[0]) return;

                const text = button.textContent.trim();
                if (!text) return;

                // Highlight selected item
                this.highlightSelectedItem(dropdown, button);

                // Update search placeholder
                if (searchBar) SearchBarModule.updateSearchPlaceholder(searchBar, text);

                // Clear search if active
                if (SearchBarModule.getCurrentSearchTerm() !== '') {
                    SearchBarModule.clearSearch();
                }
            });
        }

        setupColumnTitleDropdown(dropdown) {
            const { SUPPORTED_COLUMNS } = this.constructor;
            this.setupCloseListener(dropdown);

            const columnID = dropdown.elements.button.id;
            const columnText = columnID;
            this.setButtonText(dropdown, columnText);

            // Track column changes with detail
            ColumnElementManager.getColumnInsertionPoint().addEventListener(
                'columnManager:columnsAdded',
                (event) => {
                    dropdown.lastColumnAdded = event.detail?.column || null;
                    dropdown.needsRefresh = true;
                }
            );

            // Open handler with optimized refresh
            dropdown.elements.button.addEventListener('click', () => {
                const { content, staticInputButtons } = dropdown.elements;

                // Get current columns and button text
                dropdown.availableColumns = ColumnElementManager.getColumnHeaders(true);
                const currentButtonText = dropdown.elements.button.querySelector('span').textContent;

                // Calculate options - show all SUPPORTED_COLUMNS except the current button text
                dropdown.staticInputOptions = SUPPORTED_COLUMNS.filter(column => column !== currentButtonText);

                content.innerHTML = '';

                // Add close button as first element
                const closeButton = DropdownElementManager.createCloseButton("Change To");
               
                content.appendChild(closeButton);

                // Add existing buttons and new options
                if (staticInputButtons) {
                    const filteredButtons = staticInputButtons.filter(btn =>
                        !btn.classList.contains(DropdownElementManager.getClassName('closeButton')) &&
                        !btn.classList.contains(DropdownElementManager.getClassName('titleElement'))
                    );
                    filteredButtons.forEach(btn => content.appendChild(btn));
                }

                const classNames = [
                    DropdownElementManager.getClassName('staticInput'),
                    DropdownElementManager.getClassName('dropdownItem'),
                ];

                dropdown.staticInputOptions.forEach(name => {
                    const option = document.createElement('div');
                    option.classList.add(...classNames);
                    option.textContent = name;
                    content.appendChild(option);
                });

                dropdown.needsRefresh = false;
            });

            const staticInputClass = DropdownElementManager.getClassName('staticInput');
            dropdown.elements.content.addEventListener('click', event => {
                const clickedElement = event.target.closest(`.${staticInputClass}`);
                if (clickedElement) {
                    // If close button was clicked, close dropdown without additional action
                    if (clickedElement.classList.contains(DropdownElementManager.getClassName('closeButton'))) {
                        this.closeDropdown(dropdown);
                        return;
                    }

                    const newTitle = clickedElement.textContent;
                    const currentButtonText = dropdown.elements.button.querySelector('span').textContent;
                    const currentColumns = ColumnElementManager.getColumnHeaders();

                    const currentColumnIndex = currentColumns.indexOf(currentButtonText);

                    // Check if the selected option is already displayed (case for column swap)
                    const existingColumnIndex = currentColumns.indexOf(newTitle);

                    if (existingColumnIndex !== -1) {
                        // CASE 1: Column Swap - the selected column is already displayed

                        // 1. Update the UI for this dropdown
                        this.setButtonText(dropdown, newTitle);
                        dropdown.elements.button.id = newTitle;

                        // 2. Find and update the other column's dropdown
                        const columns = ColumnElementManager.getAllColumns();
                        if (existingColumnIndex < columns.length) {
                            const otherColumn = columns[existingColumnIndex];
                            const dropdownContainer = otherColumn.querySelector(`.${DropdownElementManager.getClassName('dropdownContainer')}`);
                            if (dropdownContainer) {
                                const button = dropdownContainer.querySelector(`.${ColumnElementManager.getClassName('columnTitle')}`);
                                if (button) {
                                    const span = button.querySelector('span');
                                    if (span) {
                                        span.textContent = currentButtonText;
                                    }

                                    button.id = currentButtonText;
                                    button.title = currentButtonText;
                                }
                            }
                        }

                        // 3. Update the column stack-list reference
                        const updatedHeaders = [...currentColumns];
                        updatedHeaders[currentColumnIndex] = newTitle;
                        updatedHeaders[existingColumnIndex] = currentButtonText;

                        // Remove old titles and add new ones in correct order

                        ColumnElementManager.swapColumnTitles(currentButtonText, newTitle);

                        // 4. Skip TableDataModule and directly handle the swap
                        document.dispatchEvent(new CustomEvent('columnManager:columnSwapped', {
                            bubbles: true,
                            detail: {
                                column1: currentButtonText,
                                column2: newTitle,
                                index1: currentColumnIndex,
                                index2: existingColumnIndex
                            }
                        }));

                    } else {
                        // CASE 2: Adding a new column (use existing logic)

                        // Update the column title in the manager
                        ColumnElementManager.addColumnTitleAtIndex(currentButtonText, currentColumnIndex, newTitle);
                        this.setButtonText(dropdown, newTitle);
                        dropdown.elements.button.id = newTitle;
                        // Trigger data fetch for the newly selected column
                        const currentPage = TableDataModule.getCurrentPage() || 1;
                        const rowCount = RowManagerModule.getRowCount();

                        // Dispatch event to trigger column data fetch
                        document.dispatchEvent(new CustomEvent('columnManager:columnAdded', {
                            bubbles: true,
                            detail: {
                                column: newTitle,
                                columnIndex: currentColumnIndex,
                                page: currentPage,
                                rowCount: rowCount
                            }
                        }));

                        // Dispatch event for checkbox handler to check this column
                        document.dispatchEvent(new CustomEvent('columnTitle:changed', {
                            bubbles: true,
                            detail: {
                                oldTitle: currentButtonText,
                                newTitle: newTitle,
                                columnIndex: currentColumnIndex
                            }
                        }));
                    }
                    SortIndicatorModule.updateColumnIndicators(currentButtonText, newTitle);
                    this.closeDropdown(dropdown);
                }
            });
        }
    }

    // Public API
    return {
        initialize(containers) {
            try {
                if (!instance) {
                    instance = new DropdownManager();
                }
                instance.initializeDropdowns(containers);
                return this;
            } catch (error) {
                console.error('Error initializing dropdowns:', error);
                return null;
            }
        },
        getInstance: () => instance,
        getDropdownInstance: (container) => instance?.getDropdownInstance(container) || null,
        getInstancesByType: (type) => instance?.getInstancesByType(type) || [],
        getCustomRowCount: () => instance?.getCustomRowCount() || null,
        getSelectedRowCount: () => instance?.getSelectedRowCount() || 10,
        hasCustomRowCount: () => instance?.hasCustomRowCount() || false,
        closeAllDropdowns: () => instance?.closeAllDropdowns(),
        enableAllResults: (key) => instance?.enableAllResults(key),
        disableAllResults: () => instance?.disableAllResults(),
        setSelectedRowCount: (rowCount) => instance?.setSelectedRowCount(rowCount) || false,
        getLastSelectedRow: () => instance?.getLastSelectedRow()
    };
})();