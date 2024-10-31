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

// For session memory for authentication 
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.use(cookieParser());


// For reference
// 1.Staff
// 2.Tutor
// 3.HOD
const authenticateJWT = (allowedRoles = []) => {
    return (req, res, next) => {
        const token = req.cookies.logintoken;
        if (!token) {
            // Redirect to login with the original request URL
            return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, resultVer) => {
            if (err) {
                // Login Expired
                // Send message that the login has expired
                return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
            }

            const { Reg_No } = resultVer;

            const query = 'SELECT * FROM staff_data WHERE Reg_No = ?';
            db.query(query, [Reg_No], (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.send(`Database error: ${err}`);
                }

                if (results.length === 0) {
                    return res.send("User not found");
                }

                const userRole = results[0].Access_Role;

                if (!allowedRoles.includes(userRole)) {
                    return res.send(`Classified Information. Access Denied.`);
                }

                req.user = { Reg_No, accessRole: userRole };
                next();
            });
        });
    };
};


const checkIfLoggedIn = (req, res, next) => {
    const token = req.cookies.logintoken;
    if (!token) {
        req.isLoggedIn = false;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
        if (err) {
            req.isLoggedIn = false;
        } else {
            req.isLoggedIn = true;
            req.user = { Reg_No: result.Reg_No, accessRole: result.Access_Role };
        }
        next();
    });
};



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


// For the header and footer content
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'master');

// For static css and js
app.use(express.static('public'));

// App routes start here

app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, '/views/home.html'));
});
app.get('/login', checkIfLoggedIn, (req, res) => {
    if (req.isLoggedIn) {
        const redirectUrl = req.query.redirect || '/';
        return res.redirect(redirectUrl);
    } else {
        res.render("login", { title: "Login", redirectUrl: req.query.redirect || '/' });
    }
});

app.post("/login", (req, res) => {
    const Reg_No = req.body.Reg_No;
    const password = req.body.password;
    const query = "SELECT * FROM staff_data WHERE Reg_No = ?";
    const redirectUrl = req.body.redirect || '/records'
    db.query(query, [Reg_No], (err, result) => {
        if (err) {
            return res.send(`Authentication Unsuccessful. Error: ${err}`);
        }
        if (result.length === 0) {
            return res.send("User Not Found");
        }
        if (password === result[0].Password) {
            const token = jwt.sign({ Reg_No: result[0].Reg_No, Access_Role: result[0].Access_Roll }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('logintoken', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
            return res.redirect(redirectUrl);
        } else {
            return res.send("Incorrect Password");
        }
    });
});

app.get('/records', authenticateJWT([2, 3]), (req, res) => {
    const query = 'SELECT * FROM student_data';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else {
            res.render('records', { students: results, title: "All records" });
        }
    });

});

app.get('/lateAbsenceForm', authenticateJWT([2, 3]), (req, res) => {
    res.render("lateAbsenceForm", { title: "Late Attendance Form" })
});

app.get("/records/:Dept/:Class/:Sec", authenticateJWT([2, 3]), (req, res) => {
    const params = [req.params.Dept, req.params.Class, req.params.Sec];
    const query = "SELECT * FROM student_absent_data a,student_data b WHERE a.Reg_no = b.Reg_no and Department = ? AND YearOfStudy = ? AND Section = ?";
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
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
        title = `${params[0]} - ${params[1]}${params[2]}`
        res.render('recordsPerClass', { students: resultArray, urlPar: params, title: title });
    })
});
app.get("/records/:Dept", authenticateJWT([3]), (req, res) => {
    let dept = req.params.Dept
    const query = "SELECT YearOfStudy, Section, COUNT(*) as AbsenceCount FROM student_absent_data a, student_data b WHERE a.Reg_no = b.Reg_no and Department = ? group by YearOfStudy , Section;";
    db.query(query, dept, (err, result) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        }
        dept = dept.toUpperCase()
        res.render("recordsPerDept", { data: result, deptName: dept, title: `Records for Department - ${dept}` });

    })
});


app.get('/fetch-student/:Reg_no', authenticateJWT([1, 2, 3]), (req, res) => {
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

app.post('/save-absence', authenticateJWT([1, 2, 3]), (req, res) => {
    const rollNumber = req.body.Reg_no2;
    const reason = req.body.reason;

    const query = 'INSERT INTO student_absent_data (Reg_no, reason, Staff_Reg_No) VALUES (?, ?, ?)';

    db.query(query, [rollNumber, reason, req.user.Reg_No], (err) => {
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
                res.render('absenceFormSubmitted', { msg: msg, title: "Late attendance submitted" });
            })
        });
    });
});

//Handle the 404
app.all('*', (req, res) => {
    res.render('page404', { title: "404 Page" });
})

const PORT = process.env.PORT || portToUse;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
