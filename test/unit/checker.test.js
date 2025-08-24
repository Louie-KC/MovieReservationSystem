import {
    checkerInitValid,
    verify,
    Check,
    noSemiColon,
    isInteger,
    isAlphabetical,
    isAlphanumerical,
    isIntegerArray,
    isAlphabeticalArray,
    isAlphanumericalArray,
    isPositiveNumber,
    isEmail,
    isValidPassword,
    isDate,
    isTime,
    isDateTime
} from '../../src/utils/checker.js'

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
    expect(isInteger("")).toBe(false);
    expect(isInteger("0")).toBe(true);
    expect(isInteger("9")).toBe(true);
    expect(isInteger(" 9")).toBe(false);
    expect(isInteger("1234")).toBe(true);
    expect(isInteger("1234a")).toBe(false);
    expect(isInteger("123 4")).toBe(false);
    expect(isInteger("1234.0")).toBe(false);
    expect(isInteger("12.345")).toBe(false);
    expect(isInteger("12HK345")).toBe(false);
    expect(isInteger("01234567890123456789")).toBe(true);
    expect(isInteger("0123!")).toBe(false);
    expect(isInteger("0123;")).toBe(false);
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

test('Ensure numerical (digits only) array', () => {
    expect(isIntegerArray(1)).toBe(false);
    expect(isIntegerArray([])).toBe(true);
    expect(isIntegerArray([""])).toBe(false);
    expect(isIntegerArray([1])).toBe(true);
    expect(isIntegerArray(["1"])).toBe(true);
    expect(isIntegerArray([" 1"])).toBe(false);
    expect(isIntegerArray(["1", 2, 3])).toBe(true);
    expect(isIntegerArray(["1", 2, "3 "])).toBe(false);
    expect(isIntegerArray(["1", "a", 3])).toBe(false);
    expect(isIntegerArray(["1", ";", 3])).toBe(false);
})

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

test('Ensure valid email address format', () => {
    expect(isEmail("")).toBe(false);
    expect(isEmail("Abcdef7")).toBe(false);
    expect(isEmail("@")).toBe(false);
    expect(isEmail("a@.com")).toBe(false);
    expect(isEmail("@a.com")).toBe(false);
    expect(isEmail("a@a.com")).toBe(true);
    expect(isEmail("abc@def.com")).toBe(true);
    expect(isEmail("a.b.cd@efg.com")).toBe(true);
    expect(isEmail("abcd@efg.com.au")).toBe(true);
    expect(isEmail("ab-c-d@efg.com")).toBe(true);
    expect(isEmail("ABCD@EFG.com")).toBe(true);    
    expect(isEmail("ABCabcABCabcABCaaa@DEFDEF.com")).toBe(true);    
    expect(isEmail("real.e-mail.1@domain-name.co.uk")).toBe(true);
})

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

test('Ensure date format YYYY-MM-DD', () => {
    expect(isDate("")).toBe(false);
    expect(isDate("2025-07-15")).toBe(true);
    expect(isDate("2025-7-15")).toBe(false);
    expect(isDate("25-07-15")).toBe(false);
    expect(isDate("2025/07/15")).toBe(false);
    expect(isDate("2022-10-01")).toBe(true);
    expect(isDate("3000-01-01")).toBe(true);
    expect(isDate("1000-01-01")).toBe(true);
    expect(isDate(";1000-01-01")).toBe(false);
});

// TODO: Look into proper date checking (e.g. 2000-02-30 is accepted)
test('Ensure not clearly invalid date (01 <= MM <= 12, 01 <= DD <= 31)', () => {
    expect(isDate("2026-01-01")).toBe(true);
    expect(isDate("2026-01-31")).toBe(true);
    expect(isDate("2025-01-01")).toBe(true);
    expect(isDate("2025-00-01")).toBe(false);
    expect(isDate("2027-02-28")).toBe(true);
    // expect(isDate("2027-02-29")).toBe(false);  // not a leap year. See TODO
    expect(isDate("2028-02-29")).toBe(true);
    expect(isDate("2025-12-31")).toBe(true);
    expect(isDate("2025-13-01")).toBe(false);
    expect(isDate("2025-25-12")).toBe(false);
    expect(isDate("2025-01-32")).toBe(false);
    expect(isDate("2025-01-55")).toBe(false);
});

test('Ensure valid time and in format HH:MM:SS', () => {
    expect(isTime("")).toBe(false);
    expect(isTime("00:00:00")).toBe(true);
    expect(isTime("12:34:45")).toBe(true);
    expect(isTime("12-34-45")).toBe(false);
    expect(isTime("123445")).toBe(false);
    expect(isTime("12 34 45")).toBe(false);
    expect(isTime("12:34")).toBe(false);
    expect(isTime("12::45")).toBe(false);
    expect(isTime("12::45")).toBe(false);
    expect(isTime("01:02:03")).toBe(true);
    expect(isTime("1:02:03")).toBe(false);
    expect(isTime("001:02:03")).toBe(false);
    expect(isTime("23:59:59")).toBe(true);
    expect(isTime("23:59:60")).toBe(false);
    expect(isTime("23:60:00")).toBe(false);
    expect(isTime("25:11:11")).toBe(false);
});

test('Ensure valid datetime format YYYY-MM-DD HH:MM:SS', () => {
    expect(isDateTime("")).toBe(false);
    expect(isDateTime("00:00:00")).toBe(false);
    expect(isDateTime("2025-08-02")).toBe(false);
    expect(isDateTime("2025-08-02 00:00:00")).toBe(true);
    expect(isDateTime("25-08-02 00:00:00")).toBe(false);
    expect(isDateTime("2025-08-02 25:00:00")).toBe(false);
})

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
    expect(verify("123", [Check.IS_POSITIVE_NUMBER, Check.IS_INTEGER])).toBe(true);
    expect(verify("123", [Check.IS_POSITIVE_NUMBER, Check.IS_INTEGER, Check.IS_ALPHABETICAL])).toBe(false);
});
