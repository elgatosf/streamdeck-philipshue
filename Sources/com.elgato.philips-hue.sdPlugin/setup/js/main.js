//==============================================================================
/**
@file       main.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Global variable containting the localizations
var localization = null;

// Global variable containting the discovered bridges
var bridges = [];

// Global variable containting the paired bridge
var bridge = null;

// Global function to set the status bar to the correct view
function setStatusBar(view) {
    // Remove active status from all status cells
    var statusCells = document.getElementsByClassName('status-cell');
    Array.from(statusCells).forEach(function(cell) {
        cell.classList.remove('active');
    });

    // Set it only to the current one
    document.getElementById('status-' + view).classList.add('active');
}

// Main function run after the page is fully loaded
window.onload = function() {
    // Bind enter and ESC keys
    document.addEventListener('keydown', function(e) {
        var key = e.which || e.keyCode;
        if (key === 13) {
            var event = new CustomEvent('enterPressed');
            document.dispatchEvent(event);
        }
        else if (key === 27) {
            var event = new CustomEvent('escPressed');
            document.dispatchEvent(event);
        }
    });

    // Get the url parameter
    var url = new URL(window.location.href);
    var language = url.searchParams.get('language');

    // Load the localizations
    getLocalization(language, function(inStatus, inLocalization) {
        if (inStatus) {
            // Save the localizations globally
            localization = inLocalization['Setup'];

            // Show the intro view
            loadIntroView();
        }
        else {
            document.getElementById('content').innerHTML = '<p>' + inLocalization + '</p>';
        }
    });
};
