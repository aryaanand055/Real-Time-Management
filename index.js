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
            return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}&msg=${encodeURIComponent("Please login to continue")}`);

        }

        jwt.verify(token, process.env.JWT_SECRET, (err, resultVer) => {
            if (err) {
                // Login Expired
                return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}&msg=${encodeURIComponent("Login has expired. Please login again")}`);
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
const { access } = require('fs');
app.use(expressLayouts);
app.set('layout', 'master');

// For static css and js
app.use(express.static('public'));

// App routes start here

app.get("/", (req, res) => {
    res.render("home", { title: "Home Page" })

})

app.get('/dashboard', (req, res) => {
    const mesg = req.query.msg
    res.render("dashboard", { title: "Home Page", msg: mesg })
});
app.get('/login', checkIfLoggedIn, (req, res) => {
    if (req.isLoggedIn) {
        const redirectUrl = req.query.redirect || '/';
        const msg = "You are already logged in. Redirected to the home page";
        return res.redirect(`${redirectUrl}?msg=${encodeURIComponent(msg)}`);
    } else {
        const mesg = req.query.msg
        res.render("login", { title: "Login", redirectUrl: req.query.redirect || '/', msg: mesg });
    }
});

app.post("/login", (req, res) => {
    const Reg_No = req.body.Reg_No;
    const password = req.body.password;
    const query = "SELECT * FROM staff_data WHERE Reg_No = ?";
    db.query(query, [Reg_No], (err, result) => {
        if (err) {
            return res.json({
                success: false,
                message: "Error occurred while logging in",
                access_role: result[0].Access_Role
            })
        }
        if (result.length === 0) {
            return res.json({
                success: false,
                message: "Authentication Unsuccessful. User not found",
                access_role: result[0].Access_Role
            })
        }
        if (password === result[0].Password) {
            const token = jwt.sign({ Reg_No: result[0].Reg_No, Access_Role: result[0].Access_Roll }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.cookie('logintoken', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
            return res.json({
                success: true,
                message: "Login Successful",
                access_role: result[0].Access_Role
            })
        } else {
            return res.json({
                success: false,
                message: "Authentication Unsuccessful - Incorrect Password",
                access_role: result[0].Access_Role
            })
        }
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie('logintoken', { httpOnly: true, secure: false, sameSite: 'Strict' });
    res.redirect('/login?msg=' + encodeURIComponent("You have been logged out successfully"));
});

app.get("/records", authenticateJWT([2, 3]), (req, res) => {
    const userRegNo = req.user.Reg_No;
    const query = "SELECT * FROM staff_data WHERE Reg_No = ?";
    db.query(query, [userRegNo], (err, result) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else if (result.length === 0) {
            res.send('No records found for the user.');
        } else {
            let arole = result[0].Access_Role
            if (arole == 2) {
                return res.redirect("/records/class")
            } else if (arole == 3) {
                return res.redirect("/records/dept")
            }

        }
    });

})

app.get('/recordsall', authenticateJWT([2, 3]), (req, res) => {
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

app.get("/records/class", authenticateJWT([2, 3]), (req, res) => {
    const userRegNo = req.user.Reg_No;

    const query = "SELECT * FROM staff_data WHERE Reg_No = ?";
    db.query(query, [userRegNo], (err, result) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else if (result.length === 0) {
            res.send('No records found for the user.');
        } else {
            let dept = result[0].Department;
            let class1 = result[0].YearOfClass
            let section = result[0].Section

            res.redirect(`/records/${dept}/${class1}/${section}`)
        }
    });
});

app.get("/records/dept", authenticateJWT([3]), (req, res) => {
    const userRegNo = req.user.Reg_No;

    const query = "SELECT * FROM staff_data WHERE Reg_No = ?";
    db.query(query, [userRegNo], (err, result) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.send('Error fetching records');
        } else if (result.length === 0) {
            res.send('No records found for the user.');
        } else {
            let dept = result[0].Department;
            const query = "SELECT YearOfStudy, Section, COUNT(*) as AbsenceCount FROM student_absent_data a, student_data b WHERE a.Reg_no = b.Reg_no and Department = ? group by YearOfStudy , Section;";
            db.query(query, dept, (err, result) => {
                if (err) {
                    console.error('Error fetching records:', err);
                    res.send('Error fetching records');
                }
                dept = dept.toUpperCase()
                res.render("recordsPerDept", { data: result, deptName: dept, title: `Records for Department - ${dept}` });

            })
        }
    });
});


app.get("/records/:Dept/:Class/:Sec", authenticateJWT([2, 3]), (req, res) => {
    const userRegNo = req.user.Reg_No;

    const query0 = "SELECT * FROM staff_data WHERE Reg_No = ?";
    db.query(query0, [userRegNo], (err, result) => {
        if (err) {
            console.error('Error fetching records:', err);
            return res.send('Error fetching records');
        }

        if (result.length === 0) {
            return res.send('No records found for the user.');
        }

        let aDept = result[0].Department;
        let aClass = result[0].YearOfClass
        let aSection = result[0].Section
        let aRole = result[0].Access_Role

        const { Dept, Class, Sec } = req.params;

        const hasAccess = (aRole === 3 && aDept.toLowerCase() === Dept.toLowerCase()) || (aRole === 2 && aDept.toLowerCase() === Dept.toLowerCase() && String(aClass) === String(Class) && aSection.toLowerCase() === Sec.toLowerCase());
        if (!hasAccess) {
            return res.send(`You do not have access to this data. Your current data is Dept: ${aDept}, class: ${aClass}, section: ${aSection}, role: ${aRole}`);
        }

        const query = `
            SELECT * FROM student_absent_data a JOIN student_data b ON a.Reg_no = b.Reg_no WHERE Department = ? AND YearOfStudy = ? AND Section = ?
        `;
        db.query(query, [Dept, Class, Sec], (err, results) => {
            if (err) {
                console.error('Error fetching records:', err);
                return res.send('Error fetching records');
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
            const resultArray = Object.values(groupedStudents);
            const title = `${Dept} - ${Class}${Sec}`;
            res.render('recordsPerClass', { students: resultArray, urlPar: [Dept, Class, Sec], title });
        });
    });
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
