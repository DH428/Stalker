module.exports = (html) => {
    let stuff;

    try{
        stuff = JSON.parse(html.match(/(?<=var ytInitialData = )(.*)(?=;<\/script>)/g)[0].replace(/(\r\n|\n|\r)/g, ""));
    }catch(e){
        return {
            "error": e,
            "data": false
        };
    }

    let upcomming_link = false;
    try{
        for(let i = 0; i < stuff.contents.twoColumnBrowseResultsRenderer.tabs.length; i++){
            if(stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.title.toLowerCase() == "live"){
                for(let j = 0; j < stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents.length; j++){
                    for(let k = 0; k < stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.thumbnailOverlays.length; k++){
                        if(!upcomming_link){
                            upcomming_link = "https://youtube.com/watch?v=" + stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.videoId;
                        }
                        
                        try{
                            if(stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.thumbnailOverlays[k].thumbnailOverlayTimeStatusRenderer.style.toLowerCase() == "upcoming"){
                                upcomming_link = "https://youtube.com/watch?v=" + stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.videoId;
                            }

                            if(stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.thumbnailOverlays[k].thumbnailOverlayTimeStatusRenderer.style.toLowerCase() == "live"){
                                return {
                                    "error": false,
                                    "data": "https://youtube.com/watch?v=" + stuff.contents.twoColumnBrowseResultsRenderer.tabs[i].tabRenderer.content.richGridRenderer.contents[j].richItemRenderer.content.videoRenderer.videoId
                                };
                                
                            }
                        }catch(e){}
                    }
                }
            }
        }
    }catch(e){}

    return {
        "error": false,
        "data": upcomming_link
    };
}