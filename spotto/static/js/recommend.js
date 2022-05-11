$(document).ready(() => {
  localStorage.removeItem("audio");
  localStorage.setItem("checkboxCount", 0);

  // Marquee
  // Change playlist title
  var txt = $("#recommend_playlist_title");

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

function songs_overflow() {
  // Get row width
  var rows = $(".track_row > .song_details");
  var row_width = rows.width();

  var songs = $(".recommended_songs");
  var artists = $(".recommended_artists > p");

  for (let i = 0; i < songs.length; i++) {
    // Get song width
    var song = $(songs[i]);

    var html_song = song.html();
    var html_song_calc = "<span>" + html_song + "</span>";

    $(song).html(html_song_calc);
    var song_width = $(song).find("span:first").width();
    $(song).html(html_song);

    // Get artist width
    var artist = $(artists[i]);

    var html_artist = artist.html();
    var html_artist_calc = "<span>" + html_artist + "</span>";

    $(artist).html(html_artist_calc);
    var artist_width = $(artist).find("span:first").width();
    $(artist).html(html_artist);

    if (artist.children("svg").length) {
      artist_width += 20;
    }

    // Add marquee to song
    if (song_width > row_width) {
      song.parent().css("width", `${song_width - row_width}px`);
      song.parent().addClass("marquee");
    } else {
      song.parent().css("width", "");
      song.parent().removeClass("marquee");
    }

    // Add marquee to artist
    if (artist_width > row_width) {
      artist.css("width", `${artist_width - row_width}px`);
      artist.addClass("marquee");
    } else {
      artist.css("width", "");
      artist.removeClass("marquee");
    }
  }
}

window.addEventListener("resize", songs_overflow);
document.addEventListener("DOMContentLoaded", songs_overflow);
window.addEventListener("load", songs_overflow);

function playPreview(url) {
  const id = document.getElementById(url);
  const audio = id.getElementsByTagName("audio")[0];
  const btn = id.getElementsByTagName("i")[0];

  if (localStorage.getItem("audio") === url) {
    audio.pause();
    audio.currentTime = 0;

    btn.classList.replace("bi-pause", "bi-play-fill");

    localStorage.removeItem("audio");
    return;
  } else if (localStorage.getItem("audio")) {
    const storedId = document.getElementById(localStorage.getItem("audio"));
    const storedAudio = storedId.getElementsByTagName("audio")[0];
    const storedBtn = storedId.getElementsByTagName("i")[0];

    storedAudio.pause();
    storedAudio.currentTime = 0;

    storedBtn.classList.replace("bi-pause", "bi-play-fill");

    localStorage.removeItem("audio");
  }
  audio.play();

  btn.classList.replace("bi-play-fill", "bi-pause");

  localStorage.setItem("audio", url);
}

// On checkbox change
function checkboxChange(playlist_id, id) {
  var checkboxCount = localStorage.getItem("checkboxCount");

  if (
    document.getElementById("existingPlaylist").innerHTML === "Songs added" &&
    playlist_id !== "liked songs"
  ) {
    document.getElementById("existingPlaylist").innerHTML = "This Playlist";
  }
  if (document.getElementById("newPlaylist").innerHTML === "Songs added") {
    document.getElementById("newPlaylist").innerHTML = "New playlist";
  }

  if (document.getElementById(id).checked === true) {
    localStorage.setItem("checkboxCount", ++checkboxCount);
  } else {
    localStorage.setItem("checkboxCount", --checkboxCount);
  }

  $("#selected_songs").html(checkboxCount + " songs selected");

  if (checkboxCount === 0) {
    $("#existingPlaylist").prop("disabled", true);
    $("#newPlaylist").prop("disabled", true);
  } else {
    if (playlist_id !== "liked songs") {
      $("#existingPlaylist").prop("disabled", false);
    }
    $("#newPlaylist").prop("disabled", false);
  }
}

function selectAll(id) {
  checkboxes = $(".trackCheckbox");
  select_btn = $("#select_all_btn")[0];

  if (
    document.getElementById("existingPlaylist").innerHTML === "Songs added" &&
    id !== "liked songs"
  ) {
    document.getElementById("existingPlaylist").innerHTML = "This Playlist";
  }
  if (document.getElementById("newPlaylist").innerHTML === "Songs added") {
    document.getElementById("newPlaylist").innerHTML = "New playlist";
  }

  if (select_btn.value === "select all") {
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = true;
    }

    localStorage.setItem("checkboxCount", checkboxes.length);

    $("#selected_songs").html(checkboxes.length + " songs selected");
    select_btn.value = "deselect all";
    select_btn.innerHTML = "Deselect all";

    if (id !== "liked songs") {
      $("#existingPlaylist").prop("disabled", false);
    }
    $("#newPlaylist").prop("disabled", false);
  } else {
    for (let i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = false;
    }

    localStorage.setItem("checkboxCount", 0);

    $("#selected_songs").html(0 + " songs selected");
    select_btn.value = "select all";
    select_btn.innerHTML = "Select all";

    $("#existingPlaylist").prop("disabled", true);
    $("#newPlaylist").prop("disabled", true);
  }
}

function addToPlaylist(playlist, playlist_name) {
  checkboxes = $(".trackCheckbox");
  tracks = [];

  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked === true) {
      tracks.push(checkboxes[i].value);
    }
  }

  if (playlist === "new") {
    $("#newPlaylist").prop("disabled", true);
    $("#newPlaylist").html("Pending");
  } else {
    $("#existingPlaylist").prop("disabled", true);
    $("#existingPlaylist").html("Pending");
  }

  $.ajax({
    url: "/add_to_playlist",
    type: "POST",
    data: {
      playlist: playlist,
      playlist_name: playlist_name,
      tracks: JSON.stringify(tracks),
    },
    success: function () {
      if (playlist === "new") {
        $("#newPlaylist").prop("disabled", true);
        $("#newPlaylist").html("Songs added");
      } else {
        $("#existingPlaylist").prop("disabled", true);
        $("#existingPlaylist").html("Songs added");
      }
    },
    error: function () {
      if (playlist === "new") {
        $("#newPlaylist").prop("disabled", true);
        $("#newPlaylist").html("Adding failed");
      } else {
        $("#existingPlaylist").prop("disabled", true);
        $("#existingPlaylist").html("Adding failed");
      }
    },
  });
}
