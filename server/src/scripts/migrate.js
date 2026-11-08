import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const currentFile = fileURLToPath(import.meta.url);
const migrationsDirectory = path.resolve(path.dirname(currentFile), '../../migrations');

try {
  const migrationFiles = (await fs.readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();
  for (const migrationFile of migrationFiles) {
    const sql = await fs.readFile(path.join(migrationsDirectory, migrationFile), 'utf8');
    const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    console.log(`Migración aplicada: ${migrationFile}`);
  }
} catch (error) {
  console.error('No se pudieron aplicar las migraciones:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
