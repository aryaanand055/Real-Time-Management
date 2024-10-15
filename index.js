const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
    const query = 'SELECT * FROM student_data';  // Update with your table name

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
    res.sendFile(path.join(__dirname, '/views/form1.html'));
});

app.get('/fetch-student/:Reg_no', (req, res) => {
    const regNo = req.params.Reg_no;
    const query = 'SELECT * FROM student_data WHERE Reg_no = ?';

    db.query(query, [regNo], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        res.json(results[0]);
    });
});

app.post('/save-absence', (req, res) => {
    const rollNumber = req.body.Reg_no2;
    const reason = req.body.reason;

    const query = 'INSERT INTO student_absent_data (Reg_no, reason) VALUES (?, ?)';

    db.query(query, [rollNumber, reason], (err) => {
        if (err) return res.status(500).send(err);

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Query to get total absences for the last month
        const q2 = 'SELECT COUNT(*) as c FROM student_absent_data WHERE Reg_no = ? AND Late_Date >= ?';
        db.query(q2, [rollNumber, monthAgo], (err, results) => {
            if (err) return res.status(500).send(err);

            const totalAbsences = results[0].c; // Get the total count

            // Redirecting to homepage after 2 seconds
            res.send(`<!DOCTYPE html>
                <html>
                    <head>
                        <meta http-equiv="refresh" content="2;url=/form1" />
                        <title>Success</title>
                    </head>
                    <body>
                        <h1>Absence recorded successfully!</h1>
                        <h2>Total absences in the past month: ${totalAbsences}</h2>
                        <p>You will be redirected to the homepage shortly.</p>
                    </body>
                </html>`);
        });
    });
});


const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
