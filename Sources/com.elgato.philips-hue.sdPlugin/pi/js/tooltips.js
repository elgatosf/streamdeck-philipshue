//==============================================================================
/**
@file       brightnessPI.js
@brief      Philips Hue Plugin
@copyright  (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function rangeToPercent(value, min, max) {
    return ((value - min) / (max - min));
}

function initToolTips() {
    const tooltip = document.querySelector('.sdpi-info-label');
    const arrElements = document.querySelectorAll('.floating-tooltip');

    arrElements.forEach((e,i) => {
        initToolTip(e, tooltip)
    })
}

function initToolTip(element, tooltip) {
    const tw = tooltip.getBoundingClientRect().width;
    const suffix = element.getAttribute('data-suffix') || '';

    const fn = function() {
        const elementRect = element.getBoundingClientRect();
        const w = elementRect.width - tw / 2;
        const percnt = rangeToPercent(
            element.value,
            element.min,
            element.max,
        );

        tooltip.textContent = suffix !== '' ? `${element.value} ${suffix}` : String(element.value);
        tooltip.style.left = `${elementRect.left + Math.round(w * percnt) - tw / 4}px`;
        tooltip.style.top = `${elementRect.top - 32}px`;
    };

    if (element) {
        element.addEventListener('mouseenter', function() {
            tooltip.classList.remove('hidden');
            tooltip.classList.add('shown');
            fn();
        }, false);

        element.addEventListener('mouseout', function() {
            tooltip.classList.remove('shown');
            tooltip.classList.add('hidden');
            fn();
        }, false);
        element.addEventListener('input', fn, false);
    }
}
