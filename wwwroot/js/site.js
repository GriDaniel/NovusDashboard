function showMessage() {
    document.getElementById('demo').innerHTML = 'Hello, JavaScript is working!';
    console.log('Button clicked!');
}


function loadSection(section) {
    // Remove old section-specific CSS and JS
    $('link[data-view], script[data-view]').remove();

    // Load the section
    $.ajax({
        url: '/Dashboard/Get' + section, // Calls the controller action
        type: 'GET',
        success: function(data) {
            $('#dashboard-container').html(data); // Puts the section in the container
            loadViewResources(section); // Loads CSS and JS for this section
        },
        error: function() {
            $('#dashboard-container').html('<p>Error loading section.</p>');
        }
    });
}

function loadViewResources(section) {
    // Add CSS for this section
    var cssLink = $('<link>', {
        rel: 'stylesheet',
        href: '/css/Views/' + section + '/' + section.toLowerCase() + '.css',
        'data-view': section
    });
    $('head').append(cssLink);

    // Add JS for this section
    $.getScript('/js/Views/' + section + '/' + section.toLowerCase() + '.js')
        .done(function() {
            console.log(section + ' JS loaded');
            if (typeof window['init' + section] === 'function') {
                window['init' + section](); // Runs an init function if it exists
            }
        })
        .fail(function() {
            console.log('No JS for ' + section); // Okay if there’s no JS file
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
