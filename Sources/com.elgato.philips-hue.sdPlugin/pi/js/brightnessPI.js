//==============================================================================
/**
@file       brightnessPI.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function BrightnessPI(inContext, inLanguage) {
    // Init BrightnessPI
    var instance = this;

    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Before overwriting parrent method, save a copy of it
		var piLocalize = this.localize;

		// Localize the UI
		this.localize = function () {
				// Call PIs localize method
				piLocalize.call(instance);

        // Localize the brightess label
        document.getElementById("brightness-label").innerHTML = localization["Brightness"];
		};

    // Add brightness slider
    var brightnessSlider = "<div type='range' class='sdpi-item'> \
                                <div class='sdpi-item-label' id='brightness-label'></div> \
                                <div class='sdpi-item-value'> \
                                    <span>1</span> \
                                    <input type='range' id='brightness-input' min='1' max='100' value='" + settings.brightness + "'> \
                                    <span>100</span> \
                                </div> \
                           </div>";
    document.getElementById('placeholder').innerHTML = brightnessSlider;

    // Add event listener
    document.getElementById("brightness-input").addEventListener("change", brightnessChanged);

    // Brightness changed
    function brightnessChanged(inEvent) {
        // Save the new brightness settings
        settings.brightness = inEvent.target.value;
        instance.saveSettings();

        // Inform the plugin that a new brightess is set
        instance.sendToPlugin({ 'piEvent': 'valueChanged' });
    }
}
