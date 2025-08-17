import { logger } from './logger.js';

export const noSemiColon = (value) => value.indexOf(';') === -1;

export const isOnlyDigits = (value) => /^[0-9]+$/.test(value);

export const isAlphabetical = (value) => typeof value === "string"
    && /^[a-zA-Z ]*$/.test(value);

export const isAlphanumerical = (value) => typeof value === "string"
    && /^[a-zA-Z0-9 ]*$/.test(value);

export const isAlphabeticalArray = (value) => Array.isArray(value)
    && value.map(v => isAlphabetical(v))
            .reduce((a, b) => a && b, true);

export const isAlphanumericalArray = (value) => Array.isArray(value)
    && value.map(v => isAlphanumerical(v))
            .reduce((a, b) => a && b, true);

export const isPositiveNumber = (value) => Math.sign(value) === 1;

export const isEmail = (value) => typeof value === "string"
    && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);

export const isValidPassword = (value) => typeof value === "string"
    && /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9]).{8,128}$/.test(value);

// TODO: Look into proper date checking (e.g. 2000-02-31 is accepted)
export const isDate = (value) => Date.parse(`${value}T00:00:00Z`) !== NaN &&
    /^\d{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])$/.test(value);

export const isTime = (value) => Date.parse(`1970-01-01T${value}Z`) !== NaN &&
    /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(value);

export const isDateTime = (value) => value.split(' ').length === 2
    && isDate(value.split(' ')[0])
    && isTime(value.split(' ')[1]);

const checkFns = [
    noSemiColon,
    isOnlyDigits,
    isAlphabetical,
    isAlphanumerical,
    isAlphabeticalArray,
    isAlphanumericalArray,
    isPositiveNumber,
    isEmail,
    isValidPassword,
    isDate,
    isTime,
    isDateTime
];

export const Check = Object.freeze({
    NO_SEMICOLON:           checkFns.indexOf(noSemiColon),
    IS_ONLY_DIGITS:         checkFns.indexOf(isOnlyDigits),
    IS_ALPHABETICAL:        checkFns.indexOf(isAlphabetical),
    IS_ALPHANUMERICAL:      checkFns.indexOf(isAlphanumerical),
    IS_ALPHABETICAL_ARR:    checkFns.indexOf(isAlphabeticalArray),
    IS_ALPHANUMERICAL_ARR:  checkFns.indexOf(isAlphanumericalArray),
    IS_POSITIVE_NUMBER:     checkFns.indexOf(isPositiveNumber),
    IS_EMAIL:               checkFns.indexOf(isEmail),
    IS_VALID_PASSWORD:      checkFns.indexOf(isValidPassword),
    IS_DATE:                checkFns.indexOf(isDate),
    IS_TIME:                checkFns.indexOf(isTime),
    IS_DATETIME:            checkFns.indexOf(isDateTime)
});

export const verify = (value, checks) => {
    return value !== undefined
        && value !== null
        && checks.map(check => checkFns[check](value)).reduce((a, b) => a && b, true);
};

export const checkerInitValid = () => {
    const fnsCopy = [...checkFns];
    const indexCopy = [...Object.values(Check)];

    fnsCopy.sort();
    indexCopy.sort();

    if (fnsCopy.length !== indexCopy.length) {
        logger.fatal("Checker function array & function index array are of unequal lengths");
        return false;
    } 

    let fnsDuplicates = 0;
    let indexDuplicates = 0;
    for (let i = 1; i < fnsCopy.length; i++) {
        if (fnsCopy[i-1] === fnsCopy[i]) {
            fnsDuplicates++;
        }
        if (indexCopy[i-1] === indexCopy[i]) {
            indexDuplicates++;
        }
    }

    if (fnsDuplicates > 0 || indexDuplicates > 0) {
        logger.fatal("checker functions and/or duplicates contain duplicates.");
        logger.fatal(`checkFns: ${fnsDuplicates}. Check: ${indexDuplicates}`);
        return false;
    }
    logger.info("checkerInitValid passed");
    return true;
}
