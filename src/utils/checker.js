
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

export const isValidPassword = (value) => typeof value === "string"
    && /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9]).{8,128}$/.test(value);

const checkFns = [
    noSemiColon,
    isOnlyDigits,
    isAlphabetical,
    isAlphanumerical,
    isAlphabeticalArray,
    isAlphanumericalArray,
    isPositiveNumber,
    isValidPassword
];

export const Check = Object.freeze({
    NO_SEMICOLON:           checkFns.indexOf(noSemiColon),
    IS_ONLY_DIGITS:         checkFns.indexOf(isOnlyDigits),
    IS_ALPHABETICAL:        checkFns.indexOf(isAlphabetical),
    IS_ALPHANUMERICAL:      checkFns.indexOf(isAlphanumerical),
    IS_ALPHABETICAL_ARR:    checkFns.indexOf(isAlphabeticalArray),
    IS_ALPHANUMERICAL_ARR:  checkFns.indexOf(isAlphanumericalArray),
    IS_POSITIVE_NUMBER:     checkFns.indexOf(isPositiveNumber),
    IS_VALID_PASSWORD:      checkFns.indexOf(isValidPassword)
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
        console.log("Checker function array & function index array are of unequal lengths");
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
        console.log("checker functions and/or duplicates contain duplicates.");
        console.log(`checkFns: ${fnsDuplicates}. Check: ${indexDuplicates}`);
        return false;
    }
    console.log("checkerInitValid passed");
    return true;
}
