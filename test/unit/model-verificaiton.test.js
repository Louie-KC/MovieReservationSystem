import { Account } from '../../src/models/account.js';
import { Movie } from '../../src/models/movie.js';
import { Schedule } from '../../src/models/schedule.js';

describe("Account - register verification", () => {
    const valid = {
        given_name: "abcd",
        last_name: "efgh",
        email: "abcd@email.com",
        password: "TestPassword1"
    };
    
    it('should be valid', () => {
        expect(Account.validateFieldsRegister(valid)).toBe(true);
    });

    it('should be invalid: missing field(s)', () => {
        expect(Account.validateFieldsRegister({})).toBe(false);

        const missingGiven = JSON.parse(JSON.stringify(valid));
        delete missingGiven.given_name;
        expect(Account.validateFieldsRegister(missingGiven)).toBe(false);

        const missingLast = JSON.parse(JSON.stringify(valid));
        delete missingLast.last_name;
        expect(Account.validateFieldsRegister(missingLast)).toBe(false);

        const missingEmail = JSON.parse(JSON.stringify(valid));
        delete missingEmail.email;
        expect(Account.validateFieldsRegister(missingEmail)).toBe(false);

        const missingPassword = JSON.parse(JSON.stringify(valid));
        delete missingPassword.password;
        expect(Account.validateFieldsRegister(missingPassword)).toBe(false);
    });

    it('should be invalid: bad names', () => {
        const givenWithNumber = JSON.parse(JSON.stringify(valid));
        givenWithNumber.given_name = "abcd1";
        expect(Account.validateFieldsRegister(givenWithNumber)).toBe(false);
        
        const givenWithSymbol = JSON.parse(JSON.stringify(valid));
        givenWithSymbol.given_name = "abcd$";
        expect(Account.validateFieldsRegister(givenWithSymbol)).toBe(false);
        
        const lastWithNumber = JSON.parse(JSON.stringify(valid));
        lastWithNumber.last_name = "efgh1";
        expect(Account.validateFieldsRegister(givenWithNumber)).toBe(false);
        
        const lastWithSymbol = JSON.parse(JSON.stringify(valid));
        lastWithSymbol.last_name = "efgh$";
        expect(Account.validateFieldsRegister(givenWithSymbol)).toBe(false);
    });

    it('should be invalid: bad email', () => {
        const incomplete = JSON.parse(JSON.stringify(valid));
        incomplete.email = "abcd@email";
        expect(Account.validateFieldsRegister(incomplete)).toBe(false);
    });

    it('should be invalid: bad password', () => {
        const noUpper = JSON.parse(JSON.stringify(valid));
        noUpper.password = "testpassword1";
        expect(Account.validateFieldsRegister(noUpper)).toBe(false);
    });
});

describe("Account - login verification", () => {
    const valid = {
        "email": "abcd@email.com",
        "password": "TestPassword1"
    };
    it('should be valid', () => {
        expect(Account.validateFieldsLogin(valid)).toBe(true);
    });

    it('should be invalid: Missing field', () => {
        const incomplete = JSON.parse(JSON.stringify(valid));
        incomplete.email = "abcd@email";
        expect(Account.validateFieldsLogin(incomplete)).toBe(false);
    });

    it('should be invalid: bad email address', () => {
        const incomplete = JSON.parse(JSON.stringify(valid));
        incomplete.email = "abcd@email";
        expect(Account.validateFieldsLogin(incomplete)).toBe(false);
    });

    it('should be invalid: bad password', () => {
        const noDigits = JSON.parse(JSON.stringify(valid));
        noDigits.password = "TestPassword";
        expect(Account.validateFieldsLogin(noDigits)).toBe(false);
        
        const noUpper = JSON.parse(JSON.stringify(valid));
        noUpper.password = "testpassword1";
        expect(Account.validateFieldsLogin(noUpper)).toBe(false);
        
        const tooShort = JSON.parse(JSON.stringify(valid));
        tooShort.password = "TestP1";
        expect(Account.validateFieldsLogin(tooShort)).toBe(false);
    });
});

