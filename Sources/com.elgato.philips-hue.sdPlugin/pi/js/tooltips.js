/**
@file      tooltips.js
@brief     Philips Hue Plugin
@copyright (c) 2019, Corsair Memory, Inc.
@license   This source code is licensed under the MIT-style license found in the LICENSE file.
*/

function rangeToPercent(value, min, max) {
    return (value - min) / (max - min);
}

function initToolTips() {
    let tooltip = document.querySelector('.sdpi-info-label');
    let arrElements = document.querySelectorAll('.floating-tooltip');

    arrElements.forEach(e => {
        initToolTip(e, tooltip)
    });
}

function initToolTip(element, tooltip) {
    let tw = tooltip.getBoundingClientRect().width;
    let suffix = element.getAttribute('data-suffix') || '';

    let updateTooltip = () => {
        let elementRect = element.getBoundingClientRect();
        let w = elementRect.width - tw / 2;
        let percent = rangeToPercent(element.value, element.min, element.max);

        tooltip.textContent = suffix !== '' ? `${element.value} ${suffix}` : String(element.value);
        tooltip.style.left = `${elementRect.left + Math.round(w * percent) - tw / 4}px`;
        tooltip.style.top = `${elementRect.top - 32}px`;
    };

    if (element) {
        element.addEventListener('mouseenter', () => {
            tooltip.classList.remove('hidden');
            tooltip.classList.add('shown');
            updateTooltip();
        }, false);

        element.addEventListener('mouseout', () => {
            tooltip.classList.remove('shown');
            tooltip.classList.add('hidden');
            updateTooltip();
        }, false);

        element.addEventListener('input', updateTooltip, false);
    }
}
