$(document).ready(() => {
    localStorage.clear()
})

function playlistClick(playlistArr) {
    var url = playlistArr.url
    var name = playlistArr.name
    var total = playlistArr.total
    var id = playlistArr.id
    console.log(url, name, total)

    $('#selected_playlist > img').attr("src", url) // Change image of selected playlist
    $('#selected_playlist > div > h5').html(name)
    $('#selected_playlist > div > p').html(total + ' songs')
    $('#scan_btn').attr("value", id).prop("disabled", false)
    
}

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