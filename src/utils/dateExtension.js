/**
 * Create a JS Date object from an epoch time value (in seconds).
 * @param {number} epochSec 
 * @returns {Date}
 */
const fromEpochSec = function(epochSec) {
    return new Date(epochSec * 1000);
}

/**
 * Retrieve the epoch time (in seconds) for a JS Date object.
 * Milliseconds are rounded.
 * @returns {number}
 */
const toEpochSec = function() {
    return Math.round(this.valueOf() / 1000);
}

/**
 * Retrieve the date component/substring of an ISO string.
 * @returns {string} "YYYY-MM-DD"
 */
const toISODateOnly = function() {
    return this.toISOString().split('T')[0];
}

/**
 * Retrieve the date & time component/substring of an ISO string.
 * @returns {string} "YYYY-MM-DD HH:MM:SS"
 */
const toDateTimeStr = function() {
    return this.toISOString().split('.')[0].replace('T', ' ');
}

/**
 * Add a number of `days` to a JS Date object.
 * @param {number} days positive to go forward, negative to go backwards
 * @returns {Date} the calling JS Date object.
 */
const addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
}

/**
 * Add a number of `hours` to a JS Date object.
 * @param {number} hours positive to go forward, negative to go backwards
 * @returns {Date} the calling JS Date object.
 */
const addHours = function(hours) {
    this.setHours(this.getHours() + hours);
    return this;
}

/**
 * Add a number of `minutes` to a JS Date object.
 * @param {number} minutes positive to go forward, negative to go backwards
 * @returns {Date} the calling JS Date object.
 */
const addMinutes = function(minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
}

/**
 * Round a JS Date object to the nearest seconds.
 * @returns {Date} the calling JS Date object.
 */
const roundOutMs = function() {
    this.setTime(Math.round(this.getTime() / 1000) * 1000);
    return this;
}

/**
 * Add the extension functions to the JS Date class.
 */
export function setDateExtensions() {
    Date.fromEpochSec            = fromEpochSec;
    Date.prototype.toEpochSec    = toEpochSec;
    Date.prototype.toISODateOnly = toISODateOnly;
    Date.prototype.toDateTimeStr = toDateTimeStr;
    Date.prototype.addDays       = addDays;
    Date.prototype.addHours      = addHours;
    Date.prototype.addMinutes    = addMinutes;
    Date.prototype.roundOutMs    = roundOutMs;
}
