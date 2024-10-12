const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',   // replace with your MySQL username
    password: 'your_password', // replace with your MySQL password
    database: 'attendance_db'  // replace with your database name
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Sample route
app.get('/', (req, res) => {
    res.send('Hello, Attendance Management System!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
