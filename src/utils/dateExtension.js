const fromEpochSec = function(epochSec) {
    return new Date(epochSec * 1000);
}

const toEpochSec = function() {
    return Math.round(this.valueOf() / 1000);
}

const toISODateOnly = function() {
    return this.toISOString().split('T')[0];
}

const toDateTimeStr = function() {
    return this.toISOString().split('.')[0].replace('T', ' ');
}

const addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
}

const addHours = function(hours) {
    this.setHours(this.getHours() + hours);
    return this;
}

const addMinutes = function(minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
}

const roundOutMs = function() {
    this.setTime(Math.round(this.getTime() / 1000) * 1000);
    return this;
}

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
