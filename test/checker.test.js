import {
    checkerInitValid,
    verify,
    Check,
    noSemiColon,
    isOnlyDigits,
    isAlphabetical,
    isAlphanumerical,
    isAlphabeticalArray,
    isAlphanumericalArray,
    isPositiveNumber,
    isValidPassword
} from '../src/utils/checker.js'

test('Checker util is correctly configured', () => {
    expect(checkerInitValid()).toBe(true);
});

test('Ensure no semicolons', () => {
    expect(noSemiColon("")).toBe(true);
    expect(noSemiColon(";")).toBe(false);
    expect(noSemiColon("a")).toBe(true);
    expect(noSemiColon("abcd58#@$0")).toBe(true);
    expect(noSemiColon(";acjd")).toBe(false);
    expect(noSemiColon("ac;j54 d")).toBe(false);
    expect(noSemiColon("acj54 d;")).toBe(false);
    expect(noSemiColon(";acj;54 d;")).toBe(false);
    expect(noSemiColon(" acj 54 d")).toBe(true);
    expect(noSemiColon(";; ; ;;")).toBe(false);
});

test('Ensure only digits', () => {
    expect(isOnlyDigits("")).toBe(false);
    expect(isOnlyDigits("0")).toBe(true);
    expect(isOnlyDigits("9")).toBe(true);
    expect(isOnlyDigits(" 9")).toBe(false);
    expect(isOnlyDigits("1234")).toBe(true);
    expect(isOnlyDigits("1234a")).toBe(false);
    expect(isOnlyDigits("123 4")).toBe(false);
    expect(isOnlyDigits("1234.0")).toBe(false);
    expect(isOnlyDigits("12.345")).toBe(false);
    expect(isOnlyDigits("12HK345")).toBe(false);
    expect(isOnlyDigits("01234567890123456789")).toBe(true);
    expect(isOnlyDigits("0123!")).toBe(false);
    expect(isOnlyDigits("0123;")).toBe(false);
});

test('Ensure alphabetical (no digits or symbols). Spaces allowed', () => {
    expect(isAlphabetical("")).toBe(true);
    expect(isAlphabetical("a")).toBe(true);
    expect(isAlphabetical("A")).toBe(true);
    expect(isAlphabetical("az")).toBe(true);
    expect(isAlphabetical("aZ")).toBe(true);
    expect(isAlphabetical("a z")).toBe(true);
    expect(isAlphabetical("a_z")).toBe(false);
    expect(isAlphabetical("a-z")).toBe(false);
    expect(isAlphabetical("qwerty")).toBe(true);
    expect(isAlphabetical("qwerty123asdfg")).toBe(false);
    expect(isAlphabetical("qwerty   asdfg")).toBe(true);
});

test('Ensure alphanumerical (no symbols). Spaces allowed', () => {
    expect(isAlphanumerical("")).toBe(true);
    expect(isAlphanumerical("a")).toBe(true);
    expect(isAlphanumerical("A")).toBe(true);
    expect(isAlphanumerical("1")).toBe(true);
    expect(isAlphanumerical("90")).toBe(true);
    expect(isAlphanumerical("az")).toBe(true);
    expect(isAlphanumerical("a z")).toBe(true);
    expect(isAlphanumerical("a_z")).toBe(false);
    expect(isAlphanumerical("a-z")).toBe(false);
    expect(isAlphanumerical("qwerty6574")).toBe(true);
    expect(isAlphanumerical("567 qwerty123asdfg")).toBe(true);
    expect(isAlphanumerical("567 qwerty ; asdfg")).toBe(false);
});

test('Ensure alphabetical (no digits or symbols) array. Spaces allowed', () => {
    expect(isAlphabeticalArray([])).toBe(true);
    expect(isAlphabeticalArray([""])).toBe(true);
    expect(isAlphabeticalArray(["", ""])).toBe(true);
    expect(isAlphabeticalArray(["", "", "", ""])).toBe(true);
    expect(isAlphabeticalArray(["a"])).toBe(true);
    expect(isAlphabeticalArray(["2"])).toBe(false);
    expect(isAlphabeticalArray(["ab", "CD", "ef", "GH"])).toBe(true);
    expect(isAlphabeticalArray([" b", "C ", "ef", "GH"])).toBe(true);
    expect(isAlphabeticalArray([" b", "C ", "ef", "G%"])).toBe(false);
    expect(isAlphabeticalArray(["ab", "CD", "91", "GH"])).toBe(false);
    expect(isAlphabeticalArray([" b", "CD", "91", "GH"])).toBe(false);
});

