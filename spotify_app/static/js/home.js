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