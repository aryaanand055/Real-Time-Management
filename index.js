//Node.js File to handle the backend


require('dotenv').config();
const path = require("path")

//Port for viewing on localhost
const portToUse = 3000

//Express for handling routes
const express = require('express');
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Body Parser to get the content of the forms
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Database Connnection
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

app.get('/records', (req, res) => {
    const query = 'SELECT * FROM student_data';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else {
            res.render('records', { students: results });
        }
    });

});

app.get('/form1', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/form1.html'));
});

app.get("/records/:Dept/:Class/:Sec", (req, res) => {
    const params = [req.params.Dept, req.params.Class, req.params.Sec];
    console.log(params)
    const query = "SELECT * FROM student_absent_data a,student_data b WHERE a.Reg_no = b.Reg_no and Department = ? AND YearOfStudy = ? AND Section = ?";
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        }
        if (results.length === 0) {
            res.send('No records found');
        }

        const groupedStudents = results.reduce((acc, student) => {
            if (!acc[student.Reg_no]) {
                acc[student.Reg_no] = {
                    studentInfo: {
                        Reg_no: student.Reg_no,
                        Student_name: student.Student_name,
                        Mob_no: student.Mob_no,
                        Mail_Id: student.Mail_Id
                    },
                    countLate: 0,
                    records: []
                };
            }
            acc[student.Reg_no].countLate++;
            acc[student.Reg_no].records.push({
                Late_Date: new Date(student.Late_Date).toLocaleDateString("en-GB"),
                Late_Time: new Date(student.Late_Date).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }),
                Reason: student.Reason
            });
            return acc;
        }, {});

        // Converting the object to an array for easier iteration
        const resultArray = Object.values(groupedStudents);

        res.render('recordsPerClass', { students: resultArray });
    })
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

        const q2 = 'SELECT COUNT(*) as c FROM student_absent_data WHERE Reg_no = ? AND Late_Date >= ?';
        db.query(q2, [rollNumber, monthAgo], (err, results) => {
            if (err) return res.status(500).send(err);


            const totalAbsences = results[0].c;
            let msg;

            const q3 = "select * from student_data where Reg_no = ?"
            db.query(q3, [rollNumber], (err, results1) => {
                if (err) return res.status(500).send(err);
                let name = results1[0].Student_name
                let dept = results1[0].Department
                let sect = results1[0].Section
                if (totalAbsences > 3) {
                    msg = `Student ${name} from ${dept} ${sect} has exceeded the maximum allowed
                    absences for the last month. Kindly inform his/her to meet his/her tutor from ${dept} of ${sect}`
                } else {
                    msg = `${name} from ${dept} ${sect} has been late for ${totalAbsences} days `
                }

                res.send(`<!DOCTYPE html>
                <html>
                    <head>
                        <title>Success</title>
                    </head>
                    <body>
                        <h1>Absence recorded successfully!</h1>
                        <h2>${msg}</h2>
                        <a href="/form1" class="btn btn-primary">Go back to home page now</a>
                    </body>
                </html>`);

            })


        });
    });
});

const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
