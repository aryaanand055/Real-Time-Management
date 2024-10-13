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

app.set('view engine', 'ejs');


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

app.get('/records', (req, res) => {
    const query = 'SELECT * FROM students';  // Update with your table name

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else {
            // Render the EJS template and pass the fetched data
            res.render('records', { students: results });
        }
    });
});

// Start the server
const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
