const setMarquee = (element, playlistName, minWidth) => {
  // Set text
  var txt = $(element);
  txt.html(playlistName);

  // Get width
  var html_txt = txt.html();
  var html_calc = "<span>" + html_txt + "</span>";

  $(txt).html(html_calc);
  var width = $(txt).find("span:first").width();
  $(txt).html(html_txt);

  // Set marquee
  if (width > minWidth) {
    txt.css("width", `${width - minWidth}px`);
    txt.addClass("marquee");
  } else {
    txt.css("width", "fit-content");
    txt.removeClass("marquee");
  }
};
