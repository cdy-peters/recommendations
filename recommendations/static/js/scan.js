$(document).ready(function () {
  // Marquee
  // Change playlist title
  var txt = $("#scan_playlist_title");

  // Get width of text
  var html_txt = txt.html();
  var html_calc = "<span>" + html_txt + "</span>";

  $(txt).html(html_calc);
  var width = $(txt).find("span:first").width();
  $(txt).html(html_txt);

  // Add marquee class
  if (width > 200) {
    txt.css("width", `${width - 200}px`);
    txt.addClass("marquee");
  }
});
