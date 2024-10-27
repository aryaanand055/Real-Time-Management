const form = document.getElementById('absenceForm');

form.onsubmit = async (e) => {
    e.preventDefault();
    const Reg_no = document.getElementById('Reg_no').value;
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
        const box = document.querySelector('#barcodeCont');
        box.style.display = 'none';

    } catch (err) {
        console.error('Fetch error:', err);
        alert('An unexpected error occurred.');
    }
};

QuaggaInit = function () {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#barcodeCont'),
            constraints: {
                width: 1920,
                height: 1080,
                facingMode: "environment",
            },
            area: {
                top: "10%",
                right: "10%",
                left: "10%",
                bottom: "10%"
            },
            singleChannel: false
        },
        decoder: {
            readers: ["code_128_reader"]
        }
    }, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();

    });

}

QuaggaInit()

Quagga.onDetected(function (result) {
    const code = result.codeResult.code;
    const box = document.querySelector('#barcodeCont');
    box.style.display = 'none';
    document.getElementById('Reg_no').value = code;
    Quagga.stop();
    form.onsubmit(new Event('submit'));
    document.getElementById('reason').focus();
});

window.addEventListener('beforeunload', function () {
    Quagga.stop();
});

window.addEventListener("DOMContentLoaded", () => {
    const video = document.querySelector('#barcodeCont video');
    if (video) {
        video.style.width = '100%';
        video.style.height = 'auto';
    }
})

function resetUI() {
    document.getElementById('Reg_no').value = '';
    document.getElementById('studentData').style.display = 'none';
    document.getElementById('barcodeCont').style.display = 'block';
}

document.getElementById('restartScan').addEventListener('click', restartScanner);
function restartScanner() {
    Quagga.stop();
    resetUI();
    QuaggaInit()
}