describe("Account - change password verification", () => {
    const valid = {
        old: "AbcdEfgh123",
        new: "IJKLmnop321"
    };
    it('should be valid', () => {
        expect(Account.validateFieldsChangePassword(valid)).toBe(true);
    });

    it('should be invalid: Missing field(s)', () => {
        expect(Account.validateFieldsChangePassword({})).toBe(false);

        const missingOld = JSON.parse(JSON.stringify(valid));
        delete missingOld.old;
        expect(Account.validateFieldsChangePassword(missingOld)).toBe(false);
        
        const missingNew = JSON.parse(JSON.stringify(valid));
        delete missingNew.new;
        expect(Account.validateFieldsChangePassword(missingNew)).toBe(false);
    });
    
    
    it('should be invalid: Bad old password', () => {
        const noDigits = JSON.parse(JSON.stringify(valid));
        noDigits.old = "AbcdEfgh";
        expect(Account.validateFieldsChangePassword(noDigits)).toBe(false);

        const tooShort = JSON.parse(JSON.stringify(valid));
        tooShort.old = "Ab1";
        expect(Account.validateFieldsChangePassword(tooShort)).toBe(false);
    });
    
    it('should be invalid: Bad new password', () => {
        const noDigits = JSON.parse(JSON.stringify(valid));
        noDigits.new = "IJKLmnop";
        expect(Account.validateFieldsChangePassword(noDigits)).toBe(false);
    
        const tooShort = JSON.parse(JSON.stringify(valid));
        tooShort.new = "Ab3";
        expect(Account.validateFieldsChangePassword(tooShort)).toBe(false);
    });
});

describe("Account - change kind verification", () => {
    it('should be valid', () => {
        expect(Account.validateFieldsChangeKind({ account_id: 123 })).toBe(true);
        expect(Account.validateFieldsChangeKind({ account_id: "123" })).toBe(true);
    });

    it('should be invalid: Missing/incorrect field', () => {
        expect(Account.validateFieldsChangeKind({})).toBe(false);
        expect(Account.validateFieldsChangeKind({ id: 123 })).toBe(false);
    });
    
    it('should be invalid: ID not a valid number', () => {
        expect(Account.validateFieldsChangeKind({ account_id: -123 })).toBe(false);
        expect(Account.validateFieldsChangeKind({ account_id: "123abc" })).toBe(false);
    })
});

