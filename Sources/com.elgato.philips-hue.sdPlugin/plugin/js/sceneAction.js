//==============================================================================
/**
@file       sceneAction.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a scene action
function SceneAction(inContext, inSettings) {
    // Init SceneAction
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
            log('No group configured');
            showAlert(inContext);
            return;
        }

        // Check if the light was set to a group
        if (!(inSettings.light.indexOf('g-') !== -1)) {
            log('A light is set, not a group');
            showAlert(inContext);
            return;
        }

        // Check if the configured group is in the cache
        if (!(inSettings.light in bridgeCache.groups)) {
            log('Group ' + inSettings.light + ' not found in cache');
            showAlert(inContext);
            return;
        }

        // Find the configured group
        var groupCache = bridgeCache.groups[inSettings.light];

        // Check if any scene is configured
        if (!('scene' in inSettings)) {
            log('No scene configured');
            showAlert(inContext);
            return;
        }

        // Check if the configured scene is in the group cache
        if (!(inSettings.scene in groupCache.scenes)) {
            log('Scene ' + inSettings.scene + ' not found in cache');
            showAlert(inContext);
            return;
        }

        // Find the configured scene
        var sceneCache = groupCache.scenes[inSettings.scene];

        // Create a bridge instance
        var bridge = new Bridge(bridgeCache.ip, bridgeCache.id, bridgeCache.username);

        // Create a scene instance
        var scene = new Scene(bridge, sceneCache.id);

        // Set scene
        scene.on(function(inSuccess, inError) {
            // Check if setting the scene was successful
            if (!(inSuccess)) {
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

        // Check if the light was set to a group
        if (!(settings.light.indexOf('g-') !== -1)) {
            return;
        }

        // Check if the configured group is in the cache
        if (!(settings.light in bridgeCache.groups)) {
            return;
        }

        // Find the configured group
        var groupCache = bridgeCache.groups[settings.light];

        // Check if a scene was configured for this action
        if ('scene' in settings) {
            // Check if the scene is part of the set group
            if (settings.scene in groupCache.scenes) {
                return;
            }
        }

        // Check if the group has at least one scene
        if (!(Object.keys(groupCache.scenes).length > 0)) {
            return;
        }

        // Sort the scenes alphabetically
        var sceneIDsSorted = Object.keys(groupCache.scenes).sort(function(a, b) {
            return groupCache.scenes[a].name.localeCompare(groupCache.scenes[b].name);
        });

        // Set the action automatically to the first one
        settings.scene = sceneIDsSorted[0];

        // Save the settings
        saveSettings('com.elgato.philips-hue.scene', context, settings);
    }
}
