//==============================================================================
/**
@file       utils.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Register the plugin or PI
function registerPluginOrPI(inEvent, inUUID) {
    if (websocket) {
        var json = {
            'event': inEvent,
            'uuid': inUUID
        };

        websocket.send(JSON.stringify(json));
	}
}

// Save settings
function saveSettings(inAction, inUUID, inSettings) {
    if (websocket) {
        const json = {
            'action': inAction,
            'event': 'setSettings',
            'context': inUUID,
            'payload': inSettings
         };

         websocket.send(JSON.stringify(json));
    }
}

// Save global settings
function saveGlobalSettings(inUUID) {
    if (websocket) {
        const json = {
            'event': 'setGlobalSettings',
            'context': inUUID,
            'payload': globalSettings
         };

         websocket.send(JSON.stringify(json));
    }
}

// Request global settings for the plugin
function requestGlobalSettings(inUUID) {
    if (websocket) {
        var json = {
            'event': 'getGlobalSettings',
            'context': inUUID
        };

        websocket.send(JSON.stringify(json));
    }
}

// Log to the global log file
function log(inMessage) {
    // Log to the developer console
    var time = new Date();
    var timeString = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
    console.log(timeString, inMessage);

    // Log to the Stream Deck log file
    if (websocket) {
        var json = {
            'event': 'logMessage',
            'payload': {
                'message': inMessage
            }
        };

        websocket.send(JSON.stringify(json));
    }
}

// Show alert icon on the key
function showAlert(inUUID) {
    if (websocket) {
        var json = {
            'event': 'showAlert',
            'context': inUUID
        };

        websocket.send(JSON.stringify(json));
    }
}

// Set the state of a key
function setState(inContext, inState) {
    if (websocket) {
        var json = {
            'event': 'setState',
            'context': inContext,
            'payload': {
                'state': inState
            }
        };

        websocket.send(JSON.stringify(json));
    }
}

// Set data to PI
function sendToPropertyInspector(inAction, inContext, inData) {
    if (websocket) {
        var json = {
            'action': inAction,
            'event': 'sendToPropertyInspector',
            'context': inContext,
            'payload': inData
        };

        websocket.send(JSON.stringify(json));
    }
}

// Set data to plugin
function sendToPlugin(inAction, inContext, inData) {
    if (websocket) {
        var json = {
            'action': inAction,
            'event': 'sendToPlugin',
            'context': inContext,
            'payload': inData
        };

        websocket.send(JSON.stringify(json));
    }
}

// Load the localizations
function getLocalization(inLanguage, inCallback) {
    var url = '../' + inLanguage + '.json';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            try {
                data = JSON.parse(xhr.responseText);
                var localization = data['Localization'];
                inCallback(true, localization);
            }
            catch(e) {
                inCallback(false, 'Localizations is not a valid json.');
            }
        }
        else {
            inCallback(false, 'Could not load the localizations.');
        }
    };

    xhr.onerror = function() {
        inCallback(false, 'An error occurred while loading the localizations.');
    };

    xhr.ontimeout = function() {
        inCallback(false, 'Localization timed out.');
    };

    xhr.send();
}
