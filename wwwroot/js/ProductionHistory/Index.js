document.addEventListener('DOMContentLoaded', async function () {
    const AreaContainer = document.querySelector('.data-table');
    const rowDropdownContainer = document.querySelectorAll('.dropdown-container')
    
    //fetch('/TableState/UpdateColumnTitles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
    const defaultColumnTitles = ["Profile Name", "File Path"];

    
    SearchElementManager.initialize(AreaContainer);
    RowElementManager.initialize(AreaContainer);
    ColumnElementManager.initialize(AreaContainer);
    TableElementManager.initialize(AreaContainer);
    DropdownElementManager.initialize(AreaContainer);
    PaginationElementManager.initialize(AreaContainer);
    SearchBarModule.initialize(AreaContainer);
    ColumnManagerModule.initialize();
    RowManagerModule.initialize();

    // Check if stored column titles exist
    try {
        const response = await fetch('/TableState/GetState');
        const state = await response.json();

        if (state && state.columnTitles && state.columnTitles.length > 0) {
            // Use stored titles
            console.log("Loading saved column titles:", state.columnTitles);
            ColumnManagerModule.addColumns(state.columnTitles.length, state.columnTitles);
        } else {
            // Use defaults
            console.log("First run - using default column titles");
            ColumnManagerModule.addColumns(defaultColumnTitles.length, defaultColumnTitles);

            // Save default titles
            fetch('/TableState/UpdateColumnTitles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultColumnTitles)
            });
        }
    } catch (error) {
        // API error - use defaults
        console.error("Error loading state:", error);
        ColumnManagerModule.addColumns(defaultColumnTitles.length, defaultColumnTitles);
    }
    DropdownContainerModule.initialize(rowDropdownContainer);
    DataApplierModule.initialize();
    RowManagerModule.setRowCountWithData(5, 1, ColumnManagerModule.getColumnHeaders());
    PaginationModule.initialize();

    // Save column titles when page is closed
    window.addEventListener('beforeunload', function () {
        const currentTitles = ColumnManagerModule.getColumnTitles();

        // Use synchronous request since in beforeunload
        navigator.sendBeacon('/TableState/UpdateColumnTitles',
            new Blob([JSON.stringify(currentTitles)], { type: 'application/json' }));
    });
  
   
});