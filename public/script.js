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
var lFollowX = 0,
    lFollowY = 0,
    x = 0,
    y = 0,
    friction = 1 / 30;

function animate() {
    x += (lFollowX - x) * friction;
    y += (lFollowY - y) * friction;

    translate = 'translate(' + x + 'px, ' + y + 'px) scale(1.1)';

    $('img').css({
        '-webit-transform': translate,
        '-moz-transform': translate,
        'transform': translate
    });

    window.requestAnimationFrame(animate);
}

$(window).on('mousemove click', function (e) {

    var lMouseX = Math.max(-100, Math.min(100, $(window).width() / 2 - e.clientX));
    var lMouseY = Math.max(-100, Math.min(100, $(window).height() / 2 - e.clientY));
    lFollowX = (20 * lMouseX) / 100; // 100 : 12 = lMouxeX : lFollow
    lFollowY = (10 * lMouseY) / 100;

});

animate();

function adjustFooter() {
    const footer = document.querySelector('.footer1');
    const contentHeight = document.body.offsetHeight + footer.clientHeight; // Total content height
    const viewportHeight = window.innerHeight; // Viewport height

    if (contentHeight <= viewportHeight) {
        footer.style.position = 'absolute';
        footer.style.bottom = '0';
    } else {
        footer.style.position = 'static';
    }
}

['load', 'resize', 'change'].forEach(event => {
    window.addEventListener(event, adjustFooter);
});
