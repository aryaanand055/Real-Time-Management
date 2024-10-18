const form = document.getElementById('absenceForm');
form.onsubmit = async (e) => {
    e.preventDefault();
    const Reg_no = document.getElementById('Reg_no').value;
    console.log(Reg_no)
    try {
        const response = await fetch(`/fetch-student/${Reg_no}`);

        if (!response.ok) {
            if (response.status === 404) {
                alert('Student not found.');
            } else {
                alert('An error occurred while fetching student data.');
            }
            return;
        }

        const student = await response.json();

        document.getElementById('studentName').textContent = student.Student_name;
        document.getElementById('department').textContent = student.Department;
        document.getElementById('section').textContent = student.Section;
        document.getElementById('mobNo').textContent = student.Mob_no;
        document.getElementById('mailId').textContent = student.Mail_Id;
        document.getElementById('residence').textContent = student.Residence;
        document.getElementById('Reg_no2').value = student.Reg_no;

        document.getElementById('studentData').style.display = 'block';
    } catch (err) {
        console.error('Fetch error:', err);
        alert('An unexpected error occurred.');
    }
};
