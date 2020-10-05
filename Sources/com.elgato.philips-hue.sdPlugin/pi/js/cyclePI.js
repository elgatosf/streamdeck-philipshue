//==============================================================================
/**
@file       cyclePI.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function CyclePI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
    // Init CyclePI
    var instance = this;

    // Maximum amount of Colors
    var maxColors = 10;

    // Current amount of Colors
    var curColors = settings.colors.length;

    // Default color for new pickers
    var defaultColor = "#ffffff";

    // Default temperature for new pickers
    var defaultTemperature = 2000;

    // Inherit from PI
    PI.call(this, inContext, inLanguage, inStreamDeckVersion, inPluginVersion);

    // Add event listener
    document.getElementById("light-select").addEventListener("change", lightChanged);

    // Color changed
    function colorChanged(inEvent) {
        // Get the selected index and color
        var index = inEvent.target.dataset.id;
        var color = inEvent.target.value;

        // If the color is hex
        if (color.charAt(0) === '#') {
            // Convert the color to HSV
            var hsv = Bridge.hex2hsv(color);

            // Check if the color is valid
            if (hsv.v !== 1) {
                // Remove brightness component
                hsv.v = 1;

                // Set the color to the corrected color
                color = Bridge.hsv2hex(hsv);
            }
        }

        // Save the new color
        settings.colors[index] = color;
        instance.saveSettings();

        // Inform the plugin that a new color is set
        instance.sendToPlugin({ 'piEvent': 'valueChanged' });
    }

    // Light changed
    function lightChanged() {
        // Get the light value manually
        // Because it is not set if this function was triggered via a CustomEvent
        var lightID = document.getElementById("light-select").value;

        // Don't show any color picker if no light or group is set
        if (lightID === "no-lights" || lightID === "no-groups") {
            return;
        }

        // Check if any bridge is configured
        if (!('bridge' in settings)) {
            return;
        }

        // Check if the configured bridge is in the cache
        if (!(settings.bridge in cache)) {
            return;
        }

        // Find the configured bridge
        var bridgeCache = cache[settings.bridge];

        // Check if the selected light or group is in the cache
        if (!(lightID in bridgeCache.lights || lightID in bridgeCache.groups)) {
            return;
        }

        // Get light or group cache
        if (lightID.indexOf('l') !== -1) {
            var lightCache = bridgeCache.lights[lightID];
        }
        else {
            var lightCache = bridgeCache.groups[lightID];
        }

        // Get html of color picker or temperature slider
        var getColorPicker = function(i) {
            var colorIndex = i - 1;

            if (lightCache.xy != null) {
                if (i === 0) {
                    return "<div type='color' class='sdpi-item' id='color-input-container'> \
                                <div class='sdpi-item-label' class='color-label'>" + instance.localization["Colors"]  + "</div> \
                                <div class='sdpi-item-value'></div> \
                            </div>";
                }
                else {
                    return "<span id='color-input-container-" + colorIndex + "'><input type='color' class='sdpi-item-value' id='color-input-" + colorIndex + "' name='color-input' data-id='" + colorIndex + "' value='" + (settings.colors[colorIndex] || defaultColor) + "'></span>";
                }
            }
            else if(i > 0) {
                return "<div type='range' class='sdpi-item' id='color-input-container-" + colorIndex + "'> \
                            <div class='sdpi-item-label' id='temperature-label'>" + instance.localization["Temperature"] + " " + i + "</div> \
                            <div class='sdpi-item-value'> \
                                <input class='temperature floating-tooltip' data-suffix='K' type='range' id='color-input-" + colorIndex + "' name='color-input' data-id='" + colorIndex + "' min='2000' max='6500' value='" + (settings.colors[colorIndex] || defaultTemperature) + "'> \
                            </div> \
                        </div>";
            }

            return "";
        };

        // Add a new color picker to document
        var addColorPicker = function(i) {
            var picker = document.createElement("div");
            picker.innerHTML = getColorPicker(i);

            if (lightCache.xy != null) {
                document.querySelector("#color-input-container .sdpi-item-value").append(picker.firstChild);
            }
            else {
                placeholder.insertBefore(picker.firstChild, document.getElementById("cycle-buttons"));
            }

            document.getElementById("color-input-" + (i - 1)).addEventListener("change", colorChanged);
        };

        // Add first color pickers container and buttons
        var placeholder = document.getElementById('placeholder');
        var buttons = "<div id='cycle-buttons' class='sdpi-item'> \
                            <div class='sdpi-item-label empty'></div> \
                            <div class='sdpi-item-value'> \
                                <button id='add-color'>+</button>\
                                <button id='remove-color'>-</button>\
                            </div> \
                        </div>";
        placeholder.innerHTML = getColorPicker(0) + buttons;

        // Initial create color pickers from settings
        for (var n = 1; n <= settings.colors.length; n++) {
            addColorPicker(n);
        }

        // Get buttons for later usage
        var addButton = document.getElementById('add-color');
        var removeButton = document.getElementById('remove-color');
        var checkButtonStates = function() {
            // Hide add button when reached max color pickers
            addButton.style.display = curColors >= maxColors ? "none" : "inline-block";

            // Hide remove button when only two color pickers left
            removeButton.style.display = curColors <= 2 ? "none" : "inline-block";
        };

        // Event listener for add color
        addButton.addEventListener("click", function() {
            addColorPicker((++curColors));

            // Add new picker value to settings
            var colorIndex = curColors - 1;

            if (!settings.colors[colorIndex]) {
                if (lightCache.xy != null) {
                    settings.colors[colorIndex] = defaultColor;
                }
                else {
                    settings.colors[colorIndex] = defaultTemperature;
                }

                instance.saveSettings();
            }

            checkButtonStates();
        });

        // Event listener for remove last color
        removeButton.addEventListener("click", function() {
            document.getElementById("color-input-container-" + (--curColors)).remove();

            // Remove color from settings
            settings.colors = settings.colors.splice(0, settings.colors.length - 1);
            instance.saveSettings();

            checkButtonStates();
        });

        // Initial button states
        checkButtonStates();

        // Initialize the tooltips
        initToolTips();
    }
}
