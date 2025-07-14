import { dbConnPool } from "../services/database.js";

export class Location {
    id;
    address;

    constructor(data) {
        this.id = data.id;
        this.address = data.address;
    }

    static async findAll() {
        try {
            const [rows, _] = await dbConnPool.execute(
                "SELECT * \
                FROM Location"
            );
            return rows.map((row) => new Location(row));
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
