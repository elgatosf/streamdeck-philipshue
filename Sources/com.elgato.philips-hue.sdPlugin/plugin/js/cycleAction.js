//==============================================================================
/**
@file       cycleAction.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a color action
function CycleAction(inContext, inSettings) {
    // Init CycleAction
    var instance = this;

    // Index of current active Color
    var currentColor = -1;

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
        if (!('colors' in inSettings)) {
            log('No colors configured');
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

        // Reset current Color index
        if (currentColor + 1 >= inSettings.colors.length) {
        	currentColor = -1;
        }

        var colorIndex = currentColor + 1;

        // Check if this is a color or temperature light
        if (inSettings.colors[colorIndex].indexOf('#') !== -1) {
            // Convert light color to hardware independent XY color
            var xy = Bridge.hex2xy(inSettings.colors[colorIndex]);

            // Set light or group state
            obj.setXY(xy, function(inSuccess, inError) {
                if (inSuccess) {
                    objCache.xy = xy;
                    ++currentColor;
                }
                else {
                    log(inError);
                    showAlert(inContext);
                }
            });
        }
        else {
            // ***** Note *****
            // Some lights do not support the full range
            // **********
            var min = 153.0;
            var max = 500.0;

            var minK = 2000.0;
            var maxK = 6500.0;

            // Convert light color
            var percentage = (inSettings.colors[colorIndex] - minK) / (maxK - minK);
            var invertedPercentage = -1 * (percentage - 1.0);
            var temperature = Math.round(invertedPercentage * (max - min) + min);

            // Set light or group state
            obj.setTemperature(temperature, function(inSuccess, inError) {
                if (inSuccess) {
                    objCache.ct = temperature;
                    ++currentColor;
                }
                else {
                    log(inError);
                    showAlert(inContext);
                }
            });
        }
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

        // Check if any bridge is configured
        if (!('bridge' in settings)) {
            return;
        }

        // Check if the configured bridge is in the cache
        if (!(settings.bridge in cache.data)) {
            return;
        }

        // Find the configured bridge
        var bridgeCache = cache.data[settings.bridge];

        // Check if a light was set for this action
        if (!('light' in settings)) {
            return;
        }

        // Check if the configured light or group is in the cache
        if (!(settings.light in bridgeCache.lights || settings.light in bridgeCache.groups)) {
            return;
        }

        // Get a light or group cache
        var lightCache;
        if (settings.light.indexOf('l-') !== -1) {
            lightCache = bridgeCache.lights[settings.light];
        }
        else {
            lightCache = bridgeCache.groups[settings.light];
        }

        // Check if any color is configured
        if ('colors' in settings) {
            // Check if the set color is supported by the light
            if (settings.colors[0].charAt(0) === '#' && lightCache.xy != null) {
                return;
            }
            else if (settings.colors[0].charAt(0) !== '#' && lightCache.xy == null) {
                return;
            }
        }

        // Check if the light supports all colors
        if (lightCache.xy != null) {
            // Set white as the default color
            settings.colors = ['#ff0000', '#00ff00', '#0000ff'];
        }
        else {
            // Set white as the default temperature
            settings.colors = ['2230', '4250', '6410'];
        }

        // Save the settings
        saveSettings('com.elgato.philips-hue.cycle', context, settings);
    }
}
