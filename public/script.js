console.log("Script.js running")
document.addEventListener('DOMContentLoaded', function () {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        setTimeout(() => {
            alertBox.classList.remove('show');
            alertBox.addEventListener('transitionend', () => alertBox.remove());
        }, 4500);
    }
});