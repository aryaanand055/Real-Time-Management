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

app.get('/form1', (req, res) => {
    //Render the form1.html
    res.sendFile(path.join(__dirname, '/views/form1.html'));
});

app.get('/fetch-student/:rollNumber', (req, res) => {
    const rollNumber = req.params.rollNumber;
    const query = 'SELECT * FROM students WHERE roll_number = ?';

    db.query(query, [rollNumber], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send(null);
        res.json(results[0]);
    });
});

app.post('/save-absence', (req, res) => {
    const rollNumber = req.body.rollNumber;
    const reason = req.body.reason;

    const query = 'INSERT INTO stud_abs (roll_number, reason) VALUES (?, ?)';
    db.query(query, [rollNumber, reason], (err) => {
        if (err) return res.status(500).send(err);

        // Redirecting to homepage after 2 seconds
        res.send(`<!DOCTYPE html>
            <html>
                <head>
                    <meta http-equiv="refresh" content="2;url=/form1" />
                    <title>Success</title>
                </head>
                <body>
                    <h1>Absence recorded successfully!</h1>
                    <p>You will be redirected to the homepage shortly.</p>
                </body>
            </html>`);
    });
});


// Start the server
const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
