$(document).ready(() => {
    localStorage.clear()
    localStorage.setItem('checkboxCount', 0)

    $('#playlist_search').on('input', (e) => {
        var input = $(e.target).val()
        var playlists = $('.playlist_container')

        for (let i = 1; i < playlists.length; i++) {
            var name = $(playlists[i]).attr('name')

            if (!input || input === name) {
                $(`[name="${name}"]`).show()
            } else {
                $(`[name="${name}"]`).hide()
            }
        }
    })
})


function _calculateScrollbarWidth() {
    document.documentElement.style.setProperty('--scrollbar-width', (window.innerWidth - document.documentElement.clientWidth) + "px");
  }
  // recalculate on resize
  window.addEventListener('resize', _calculateScrollbarWidth, false);
  // recalculate on dom load
  document.addEventListener('DOMContentLoaded', _calculateScrollbarWidth, false); 
  // recalculate on load (assets loaded as well)
  window.addEventListener('load', _calculateScrollbarWidth);


// Home
function playlistClick(playlistArr) {
    if (playlistArr.type === 'playlist') {
        var url = playlistArr.url
        var name = playlistArr.name
        var total = playlistArr.total
        var id = playlistArr.id
    } else {
        var url = '../static//images/liked_songs_cover.png'
        var name = 'Liked Songs'
        var total = playlistArr.total
        var id = 'liked songs'
    }
    
    $('#placeholder_cover').hide()
    $('#selected_playlist > img').attr("src", url) // Change image of selected playlist
    $('#selected_playlist > div > h5').html(name)
    $('#selected_playlist > div > p').html(total + ' songs')
    $('#scan_btn').attr("value", id).prop("disabled", false)
}

// Recommend
function playPreview(url) {
    const id = document.getElementById(url)
    const audio = id.getElementsByTagName('audio')[0]
    const btn = id.getElementsByTagName('i')[0]

    if (localStorage.getItem('audio') === url) {
        audio.pause()
        audio.currentTime = 0

        btn.classList.replace('bi-pause', 'bi-play-fill')

        localStorage.removeItem('audio')
        return
    } else if (localStorage.getItem('audio')) {
        const storedId = document.getElementById(localStorage.getItem('audio'))
        const storedAudio = storedId.getElementsByTagName('audio')[0]
        const storedBtn = storedId.getElementsByTagName('i')[0]

        storedAudio.pause()
        storedAudio.currentTime = 0

        storedBtn.classList.replace('bi-pause', 'bi-play-fill')

        localStorage.removeItem('audio')
    }
    audio.play()

    btn.classList.replace('bi-play-fill', 'bi-pause')

    localStorage.setItem('audio', url)
}

// On checkbox change
function checkboxChange(id) {
    var checkboxCount = localStorage.getItem('checkboxCount')

    if (document.getElementById('existingPlaylist').innerHTML === 'Songs added') {
        document.getElementById('existingPlaylist').innerHTML = 'Add to this Playlist'
    }
    if (document.getElementById('newPlaylist').innerHTML === 'Songs added') {
        document.getElementById('newPlaylist').innerHTML = 'Add to New playlist'
    }

    if (document.getElementById(id).checked === true) {
        localStorage.setItem('checkboxCount', ++checkboxCount)
    } else {
        localStorage.setItem('checkboxCount', --checkboxCount)
    }
    
    $('#selected_songs').html(checkboxCount + ' songs selected')

    if (checkboxCount === 0) {
        $('#existingPlaylist').prop('disabled', true)
        $('#newPlaylist').prop('disabled', true)
    } else {
        $('#existingPlaylist').prop('disabled', false)
        $('#newPlaylist').prop('disabled', false)
    }
}

function selectAll() {
    checkboxes = $('.trackCheckbox')
    select_btn = $("#select_all_btn")[0]

    if (document.getElementById('existingPlaylist').innerHTML === 'Songs added') {
        document.getElementById('existingPlaylist').innerHTML = 'Add to this Playlist'
    }
    if (document.getElementById('newPlaylist').innerHTML === 'Songs added') {
        document.getElementById('newPlaylist').innerHTML = 'Add to New playlist'
    }

    if (select_btn.value === 'select all') {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = true
        }

        localStorage.setItem('checkboxCount', checkboxes.length)

        $('#selected_songs').html(checkboxes.length + ' songs selected')
        select_btn.value = 'deselect all'
        select_btn.innerHTML = 'Deselect all songs'

        $('#existingPlaylist').prop('disabled', false)
        $('#newPlaylist').prop('disabled', false)
    } else {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false
        }

        localStorage.setItem('checkboxCount', 0)

        $('#selected_songs').html(0 + ' songs selected')
        select_btn.value = 'select all'
        select_btn.innerHTML = 'Select all songs'

        $('#existingPlaylist').prop('disabled', true)
        $('#newPlaylist').prop('disabled', true)
    }
}

function addToPlaylist(playlist) {
    checkboxes = $('.trackCheckbox')
    tracks = []

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked === true) {
            tracks.push(checkboxes[i].value)
        }
    }

    if (playlist === 'new') {
        $('#newPlaylist').prop('disabled', true)
        $('#newPlaylist').html('Pending')
    } else {
        $('#existingPlaylist').prop('disabled', true)
        $('#existingPlaylist').html('Pending')
    }

    $.ajax({
        url: '/addToPlaylist',
        type: 'POST',
        data: {
            playlist: playlist,
            tracks: JSON.stringify(tracks)
        },
        success: function() {
            if (playlist === 'new') {
                $('#newPlaylist').prop('disabled', true)
                $('#newPlaylist').html('Songs added')
            } else {
                $('#existingPlaylist').prop('disabled', true)
                $('#existingPlaylist').html('Songs added')
            }
        },
        error: function() {
            if (playlist === 'new') {
                $('#newPlaylist').prop('disabled', true)
                $('#newPlaylist').html('Adding failed')
            } else {
                $('#existingPlaylist').prop('disabled', true)
                $('#existingPlaylist').html('Adding failed')
            }
        }
    })
}

// Scroll Top button
$(document).ready(function() {
    $(window).scroll(function() {
      if ($(this).scrollTop() > 100) {
        $('#scrollTopBtn').fadeIn();
      } else {
        $('#scrollTopBtn').fadeOut();
      }
    });
    $('#scrollTopBtn').click(function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    });
  });