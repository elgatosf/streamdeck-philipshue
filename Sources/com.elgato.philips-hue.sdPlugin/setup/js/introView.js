//==============================================================================
/**
@file       introView.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Load the intro view
function loadIntroView() {
    // Set the status bar
    setStatusBar('intro');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Intro']['Title'];

    // Fill the content area
    var content = "<p>" + localization['Intro']['Description'] + "</p> \
                   <img class='image' src='images/bridge.png'> \
                   <div class='button' id='start'>" + localization['Intro']['Start'] + "</div> \
                   <div class='button-transparent' id='close'>" + localization['Intro']['Close'] + "</div>";
    document.getElementById('content').innerHTML = content;

    // Add event listener
    document.getElementById('start').addEventListener('click', startPairing);
    document.addEventListener('enterPressed', startPairing);

    document.getElementById('close').addEventListener('click', close);
    document.addEventListener('escPressed', close);

    // Load the pairing view
    function startPairing() {
        unloadIntroView();
        loadDiscoveryView();
    }

    // Close the window
    function close() {
        window.close();
    }

    // Unload view
    function unloadIntroView() {
        // Remove event listener
        document.removeEventListener('enterPressed', startPairing);
        document.removeEventListener('escPressed', close);
    }
}
