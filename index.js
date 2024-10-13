const bodyParser = require('body-parser');
const mysql = require('mysql2');

const express = require('express');
const app = express();
const path = require("path")
const portToUse = 3000

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Cookies@12',
    database: 'sdcc'
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Sample route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

// Start the server
const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
