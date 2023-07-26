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
            "error": "can't find member tab",
            "data": false
        }
    }
    
    let another_tab_index = -1;
    for(let i = 0; i < stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"].length; i++){
        try{
            if(stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][i]["itemSectionRenderer"]["contents"]){
                let found_inner_tab = false;
                for(let j = 0; j < stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][i]["itemSectionRenderer"]["contents"].length; j++){
                    try{
                        if(stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][i]["itemSectionRenderer"]["contents"][j]["videoRenderer"]){
                            found_inner_tab = true;
                            break;
                        }
                    }catch{}
                }

                if(found_inner_tab){
                    another_tab_index = i;
                    break;
                }
            }
        }catch{}
    }

    if(another_tab_index < 0){
        return {
            "error": "can't find another_tab_index",
            "data": false
        }
    }

    for (let tab in stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][another_tab_index]["itemSectionRenderer"]["contents"]){
        //simple text posts dont contain ["backstageAttachment"] in json/dict/key value pair thingy or whatever its called
        try{
            if(stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][another_tab_index]["itemSectionRenderer"]["contents"][tab]["backstagePostThreadRenderer"]["post"]["backstagePostRenderer"]["backstageAttachment"]["videoRenderer"]["videoId"]){
                return {
                    "error": false,
                    "data": "https://youtube.com/watch?v=" + stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][another_tab_index]["itemSectionRenderer"]["contents"][tab]["backstagePostThreadRenderer"]["post"]["backstagePostRenderer"]["backstageAttachment"]["videoRenderer"]["videoId"]
                };
                
            }
            //unarchived/private(/img) returs undefined
            if(!stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][another_tab_index]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"]){
                continue;
            }

            return {
                "error": false,
                "data": "https://youtube.com/watch?v=" + stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][another_tab_index]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"],
            };

        }catch{}
    }

    return {
        "error": false,
        "data": false
    };
}
