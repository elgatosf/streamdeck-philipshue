//==============================================================================
/**
@file       powerAction.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a power action
function PowerAction(inContext, inSettings) {
    // Init PowerAction
    var instance = this;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    // Update the state
    updateState();

    // Public function called on key up event
    this.onKeyUp = function(inContext, inSettings, inCoordinates, inUserDesiredState, inState) {
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

        // Create a bridge instance
        var bridge = new Bridge(bridgeCache.ip, bridgeCache.id, bridgeCache.username);

        // Create a light or group object
        var objCache, obj;
        if (inSettings.light.indexOf('l-') !== -1) {
            objCache = bridgeCache.lights[inSettings.light];
            obj = new Light(bridge, objCache.id);
        }
        else {
            objCache = bridgeCache.groups[inSettings.light];
            obj = new Group(bridge, objCache.id);
        }

        // Check for multi action
        var targetState;
        if (inUserDesiredState !== undefined) {
            targetState = !inUserDesiredState;
        }
        else {
            targetState = !objCache.power;
        }

        // Set light or group state
        obj.setPower(targetState, function(success, error) {
            if (success) {
                setActionState(inContext, targetState ? 0 : 1);
                objCache.power = targetState;
            }
            else {
                log(error);
                setActionState(inContext, inState);
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
            // Update the state
            updateState();

            // Call the callback function
            inCallback();
        });
    };

    function updateState() {
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

        // Find out if it is a light or a group
        var objCache;
        if (settings.light.indexOf('l-') !== -1) {
            objCache = bridgeCache.lights[settings.light];
        }
        else {
            objCache = bridgeCache.groups[settings.light];
        }

        // Set the target state
        var targetState = objCache.power;

        // Set the new action state
        setActionState(context, targetState ? 0 : 1);
    }

    // Private function to set the state
    function setActionState(inContext, inState) {
        setState(inContext, inState);
    }
}
