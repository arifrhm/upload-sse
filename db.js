const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  port: 3307,
  user: 'yourusername',
  password: 'yourpassword',
  database: 'yourdatabase'
});

module.exports = pool;
