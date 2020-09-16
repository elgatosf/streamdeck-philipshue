//==============================================================================
/**
@file       brightnessAction.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a brightness action
function BrightnessAction(inContext, inSettings) {
    // Init BrightnessAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Set the default values
    setDefaults();

    // Public function called on key up event
    this.onKeyUp = function(inContext, inSettings, inCoordinates, inUserDesiredState, inState) {
        // If onKeyUp was triggered manually, load settings
        if (inSettings === undefined) {
            inSettings = instance.getSettings();
        }

        // Check if any bridge is configured
        if (!('bridge' in inSettings)) {
            log('No bridge configured');
            showAlert(inContext);
            return;
        }

        // Check if the configured bridge is in the cache
        if (!(inSettings.bridge in cache.data)) {
            log('Bridge ' + inSettings.bridge + ' not found in cache');
            showAlert(inContext);
            return;
        }

        // Find the configured bridge
        var bridgeCache = cache.data[inSettings.bridge];

        // Check if any light is configured
        if (!('light' in inSettings)) {
            log('No light or group configured');
            showAlert(inContext);
            return;
        }

        // Check if the configured light or group is in the cache
        if (!(inSettings.light in bridgeCache.lights || inSettings.light in bridgeCache.groups)) {
            log('Light or group ' + inSettings.light + ' not found in cache');
            showAlert(inContext);
            return;
        }

        // Check if any color is configured
        if (!('brightness' in inSettings)) {
            log('No brightness configured');
            showAlert(inContext);
            return;
        }

        // Create a bridge instance
        var bridge = new Bridge(bridgeCache.ip, bridgeCache.id, bridgeCache.username);

        // Create a light or group object
        var objCache, obj;
        if (inSettings.light.indexOf('l') !== -1) {
            objCache = bridgeCache.lights[inSettings.light];
            obj = new Light(bridge, objCache.id);
        }
        else {
            objCache = bridgeCache.groups[inSettings.light];
            obj = new Group(bridge, objCache.id);
        }

        // Convert brightness
        var brightness = Math.round(inSettings.brightness * 2.54);

        // Set light or group state
        obj.setBrightness(brightness, function(inSuccess, inError) {
            if (inSuccess) {
                objCache.brightness = brightness;
            }
            else {
                log(inError);
                showAlert(inContext);
            }
        });
    };

    // Before overwriting parent method, save a copy of it
    var actionNewCacheAvailable = this.newCacheAvailable;

    // Public function called when new cache is available
    this.newCacheAvailable = function(inCallback) {
        // Call actions newCacheAvailable method
        actionNewCacheAvailable.call(instance, function() {
            // Set defaults
            setDefaults();

            // Call the callback function
            inCallback();
        });
    };

    // Private function to set the defaults
    function setDefaults() {
        // Get the settings and the context
        var settings = instance.getSettings();
        var context = instance.getContext();

        // If brightness is already set for this action
        if ('brightness' in settings) {
            return;
        }

        // Set the brightness to 100
        settings.brightness = 100;

        // Save the settings
        saveSettings('com.elgato.philips-hue.brightness', context, settings);
    }
}