describe("Movie - field validation", () => {
    const valid = {
        id: 123,
        title: "abcd efgh",
        description: "ijkl",
        duration: 100,
        genres: [ "mnop" ]
    };

    it('should be valid', () => {
        expect(Movie.validateFields(valid)).toBe(true);
        const withoutId = JSON.parse(JSON.stringify(valid));
        delete withoutId.id;
        expect(Movie.validateFields(withoutId)).toBe(true);
    });

    it('should be invalid: Missing field(s)', () => {
        expect(Movie.validateFields({})).toBe(false);

        const missingTitle = JSON.parse(JSON.stringify(valid));
        delete missingTitle.title;
        expect(Movie.validateFields(missingTitle)).toBe(false);

        const missingDescription = JSON.parse(JSON.stringify(valid));
        delete missingDescription.description;
        expect(Movie.validateFields(missingDescription)).toBe(false);

        const missingDuration = JSON.parse(JSON.stringify(valid));
        delete missingDuration.duration;
        expect(Movie.validateFields(missingDuration)).toBe(false);

        const missingGenres = JSON.parse(JSON.stringify(valid));
        delete missingGenres.genres;
        expect(Movie.validateFields(missingGenres)).toBe(false);
    });

    it('should be invalid: bad title', () => {
        const tooShort = JSON.parse(JSON.stringify(valid));
        tooShort.title = "abc";
        expect(Movie.validateFields(tooShort)).toBe(false);

        const hasSymbols = JSON.parse(JSON.stringify(valid));
        hasSymbols.title = "A test movie !@#";
        expect(Movie.validateFields(hasSymbols)).toBe(false);
    });
    
    it('should be invalid: bad description', () => {
        const tooShort = JSON.parse(JSON.stringify(valid));
        tooShort.description = "abc";
        expect(Movie.validateFields(tooShort)).toBe(false);
    
        const hasSymbols = JSON.parse(JSON.stringify(valid));
        hasSymbols.description = "A test movie description !@#";
        expect(Movie.validateFields(hasSymbols)).toBe(false);
    });

    it('should be invalid: bad duration', () => {
        const negative = JSON.parse(JSON.stringify(valid));
        negative.duration = -1;
        expect(Movie.validateFields(negative)).toBe(false);
    });

    it('should be invalid: bad genre', () => {
        const genreWithNumber = JSON.parse(JSON.stringify(valid));
        genreWithNumber.genres[0] = "abcd3";
        expect(Movie.validateFields(genreWithNumber)).toBe(false);
        
        const genreWithSymbol = JSON.parse(JSON.stringify(valid));
        genreWithSymbol.genres[0] = "ab-cd";
        expect(Movie.validateFields(genreWithSymbol)).toBe(false);

        const genresNotArray = JSON.parse(JSON.stringify(valid));
        genresNotArray.genres = "abcd";
        expect(Movie.validateFields(genresNotArray)).toBe(false);
    });
});

describe("Schedule - field validation", () => {
    const valid = {
        movie: 123,
        location: 1,
        cinema: 1,
        time: "2025-08-09 19:10:00"
    };

    it('should be valid', () => {
        expect(Schedule.validateFields(valid)).toBe(true);
    });

    it('should be invalid: Missing fields', () => {
        expect(Schedule.validateFields({})).toBe(false);

        const missingMovieId = JSON.parse(JSON.stringify(valid));
        delete missingMovieId.movie;
        expect(Schedule.validateFields(missingMovieId)).toBe(false);

        const missingLocationId = JSON.parse(JSON.stringify(valid));
        delete missingLocationId.location;
        expect(Schedule.validateFields(missingLocationId)).toBe(false);

        const missingCinemaId = JSON.parse(JSON.stringify(valid));
        delete missingCinemaId.cinema;
        expect(Schedule.validateFields(missingCinemaId)).toBe(false);

        const missingTime = JSON.parse(JSON.stringify(valid));
        delete missingTime.time;
        expect(Schedule.validateFields(missingTime)).toBe(false);
    });

    it('should be invalid: bad movie id', () => {
        const negative = JSON.parse(JSON.stringify(valid));
        negative.movie = -1;
        expect(Schedule.validateFields(negative)).toBe(false);

        const text = JSON.parse(JSON.stringify(valid));
        text.movie = "abc";
        expect(Schedule.validateFields(text)).toBe(false);
    });

    it('should be invalid: bad location id', () => {
        const negative = JSON.parse(JSON.stringify(valid));
        negative.location = -1;
        expect(Schedule.validateFields(negative)).toBe(false);

        const text = JSON.parse(JSON.stringify(valid));
        text.location = "abc";
        expect(Schedule.validateFields(text)).toBe(false);
    });

    it('should be invalid: bad cinema id', () => {
        const negative = JSON.parse(JSON.stringify(valid));
        negative.cinema = -1;
        expect(Schedule.validateFields(negative)).toBe(false);

        const text = JSON.parse(JSON.stringify(valid));
        text.cinema = "abc";
        expect(Schedule.validateFields(text)).toBe(false);
    });

    it('should be invalid: bad time', () => {
        const badFormat2 = JSON.parse(JSON.stringify(valid));
        badFormat2.time = "25-08-09 19:10:00";
        expect(Schedule.validateFields(badFormat2)).toBe(false);
    });
});
