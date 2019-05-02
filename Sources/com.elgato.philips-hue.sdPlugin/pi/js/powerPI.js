//==============================================================================
/**
@file       powerPI.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function PowerPI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
    // Init powerPI
    var instance = this;

    // Inherit from PI
    PI.call(this, inContext, inLanguage, inStreamDeckVersion, inPluginVersion);
}
