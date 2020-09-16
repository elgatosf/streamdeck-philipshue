//==============================================================================
/**
@file       meethue.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a Philips Hue bridge
function Bridge(ip = null, id = null, username = null) {
    // Init Bridge
    var instance = this;

    // Public function to pair with a bridge
    this.pair = function(callback) {
        if (ip) {
            var url = 'http://' + ip + '/api';
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.open('POST', url, true);
            xhr.timeout = 2500;
            xhr.onload = function() {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    if (xhr.response !== undefined && xhr.response != null) {
                        var result = xhr.response[0];

                        if ('success' in result) {
                            username = result['success']['username'];
                            callback(true, result);
                        }
                        else {
                            var message = result['error']['description'];
                            callback(false, message);
                        }
                    }
                    else {
                        callback(false, 'Bridge response is undefined or null.');
                    }
                }
                else {
                    callback(false, 'Could not connect to the bridge.');
                }
            };

            xhr.onerror = function() {
                callback(false, 'Unable to connect to the bridge.');
            };

            xhr.ontimeout = function() {
                callback(false, 'Connection to the bridge timed out.');
            };

            var obj = {};
            obj.devicetype = 'stream_deck';
            var data = JSON.stringify(obj);
            xhr.send(data);
        }
        else {
            callback(false, 'No IP address given.');
        }
    };

    // Public function to retrieve the username
    this.getUsername = function() {
        return username;
    };

    // Public function to retrieve the IP address
    this.getIP = function() {
        return ip;
    };

    // Public function to retrieve the ID
    this.getID = function() {
        return id;
    };

    // Public function to retrieve the name
    this.getName = function(callback) {
        var url = 'http://' + ip + '/api/' + username + '/config';
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 5000;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                var result = xhr.response;

                if (result !== undefined && result != null) {
                    if ('name' in result) {
                        var name = result['name'];
                        callback(true, name);
                    }
                    else {
                        var message = result[0]['error']['description'];
                        callback(false, message);
                    }
                }
                else {
                    callback(false, 'Bridge response is undefined or null.');
                }
            }
            else {
                callback(false, 'Could not connect to the bridge.');
            }
        };

        xhr.onerror = function() {
            callback(false, 'Unable to connect to the bridge.');
        };

        xhr.ontimeout = function() {
            callback(false, 'Connection to the bridge timed out.');
        };

        xhr.send();
    };

    // Private function to retrieve objects
    function getMeetHues(type, callback) {
        var url;

        if (type === 'light') {
            url = 'http://' + ip + '/api/' + username + '/lights';
        }
        else if (type === 'group') {
            url = 'http://' + ip + '/api/' + username + '/groups';
        }
        else if (type === 'scene') {
            url = 'http://' + ip + '/api/' + username + '/scenes';
        }
        else {
            callback(false, 'Type does not exist.');
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('GET', url, true);
        xhr.timeout = 5000;
        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                var result = xhr.response;

                if (result !== undefined && result != null) {
                    if (!Array.isArray(result)) {
                        var objects = [];

                        Object.keys(result).forEach(function(key) {
                            value = result[key];

                            if (type === 'light') {
                                objects.push(new Light(instance, key, value.name, value.type, value.state.on, value.state.bri, value.state.xy, value.state.ct));
                            }
                            else if (type === 'group') {
                                objects.push(new Group(instance, key, value.name, value.type, value.state.all_on, value.action.bri, value.action.xy, value.action.ct));
                            }
                            else if (type === 'scene') {
                                objects.push(new Scene(instance, key, value.name, value.type, value.group));
                            }
                        });

                        callback(true, objects);
                    }
                    else {
                        var message = result[0]['error']['description'];
                        callback(false, message);
                    }
                }
                else {
                    callback(false, 'Bridge response is undefined or null.');
                }
            }
            else {
                callback(false, 'Unable to get objects of type ' + type + '.');
            }
        };

        xhr.onerror = function() {
            callback(false, 'Unable to connect to the bridge.');
        };

        xhr.ontimeout = function() {
            callback(false, 'Connection to the bridge timed out.');
        };

        xhr.send();
    }

    // Public function to retrieve the lights
    this.getLights = function(callback) {
        getMeetHues('light', callback);
    };

    // Public function to retrieve the groups
    this.getGroups = function(callback) {
        getMeetHues('group', callback);
    };

    // Public function to retrieve the scenes
    this.getScenes = function(callback) {
        getMeetHues('scene', callback);
    };
}

// Static function to discover bridges
Bridge.discover = function(callback) {
    var url = 'https://discovery.meethue.com';
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', url, true);
    xhr.timeout = 10000;

    xhr.onload = function() {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            if (xhr.response !== undefined && xhr.response != null) {
                var bridges = [];

                xhr.response.forEach(function(bridge) {
                    bridges.push(new Bridge(bridge.internalipaddress, bridge.id));
                });

                callback(true, bridges);
            }
            else {
                callback(false, 'Meethue server response is undefined or null.');
            }
        }
        else {
            callback(false, 'Unable to discover bridges.');
        }
    };

    xhr.onerror = function() {
        callback(false, 'Unable to connect to the internet.');
    };

    xhr.ontimeout = function() {
        callback(false, 'Connection to the internet timed out.');
    };

    xhr.send();
};

// Static function to convert hex to rgb
Bridge.hex2rgb = function(inHex) {
    // Remove hash if it exists
    if (inHex.charAt(0) === '#') {
        inHex = inHex.substr(1);
    }

    // Split hex into RGB components
    var rgbArray = inHex.match(/.{1,2}/g);

    // Convert RGB component into decimals
    var red = parseInt(rgbArray[0], 16);
    var green = parseInt(rgbArray[1], 16);
    var blue = parseInt(rgbArray[2], 16);

    return { 'r': red, 'g': green, 'b': blue };
}

// Static function to convert rgb to hex
Bridge.rgb2hex = function(inRGB) {
    return '#' + ((1 << 24) + (inRGB.r << 16) + (inRGB.g << 8) + inRGB.b).toString(16).slice(1);
}

// Static function to convert rgb to hsv
Bridge.rgb2hsv = function(inRGB) {
    // Calculate the brightness and saturation value
    var max = Math.max(inRGB.r, inRGB.g, inRGB.b);
    var min = Math.min(inRGB.r, inRGB.g, inRGB.b);
    var d = max - min;
    var s = (max === 0 ? 0 : d / max);
    var v = max / 255;

    // Calculate the hue value
    var h;

    switch (max) {
        case min:
            h = 0;
            break;
        case inRGB.r:
            h = (inRGB.g - inRGB.b) + d * (inRGB.g < inRGB.b ? 6: 0);
            h /= 6 * d;
            break;
        case inRGB.g:
            h = (inRGB.b - inRGB.r) + d * 2;
            h /= 6 * d;
            break;
        case inRGB.b:
            h = (inRGB.r - inRGB.g) + d * 4;
            h /= 6 * d;
            break;
    }

    return { 'h': h, 's': s, 'v': v };
}

// Static function to convert hsv to rgb
Bridge.hsv2rgb = function(inHSV) {
    var r = null;
    var g = null;
    var b = null;

    var i = Math.floor(inHSV.h * 6);
    var f = inHSV.h * 6 - i;
    var p = inHSV.v * (1 - inHSV.s);
    var q = inHSV.v * (1 - f * inHSV.s);
    var t = inHSV.v * (1 - (1 - f) * inHSV.s);

    // Calculate red, green and blue
    switch (i % 6) {
        case 0:
            r = inHSV.v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = inHSV.v;
            b = p;
            break;
        case 2:
            r = p;
            g = inHSV.v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = inHSV.v;
            break;
        case 4:
            r = t;
            g = p;
            b = inHSV.v;
            break;
        case 5:
            r = inHSV.v;
            g = p;
            b = q;
            break;
    }

    // Convert rgb values to int
    var red = Math.round(r * 255);
    var green = Math.round(g * 255);
    var blue = Math.round(b * 255);

    return { 'r': red, 'g': green, 'b': blue };
}

// Static function to convert hex to hsv
Bridge.hex2hsv = function(inHex) {
    // Convert hex to rgb
    var rgb = Bridge.hex2rgb(inHex);

    // Convert rgb to hsv
    return Bridge.rgb2hsv(rgb);
}

// Static function to convert hsv to hex
Bridge.hsv2hex = function(inHSV) {
    // Convert hsv to rgb
    var rgb = Bridge.hsv2rgb(inHSV);

    // Convert rgb to hex
    return Bridge.rgb2hex(rgb);
}

// Static function to convert hex to xy
Bridge.hex2xy = function(inHex) {
    // Convert hex to rgb
    var rgb = Bridge.hex2rgb(inHex);

    // Concert RGB components to floats
    red = rgb.r / 255;
    green = rgb.g / 255;
    blue = rgb.b / 255;

    // Convert RGB to XY
    var r = red > 0.04045 ? Math.pow(((red + 0.055) / 1.055), 2.4000000953674316) : red / 12.92;
    var g = green > 0.04045 ? Math.pow(((green + 0.055) / 1.055), 2.4000000953674316) : green / 12.92;
    var b = blue > 0.04045 ? Math.pow(((blue + 0.055) / 1.055), 2.4000000953674316) : blue / 12.92;
    var x = r * 0.664511 + g * 0.154324 + b * 0.162028;
    var y = r * 0.283881 + g * 0.668433 + b * 0.047685;
    var z = r * 8.8E-5 + g * 0.07231 + b * 0.986039;

    // Convert XYZ zo XY
    var xy = [x / (x + y + z), y / (x + y + z)];

    if (isNaN(xy[0])) {
      xy[0] = 0.0;
    }

    if (isNaN(xy[1])) {
      xy[1] = 0.0;
    }

    return xy;
};

// Prototype which represents a Philips Hue object
function MeetHue(bridge = null, id = null, name = null, type = null) {
    // Init MeetHue
    var instance = this;

    // Private variables
    var id = id;
    var name = name;
    var type = type;

    // Override in child prototype
    var url = null;

    // Public function to retrieve the type
    this.getType = function() {
        return type;
    };

    // Public function to retrieve the name
    this.getName = function() {
        return name;
    };

    // Public function to retrieve the ID
    this.getID = function() {
        return id;
    };

    // Public function to retrieve the URL
    this.getURL = function() {
        return url;
    };

    // Public function to set the URL
    this.setURL = function(inURL) {
        url = inURL;
    }

    // Public function to set light state
    this.setState = function(state, callback) {
        // Check if the URL was set
        if (instance.getURL() == null) {
            callback(false, 'URL is not set.');
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('PUT', instance.getURL(), true);
        xhr.timeout = 2500;

        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                if (xhr.response !== undefined && xhr.response != null) {
                    var result = xhr.response[0];

                    if ('success' in result) {
                        username = result['success']['username'];
                        callback(true, result);
                    }
                    else {
                        var message = result['error']['description'];
                        callback(false, message);
                    }
                }
                else {
                    callback(false, 'Bridge response is undefined or null.');
                }
            }
            else {
                callback(false, 'Could not set state.');
            }
        };
        xhr.onerror = function() {
            callback(false, 'Unable to connect to the bridge.');
        };
        xhr.ontimeout = function() {
            callback(false, 'Connection to the bridge timed out.');
        };
        var data = JSON.stringify(state);
        xhr.send(data);
    };
}

// Prototype which represents a scene
function Scene(bridge = null, id = null, name = null, type = null, group = null) {
    // Init Scene
    var instance = this;

    // Inherit from MeetHue
    MeetHue.call(this, bridge, id, name, type);

    // Set the URL
    this.setURL('http://' + bridge.getIP() + '/api/' + bridge.getUsername() + '/groups/' + 0 + '/action');

    // Public function to retrieve the group
    this.getGroup = function() {
        return group;
    };

    // Public function to set the scene
    this.on = function(callback) {
        // Define state object
        var state = {};
        state.scene = id;

        // Send new state
        instance.setState(state, callback);
    };
}

// Prototype which represents an illumination
function Illumination(bridge = null, id = null, name = null, type = null, power = null, brightness = null, xy = null, temperature = null) {
    // Init Illumination
    var instance = this;

    // Inherit from MeetHue
    MeetHue.call(this, bridge, id, name, type);

    // Private variables
    var power = power;
    var brightness = brightness;
    var xy = xy;
    var temperature = temperature;

    // Public function to retrieve the power state
    this.getPower = function() {
        return power;
    };

    // Public function to retrieve the brightness
    this.getBrightness = function() {
        return brightness;
    };

    // Public function to retrieve xy
    this.getXY = function() {
        return xy;
    };

    // Public function to retrieve the temperature
    this.getTemperature = function() {
        return temperature;
    };

    // Public function to set the power status of the light
    this.setPower = function(power, callback) {
        // Define state object
        var state = {};
        state.on = power;

        // Send new state
        instance.setState(state, callback);
    };

    // Public function to set the brightness
    this.setBrightness = function(brightness, callback) {
        // Define state object
        var state = {};
        state.bri = brightness;

        // To modify the brightness, the light needs to be on
        state.on = true;

        // Send new state
        instance.setState(state, callback);
    };

    // Public function set the xy value
    this.setXY = function(xy, callback) {
        // Define state object
        var state = {};
        state.xy = xy;

        // To modify the color, the light needs to be on
        state.on = true;

        // Send new state
        instance.setState(state, callback);
    };

    // Public function set the temperatue value
    this.setTemperature = function(temperature, callback) {
        // Define state object
        var state = {};
        state.ct = temperature;

        // To modify the temperature, the light needs to be on
        state.on = true;

        // Send new state
        instance.setState(state, callback);
    };
}

// Prototype which represents a light
function Light(bridge = null, id = null, name = null, type = null, power = null, brightness = null, xy = null, temperature = null) {
    // Inherit from Illumination
    Illumination.call(this, bridge, id, name, type, power, brightness, xy, temperature);

    // Set the URL
    this.setURL('http://' + bridge.getIP() + '/api/' + bridge.getUsername() + '/lights/' + id + '/state');
}

// Prototype which represents a group
function Group(bridge = null, id = null, name = null, type = null, power = null, brightness = null, xy = null, temperature = null) {
    // Inherit from Illumination
    Illumination.call(this, bridge, id, name, type, power, brightness, xy, temperature);

    // Set the URL
    this.setURL('http://' + bridge.getIP() + '/api/' + bridge.getUsername() + '/groups/' + id + '/action');
}
