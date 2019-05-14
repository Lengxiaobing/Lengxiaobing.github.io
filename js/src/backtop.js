
$("#back_top").hide();

$(document).ready(function () {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('#back_top').fadeIn();
        } else {
            $('#back_top').fadeOut();
        }
    });
    $('#back_top a').click(function () {
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });
});