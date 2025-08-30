import { setDateExtensions } from '../../src/utils/dateExtension.js'

beforeAll(() => {
    // Ensure names haven't been taken since written (2025-08-16)
    if (Date.fromEpochSec !== undefined) {
        throw "Date.fromEpochSec is already defined";
    }
    if (Date.prototype.toEpochSec !== undefined) {
        throw "Date.prototype.toEpochSec is already defined";
    }
    if (Date.prototype.toISODateOnly !== undefined) {
        throw "Date.prototype.toISODateOnly is already defined";
    }
    if (Date.prototype.toDateTimeStr !== undefined) {
        throw "Date.prototype.toDateTimeStr is already defined";
    }
    if (Date.prototype.addDays !== undefined) {
        throw "Date.prototype.addDays is already defined";
    }
    if (Date.prototype.addHours !== undefined) {
        throw "Date.prototype.addHours is already defined";
    }
    if (Date.prototype.addMinutes !== undefined) {
        throw "Date.prototype.addMinutes is already defined";
    }
    if (Date.prototype.roundOutMs !== undefined) {
        throw "Date.prototype.roundOutMs is already defined";
    }

    setDateExtensions();
});

test('fromEpochSec', () => {
    const date = Date.fromEpochSec(1755302400);
    expect(date.toISOString()).toBe("2025-08-16T00:00:00.000Z");
});

test('toEpochSec', () => {
    const date = new Date("2025-08-16T00:00:00.000Z");
    expect(date.toEpochSec()).toBe(1755302400);
});

test('toISODateOnly', () => {
    const writeDate = new Date("2025-08-16T00:00:00.000Z");
    expect(writeDate.toISODateOnly()).toBe("2025-08-16");

    const epochStart = new Date("1970-01-01T00:00:00.000Z");
    expect(epochStart.toISODateOnly()).toBe("1970-01-01");

    const now = new Date();
    const nowDateOnly = now.toISODateOnly();
    expect(now.toISOString().startsWith(nowDateOnly)).toBe(true);
});

test('toDateTimeStr', () => {
    const date1 = new Date("2025-08-30T00:00:00.000Z");
    expect(date1.toDateTimeStr()).toBe("2025-08-30 00:00:00");

    const date2 = new Date("1970-01-01T12:00:00.000Z");
    expect(date2.toDateTimeStr()).toBe("1970-01-01 12:00:00");
})

test('addDays', () => {
    const noChange = new Date("2025-08-16T00:00:00.000Z");
    noChange.addDays(0);
    expect(noChange.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const addOneDay = new Date("2025-08-16T00:00:00.000Z");
    addOneDay.addDays(1);
    expect(addOneDay.toISOString()).toBe("2025-08-17T00:00:00.000Z");

    const toNextMonth = new Date("2025-08-16T00:00:00.000Z");
    toNextMonth.addDays(31);
    expect(toNextMonth.toISOString()).toBe("2025-09-16T00:00:00.000Z");

    const toNextYear = new Date("2025-08-16T00:00:00.000Z");
    toNextYear.addDays(365);
    expect(toNextYear.toISOString()).toBe("2026-08-16T00:00:00.000Z");

    const backOneDay = new Date("2025-08-16T00:00:00.000Z");
    backOneDay.addDays(-1);
    expect(backOneDay.toISOString()).toBe("2025-08-15T00:00:00.000Z");
});

test('addHours', () => {
    const noChange = new Date("2025-08-16T00:00:00.000Z");
    noChange.addHours(0);
    expect(noChange.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const addOneHour = new Date("2025-08-16T00:00:00.000Z");
    addOneHour.addHours(1);
    expect(addOneHour.toISOString()).toBe("2025-08-16T01:00:00.000Z");

    const toNextDay = new Date("2025-08-16T00:00:00.000Z");
    toNextDay.addHours(24);
    expect(toNextDay.toISOString()).toBe("2025-08-17T00:00:00.000Z");

    const backOneHour = new Date("2025-08-16T00:00:00.000Z");
    backOneHour.addHours(-1);
    expect(backOneHour.toISOString()).toBe("2025-08-15T23:00:00.000Z");    
});

test('addMinutes', () => {
    const noChange = new Date("2025-08-16T00:00:00.000Z");
    noChange.addMinutes(0);
    expect(noChange.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const addOneMinute = new Date("2025-08-16T00:00:00.000Z");
    addOneMinute.addMinutes(1);
    expect(addOneMinute.toISOString()).toBe("2025-08-16T00:01:00.000Z");

    const addOneDayInMinutes = new Date("2025-08-16T00:00:00.000Z");
    addOneDayInMinutes.addMinutes(1440);
    expect(addOneDayInMinutes.toISOString()).toBe("2025-08-17T00:00:00.000Z");

    const backOneMinute = new Date("2025-08-16T00:00:00.000Z");
    backOneMinute.addMinutes(-1);
    expect(backOneMinute.toISOString()).toBe("2025-08-15T23:59:00.000Z");
});

test('roundOutMs', () => {
    const noRoundingNeeded = new Date("2025-08-16T00:00:00.000Z").roundOutMs();
    expect(noRoundingNeeded.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const roundDown1ms = new Date("2025-08-16T00:00:00.001Z").roundOutMs();
    expect(roundDown1ms.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const roundDown499ms = new Date("2025-08-16T00:00:00.499Z").roundOutMs();
    expect(roundDown499ms.toISOString()).toBe("2025-08-16T00:00:00.000Z");

    const roundUp500ms = new Date("2025-08-16T00:00:00.500Z").roundOutMs();
    expect(roundUp500ms.toISOString()).toBe("2025-08-16T00:00:01.000Z");

    const roundUp999ms = new Date("2025-08-16T00:00:00.999Z").roundOutMs();
    expect(roundUp999ms.toISOString()).toBe("2025-08-16T00:00:01.000Z");
});
