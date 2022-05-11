$(document).ready(() => {
  // Recommendations amount input
  $("#recommendations_amount").on("input", (e) => {
    var amount = $(e.target).val();

    if ($("#scan_btn").attr("value")) {
      if (amount > 0 && amount <= 250) {
        $("#scan_btn").prop("disabled", false);
      } else {
        $("#scan_btn").prop("disabled", true);
      }
    }
  });

  // Search playlists input
  $("#playlist_search").on("input", (e) => {
    var input = $(e.target).val();
    var regex = new RegExp(input, "g");
    var playlists = $(".playlist_container");

    for (let i = 1; i < playlists.length; i++) {
      var name = $(playlists[i]).attr("name");

      if (regex.test(name)) {
        $(`[name="${name}"]`).show();
      } else {
        $(`[name="${name}"]`).hide();
      }
    }
  });
});

function playlistClick(playlistArr) {
  if (playlistArr.type === "playlist") {
    var url = playlistArr.url;
    var name = playlistArr.name;
    var total = playlistArr.total;
    var id = playlistArr.id;
  } else {
    var url = "../static//images/liked_songs_cover.png";
    var name = "Liked Songs";
    var total = playlistArr.total;
    var id = "liked songs";
  }

  $("#playlist_cover").attr("src", url); // Change image of selected playlist

  // Marquee
  // Change playlist title
  var txt = $("#selected_playlist_title");
  txt.html(name);

  // Get width of text
  var html_txt = txt.html();
  var html_calc = "<span>" + html_txt + "</span>";

  $(txt).html(html_calc);
  var width = $(txt).find("span:first").width();
  $(txt).html(html_txt);

  // Add marquee class
  txt.removeClass("marquee");
  if (width > 200) {
    setTimeout(() => {
      txt.css("width", `${width - 200}px`);
      txt.addClass("marquee");
    }, 1);
  }

  $("#selected_playlist > div > p").html(total + " songs");

  // Check if recommendations amount is valid
  var amount = $("#recommendations_amount").val();
  if (amount > 0 && amount <= 1000) {
    $("#scan_btn").attr("value", id).prop("disabled", false);
  } else {
    $("#scan_btn").attr("value", id).prop("disabled", true);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}
