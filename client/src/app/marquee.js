const setClass = (element, width, minWidth) => {
  if (width > minWidth) {
    element.css("width", `${width - minWidth}px`);
    element.addClass("marquee");
  } else {
    element.css("width", "auto");
    element.removeClass("marquee");
  }
};

const setTitleMarquee = (element, playlistName, minWidth) => {
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
  setClass(txt, width, minWidth);
};

const setTrackMarquee = () => {
  // Get row width
  var rows = $("#recommendation_row > td:last-child");
  var rowWidth = rows.width();

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    // Set name marquee
    var name = $(row).find("#recommendation_name");
    var nameWidth = $(name).find("a").width();

    setClass(name, nameWidth, rowWidth);

    // Set artist marquee
    var artist = $(row).find("#recommendation_artist");
    var artistWidth = $(artist).find("span").width();
    if (artist.find("svg").length > 0) artistWidth += 20;

    setClass(artist, artistWidth, rowWidth);
  }
};
