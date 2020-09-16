//==============================================================================
/**
@file       cache.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Protoype for a data cache
function Cache() {
    // Init Cache
    var instance = this;

    // Refresh time of the cache  in seconds
    var autoRefreshTime = 60;

    // Private timer instance
    var timer = null;

    // Private bridge discovery
    var discovery = null;

    // Public variable containing the cached data
    this.data = {};

    // Public function to start polling
    this.startPolling = function() {
        // Log to the global log file
        log('Start polling to create cache');

        // Start a timer
        instance.refresh();
        timer = setInterval(instance.refresh, autoRefreshTime * 1000);
    }

    // Public function to stop polling
    this.stopPolling = function() {
        // Log to the global log file
        log('Stop polling to create cache');

        // Invalidate the timer
        clearInterval(timer);
        timer = null;
    }

    // Private function to discover all bridges on the network
    function buildDiscovery(inCallback) {
        // Check if discovery ran already
        if (discovery != null) {
            inCallback(true);
            return;
        }

        // Init discovery variable to indicate that it ran already
        discovery = {};

        // Run discovery
        Bridge.discover(function(inSuccess, inBridges) {
            // If the discovery was not successful
            if (!inSuccess) {
                log(inBridges);
                inCallback(false);
                return;
            }

            // For all discovered bridges
            inBridges.forEach(function(inBridge) {
                // Add new bridge to discovery object
                discovery[inBridge.getID()] = { 'ip': inBridge.getIP()};
            });

            inCallback(true);
        });
    }

    // Private function to build a cache
    this.refresh = function() {
        // Build discovery if necessary
        buildDiscovery(function(inSuccess) {
            // If discovery was not successful
            if (!inSuccess) {
                return;
            }

            // If no bridge is paired
            if (globalSettings.bridges === undefined) {
                return;
            }

            // Iterate through all bridges that were discovered
            Object.keys(discovery).forEach(function(inBridgeID) {
                // If the discovered bridge is not paired
                if (!(inBridgeID in globalSettings.bridges)) {
                    return;
                }

                // Create a bridge instance
                var bridge = new Bridge(discovery[inBridgeID].ip, inBridgeID, globalSettings.bridges[inBridgeID].username);

                // Create bridge cache
                var bridgeCache = { 'lights': {}, 'groups': {} };
                bridgeCache.id = bridge.getID();
                bridgeCache.ip = bridge.getIP();
                bridgeCache.username = bridge.getUsername();

                // Load the bridge name
                bridge.getName(function(inSuccess, inName) {
                    // If getName was not successful
                    if (!inSuccess) {
                        log(inName);
                        return;
                    }

                    // Save the name
                    bridgeCache.name = inName;

                    // Add bridge to the cache
                    instance.data[bridge.getID()] = bridgeCache;

                    // Request all lights of the bridge
                    bridge.getLights(function(inSuccess, inLights) {
                        // If getLights was not successful
                        if (!inSuccess) {
                            log(inLights);
                            return;
                        }

                        // Create cache for each light
                        inLights.forEach(function(inLight) {
                            // Create light cache
                            var lightCache = {};
                            lightCache.id = inLight.getID();
                            lightCache.name = inLight.getName();
                            lightCache.type = inLight.getType();
                            lightCache.power = inLight.getPower();
                            lightCache.brightness = inLight.getBrightness();
                            lightCache.xy = inLight.getXY();
                            lightCache.temperature = inLight.getTemperature();

                            // Add light to cache
                            instance.data[bridge.getID()].lights['l-' + inLight.getID()] = lightCache;
                        });

                        // Request all groups of the bridge
                        bridge.getGroups(function(inSuccess, inGroups) {
                            // If getGroups was not successful
                            if (!inSuccess) {
                                log(inGroups);
                                return;
                            }

                            // Create cache for each group
                            inGroups.forEach(function(inGroup) {
                                // Create group cache
                                var groupCache = {};
                                groupCache.id = inGroup.getID();
                                groupCache.name = inGroup.getName();
                                groupCache.type = inGroup.getType();
                                groupCache.power = inGroup.getPower();
                                groupCache.brightness = inGroup.getBrightness();
                                groupCache.xy = inGroup.getXY();
                                groupCache.temperature = inGroup.getTemperature();
                                groupCache.scenes = {};

                                // Add group to cache
                                instance.data[bridge.getID()].groups['g-' + inGroup.getID()] = groupCache;

                                // If this is the last group
                                if (Object.keys(instance.data[bridge.getID()].groups).length === inGroups.length) {
                                    // Request all scenes of the bridge
                                    bridge.getScenes(function(inSuccess, inScenes) {
                                        // If getScenes was not successful
                                        if (!inSuccess) {
                                        	log(inScenes);
                                        	return;
                                        }

                                        // Create cache for each scene
                                        inScenes.forEach(function(inScene) {
                                            // Check if this is a group scene
                                            if (inScene.getType() !== 'GroupScene') {
                                                return;
                                            }

                                            // Create scene cache
                                            var sceneCache = {};
                                            sceneCache.id = inScene.getID();
                                            sceneCache.name = inScene.getName();
                                            sceneCache.type = inScene.getType();
                                            sceneCache.group = inScene.getGroup();

                                            // If scenes group is in cache
                                            if ('g-' + inScene.getGroup() in instance.data[bridge.getID()].groups) {
                                                // Add scene to cache
                                                instance.data[bridge.getID()].groups['g-' + inScene.getGroup()].scenes[inScene.getID()] = sceneCache;
                                            }
                                        });

                                        // Inform keys that updated cache is available
                                        var event = new CustomEvent('newCacheAvailable');
                                        document.dispatchEvent(event);
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    };
}
