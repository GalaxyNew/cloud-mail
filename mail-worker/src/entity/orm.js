import { drizzle } from 'drizzle-orm/d1';

export default function orm(c) {
	const db = c?.env?.db || c?.env?.DB;
	if (!db) {
		throw new Error("D1 database binding 'db' not found. Please ensure [[d1_databases]] binding = 'db' is properly bound.");
	}
	return drizzle(db, { logger: c?.env?.orm_log });
}
