$(document).ready(() => {
    localStorage.clear()
})

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

function addToPlaylist(playlist) {
    checkboxes = document.getElementsByClassName('trackCheckbox')
    tracks = []
    console.log(playlist)

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked === true) {
            tracks.push(checkboxes[i].value)
        }
    }

    $.ajax({
        url: '/addToPlaylist',
        type: 'POST',
        data: {
            playlist: playlist,
            tracks: JSON.stringify(tracks)
        }
    })
}

// Scroll Top button
scrollTopBtn = document.getElementById('scrollTopBtn')
window.onscroll = function() {scrollFunction()}

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollTopBtn.style.display = "block"
    } else {
        scrollTopBtn.style.display = "none"
    }
}

function scrollToTop() {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
}