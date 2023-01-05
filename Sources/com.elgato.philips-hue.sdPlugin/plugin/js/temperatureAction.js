/**
@file      temperatureAction.js
@brief     Philips Hue Plugin
@copyright (c) 2019, Corsair Memory, Inc.
@license   This source code is licensed under the MIT-style license found in the LICENSE file.
*/

/**
 * Color temperature range of Philips lights is: 2200K to 6500K ==  455 to 154 Mired.   //154 is the coolest, 500 is the warmest
 */
const percentOfRange = (value, min = 0, max = 100) => {
  return parseInt((max - min) * (value / 100) + min + 1);
};

function TemperatureAction(inContext, inSettings, jsn) {
  this.property = 'temperature';
  const setStateFunction = `set${Utils.capitalize(this.property)}`;
  // Inherit from PropertyAction
  PropertyAction.call(this, inContext, inSettings, jsn);

  // setValue is sent from the 'keyUp' event and
  // contains the value of the slider (0-100)
  this.setValue = (inValue, jsn) => {
    const target = this.getCurrentLightOrGroup();
    if(target === false) return;
    if(target.objCache.power === false) return;
    const ct = target.objCache?.originalValue?.capabilities?.control?.ct;
    if(!ct) return;
    let value = inValue ? percentOfRange(inValue, ct.min, ct.max) : target.objCache[this.property];
    if(jsn?.payload?.ticks) {
      const settings = this.getSettings();
      const scaleTicks = settings?.scaleTicks || 1;
      const multiplier = scaleTicks * jsn.payload.ticks;
      let addThis = (ct.max - ct.min) * (multiplier / 100);
      addThis = addThis > 0 ? Math.floor(addThis) : Math.ceil(addThis);
      value = Utils.minmax(parseInt(value + addThis), ct.min, ct.max);
    }

    target.obj[setStateFunction](value, (inSuccess, inError) => {
      if(inSuccess) {
        target.objCache[this.property] = value;
        this.updateDisplay(target.objCache, this.property, jsn);
        this.updateAllActions();
      } else {
        log(inError);
        showAlert(inContext);
      }
    });
  };
}
