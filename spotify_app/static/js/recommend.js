$(document).ready(() => {
    localStorage.removeItem('audio')
    localStorage.setItem('checkboxCount', 0)

    // Marquee
    // Change playlist title
    var txt = $('#recommend_playlist_title')

    // Get width of text
    var html_txt = txt.html()
    var html_calc = '<span>' + html_txt + '</span>'

    $(txt).html(html_calc)
    var width = $(txt).find('span:first').width()
    $(txt).html(html_txt)

    // Add marquee class
    if (width > 200) {
        txt.css('width', `${width - 200}px`)
        txt.addClass('marquee')
    }
})

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
        document.getElementById('existingPlaylist').innerHTML = 'This Playlist'
    }
    if (document.getElementById('newPlaylist').innerHTML === 'Songs added') {
        document.getElementById('newPlaylist').innerHTML = 'New playlist'
    }

    if (select_btn.value === 'select all') {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = true
        }

        localStorage.setItem('checkboxCount', checkboxes.length)

        $('#selected_songs').html(checkboxes.length + ' songs selected')
        select_btn.value = 'deselect all'
        select_btn.innerHTML = 'Deselect all'

        $('#existingPlaylist').prop('disabled', false)
        $('#newPlaylist').prop('disabled', false)
    } else {
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false
        }

        localStorage.setItem('checkboxCount', 0)

        $('#selected_songs').html(0 + ' songs selected')
        select_btn.value = 'select all'
        select_btn.innerHTML = 'Select all'

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