var mysql = require('mysql');

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"ithinkiseeu5020",
    database:"ecommerce"
})

module.exports = db