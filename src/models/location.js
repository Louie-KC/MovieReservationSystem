import { dbConnPool } from "../services/database.js";

export class Location {
    // No constructor or data validation function.
    // Not to be taken as input from a client request.

    static async findAll() {
        try {
            const [rows, _] = await dbConnPool.execute(
                "SELECT id, address \
                FROM Location"
            );
            return rows;
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
