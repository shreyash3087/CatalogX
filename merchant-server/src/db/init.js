'use strict';

/**
 * Database initialization — creates tables from schema.sql and returns the db instance.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../data/catalogx.db');
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

  return _db;
}

module.exports = { getDb, DB_PATH };
