const database = require("better-sqlite3")
const db = new database("log.db")

const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);

let row = stmt.get()

if(row === undefined){
    console.log("Log DB is empty")
    const sqlInit = `
    CREATE TABLE accesslog (id INTEGER PRIMARY KEY, remoteaddr TEXT, remoteuser TEXT, time INTEGER, method TEXT, url TEXT, protocol TEXT, httpversion TEXT, status INTEGER, referer TEXT, useragent TEXT);
    `
    db.exec(sqlInit)
    console.log("Log DB initialized")
}
else{
    console.log("Log DB exists")
}


module.exports = db