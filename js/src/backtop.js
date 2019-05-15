//圆形返回顶部
// $("#back_top").hide();
//
// $(document).ready(function () {
//     $(window).scroll(function () {
//         if ($(this).scrollTop() > 100) {
//             $('#back_top').fadeIn();
//         } else {
//             $('#back_top').fadeOut();
//         }
//     });
//     $('#back_top a').click(function () {
//         $('body,html').animate({
//             scrollTop: 0
//         }, 800);
//         return false;
//     });
// });


//钢铁侠返回顶部
$(window).scroll(function() {
    $(window).scrollTop() > $(window).height()*0.5 ? $("#rocket").addClass("show") : $("#rocket").removeClass("show");
});

$("#rocket").click(function() {
    $("#rocket").addClass("launch");
    $("html, body").animate({
        scrollTop: 0
    }, 1000, function() {
        $("#rocket").removeClass("show launch");
    });
    return false;
});