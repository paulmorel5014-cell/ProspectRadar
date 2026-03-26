import Database from "better-sqlite3";
const db = new Database("prospects.db");
const count = db.prepare("SELECT COUNT(*) as count FROM prospects").get();
console.log("Total prospects:", count.count);
const samples = db.prepare("SELECT name, city FROM prospects LIMIT 5").all();
console.log("Samples:", samples);
