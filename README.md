# Attendance Management System

This project is a web-based attendance management system designed to track students who arrive late. Teachers can scan student ID cards, retrieve the roll number, and display the student's details. A reason for lateness is then entered and saved along with the timestamp in the database for future reference.

## Features

- **Barcode Scanning**: Scan student IDs to retrieve roll numbers.
- **Student Lookup**: Retrieve and display student details from the database using the roll number.
- **Lateness Reason**: Input and save a reason for student lateness.
- **Database Storage**: Store student ID, timestamp, and reason in a dedicated late attendance database.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Database**: MySQL 

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or higher)
- MySQL (or any SQL database)
- A barcode scanner (optional, or use a simulated browser-based scanner)
