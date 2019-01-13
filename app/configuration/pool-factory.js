const mysql = require('mysql');

const pool = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'projecthfx',
    port : 3306
});

console.log('pool => created');

pool.on('release', () => console.log('pool => connection was returned'));

process.on('SIGINT', () => {
    pool.end(err => {
        if(err) return console.log(err);
        console.log('pool => closed');
        process.exit(0);
    })
}
);

module.exports = pool;