test('Ensure alphanumerical (no symbols) array. Spaces allowed', () => {
    expect(isAlphanumericalArray([])).toBe(true);
    expect(isAlphanumericalArray([""])).toBe(true);
    expect(isAlphanumericalArray(["", ""])).toBe(true);
    expect(isAlphanumericalArray(["a"])).toBe(true);
    expect(isAlphanumericalArray(["2"])).toBe(true);
    expect(isAlphanumericalArray(["5", "b"])).toBe(true);
    expect(isAlphanumericalArray([" b", "C ", "ef", "GH"])).toBe(true);
    expect(isAlphanumericalArray(["ab", "CD", "91", "GH"])).toBe(true);
    expect(isAlphanumericalArray(["23", "45", "67", "8;9"])).toBe(false);
    expect(isAlphanumericalArray([";23", "45", "67", "89"])).toBe(false);
});

test('Ensure positive numbers', () => {
    expect(isPositiveNumber("")).toBe(false);
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber("1")).toBe(true);
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber("0")).toBe(false);
    expect(isPositiveNumber(0.01)).toBe(true);
    expect(isPositiveNumber("0.01")).toBe(true);
    expect(isPositiveNumber(10.01)).toBe(true);
    expect(isPositiveNumber("10.01")).toBe(true);
    expect(isPositiveNumber(-0.01)).toBe(false);
    expect(isPositiveNumber("-0.01")).toBe(false);
    expect(isPositiveNumber("-55")).toBe(false);
});

test('Ensure password 8 <= len <= 128 w/ 1 lower, 1 upper, and 1 digit', () => {
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword("Abcdef7")).toBe(false);
    expect(isValidPassword("Abcdef78")).toBe(true);
    expect(isValidPassword("abcdef78")).toBe(false);
    expect(isValidPassword("abcdefgh")).toBe(false);
    expect(isValidPassword("AbcdefGH")).toBe(false);
    expect(isValidPassword("12345678ABCD")).toBe(false);
    expect(isValidPassword("12345678aBCD")).toBe(true);
    expect(isValidPassword("!@#$%^&*")).toBe(false);
    expect(isValidPassword("1234abCD")).toBe(true);
    expect(isValidPassword("1234#abCD")).toBe(true);
    expect(isValidPassword("1!2@3#4$a%b&C*D(")).toBe(true);
});

test('verify ensure not null or undefined', () => {
    expect(verify(null, [])).toBe(false);
    expect(verify(undefined, [])).toBe(false);
});

test('verify one condition', () => {
    expect(verify("abcd", [Check.NO_SEMICOLON])).toBe(true);
    expect(verify("ABcd123", [Check.NO_SEMICOLON])).toBe(true);
    expect(verify("1234", [Check.IS_ALPHABETICAL])).toBe(false);
    expect(verify("2345", [Check.IS_ALPHANUMERICAL])).toBe(true);
    expect(verify("aaa;SELECT", [Check.NO_SEMICOLON])).toBe(false);
});

test('verify multiple conditions', () => {
    expect(verify("aB 43", [Check.IS_ALPHANUMERICAL, Check.NO_SEMICOLON])).toBe(true);
    expect(verify("aaa777", [Check.IS_ALPHABETICAL, Check.IS_ALPHANUMERICAL])).toBe(false);
    expect(verify("123", [Check.IS_POSITIVE_NUMBER, Check.IS_ONLY_DIGITS])).toBe(true);
    expect(verify("123", [Check.IS_POSITIVE_NUMBER, Check.IS_ONLY_DIGITS, Check.IS_ALPHABETICAL])).toBe(false);
});
