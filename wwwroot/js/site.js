function showMessage() {
    document.getElementById('demo').innerHTML = 'Hello, JavaScript is working!';
    console.log('Button clicked!');
}


function loadSection(section) {
    $('#dashboard-container').html('<div>Loading...</div>');

    $.ajax({
        url: '/' + section + '/Index',
        type: 'GET',
        success: function(data) {
            $('#dashboard-container').html(data);
            window.location.hash = section;
            initializeSection(section);
        },
        error: function() {
            $('#dashboard-container').html('<div>Error loading section.</div>');
        }
    });
}

function initializeSection(section) {
    switch (section) {
        case 'Overview':
            console.log('Overview loaded');
            initializeChart();
            break;
        case 'ProductionHistory':
            console.log('Production History loaded');
            break;
    }
}

function initializeChart() {
    console.log('Chart initialized');
    // Add chart initialization logic for #chart-placeholder
}


//USE SCRIPT

<script>
    $(document).ready(function() {
        var section = window.location.hash.substring(1);
        if (section && section !== 'Overview') {
            loadSection(section);
        } else {
            window.location.hash = 'Overview';
            initializeSection('Overview');
        }
    });
</script>
