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

    let member_tab_index = -1;

    for(let i = 0; i < stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"].length; i++){
        try{
            if(stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][i]["tabRenderer"]["tabIdentifier"] == "TAB_ID_SPONSORSHIPS"){
                member_tab_index = i;
                break;
            }
        }catch{}
    }

    if(member_tab_index < 0){
        return {
            "error": "cant find member tab",
            "data": false
        }
    }
    
    for (let tab in stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"]){
        //simple text posts dont contain ["backstageAttachment"] in json/dict/key value pair thingy or whatever its called
        try{
            //unarchived/private(/img) returs undefined
            if(!stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"]){
                continue;
            }

            return {
                "error": false,
                "data": "https://youtube.com/watch?v=" + stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"],
            };

        }catch{}
    }

    return {
        "error": false,
        "data": false
    };
}