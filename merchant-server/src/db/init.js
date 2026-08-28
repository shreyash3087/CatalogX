'use strict';

/**
 * Database initialization — creates tables from schema.sql and returns the db instance.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.DB_NAME || 'catalogx.db';
const DB_PATH = path.resolve(__dirname, `../../data/${DB_NAME}`);
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

let _db = null;

function getDb() {
  if (_db) return _db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  _db.exec(schema);

  // Automatic column migrations for orders table
  try {
    const tableInfo = _db.prepare("PRAGMA table_info(orders)").all();
    const existingCols = new Set(tableInfo.map(c => c.name));
    const newCols = [
      { name: 'customer_name', type: 'TEXT' },
      { name: 'customer_email', type: 'TEXT' },
      { name: 'customer_phone', type: 'TEXT' },
      { name: 'shipping_street', type: 'TEXT' },
      { name: 'shipping_city', type: 'TEXT' },
      { name: 'shipping_state', type: 'TEXT' },
      { name: 'shipping_postal_code', type: 'TEXT' },
      { name: 'shipping_country', type: 'TEXT' }
    ];
    for (const col of newCols) {
      if (!existingCols.has(col.name)) {
        _db.exec(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  } catch (err) {
    console.warn('Orders migration note:', err.message);
  }

  return _db;
}

module.exports = { getDb, DB_PATH };
