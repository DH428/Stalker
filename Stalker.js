const request = require('request');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require("path");
const spawner = require('child_process');
const express = require("express");

let debug_log_path = "logs";
let cookie_path = "cookie.txt";
let downloader_file = "downloader.js"; //contains the script to download streams, subprocess calls this with parameters
let channel_list_file = "channels.txt";

class YTC{
    constructor(url_channel, high_prio=false){
        this.url_channel = url_channel;
        this.url_latest_vid;
        this.channel_name;

        this.high_prio = high_prio; //high prio vods will be deleted much later
        this.sleep_time = 0; //changes depending on vid status (no vid/sceduled/live) in sec
        this.video_details = {}; //updated by getYTInfo()

        this.vod_path; //... well its the path where the vods will be saved
 
        this.subprocess = false; //used as refference to the downloading subprocess for monitoring

        this.first_run = true;
        
        this.flatline = false; //"kills" object if true

        this.currently_correcting = [];

        this.log_messages = [];
        this.log_limit = 5;

        this.main();
    }

    //timeout, pause ... idk ... just give this object some rest, ok?
    async sleep(t) { //t in sec
        await new Promise(resolve => setTimeout(resolve, t*1000)); //ms -> sec
    }

    //interpretes filecontent as cookie, hopefully u didnt mess it up, usually if the cookie is incorrect, youtube will ignore it ... i think, just copy paste it from browser dev tools
    readCookie(path, dl=false){
        //lazy, using another dl prog
        if(dl){
            if (!fs.existsSync("cookied.txt")) {
                fs.writeFile("cookied.txt", "", () => {});
                return false;
            }

            return "./cookied.txt";
        }
        
        //a cookie for a cookie ... u consent for cookie placement from youtube, if cookie is missing you will be shown an "accept cookies" template, thats what this pseudo_cookie garbage is for
        let pseudo_cookie = `CONSENT=YES+srp.gws-20210608-0-RC1.de+FX+${Math.floor(Math.random()*(999-100+1)+100)}`; //not sure why i need some 3 digit rng number ... but idc

        //i assume that, if channel is important/high_prio, additional content was purchased -> no user cookie, no special content
        //got a lot of unskippable ads after using this script for a bit, im sure youtube tracks activity and we dont want youtube to notice us right?
        if(!this.high_prio){
            return pseudo_cookie;
        }

        try{
            let file_content = fs.readFileSync(path, 'utf8');
            
            if(!file_content){
                return pseudo_cookie
            }

            return file_content;
        }catch(e){
            fs.writeFile(path, "", () => {});
            logger(`'${path}' created, to access purchased content, copy paste your yt cookie in there`, this.channel_name, "INFO", this);
            return pseudo_cookie;
        }
    }

    //returns first (usually the latest/main video is the first match) yt video link found in the provided html body
    awesomeCrawler(html){
        let serach_for = /\/watch\?v=[^"]*/;
        return "https://youtube.com" + html.match(serach_for)[0];
    }

    //recorded livestreams don't have any headers/footers (i think) and most of the players can't do shit witout them (bless vlc), this basically copies the vod and (thanks to smort) ffmpeg adds the missing stuff  
    async fixRecordedStreams(){
        let recorded_vod_path = this.vod_path + "/recorded/";

        fs.readdir(recorded_vod_path, (err, files) => {
            if(err){
                logger(`can't read directory '${recorded_vod_path}'`, this.channel_name, "ERROR", this);
            }else{
                files.forEach((file_name) => {
                    let file_path = recorded_vod_path + file_name;

                    if(fs.statSync(file_path).size <= 1){
                        logger(`removing empty file '${file_path}'`, this.channel_name, "", this);
                        fs.unlink(file_path, (err) => {
                            if(err){
                                logger(`can't remove '${file_path}', error: '${err}'`, this.channel_name, "ERROR", this);
                            }
                        });
                    }else{
                        logger(`spawning corrector for '${file_name}'`, this.channel_name, "", this);

                        let full_vod_path = this.vod_path + "/" + file_name;

                        if(this.currently_correcting.hasOwnProperty(full_vod_path)){
                            logger(`corrector for '${file_name}' already working ...`, this.channel_name, "", this);
                            return;
                        }

                        this.currently_correcting[full_vod_path] = true;
                        let corrector = spawner.spawn("ffmpeg", ["-err_detect", "ignore_err", "-i", file_path, "-c", "copy", full_vod_path, "-y"]);
                        
                        corrector.stdout.setEncoding('utf8');
                        corrector.stdout.on('data', function(data) {
                            logger(`'${file_name}' stdout: ${data}`, "corrector_output",  "", this);
                        });
        
                        corrector.stderr.setEncoding('utf8');
                        corrector.stderr.on('data', function(data) {
                            logger(`'${file_name}' !! stderr: ${data}`, "corrector_output",  "", this);
                        });
                        
                        corrector.on('message', (message) => {
                            logger(`corrector threw message: '${message}' (${file_name})`, this.channel_name,  "", this);
                        });
                        
                        corrector.on('data', (data) => {
                            logger(`corrector threw data?: '${data}' (${file_name})`, this.channel_name,  "", this);
                        });

                        corrector.on('error', (err) => {
                            logger(`corrector threw error: '${err}' (${file_name})`, this.channel_name, "ERROR", this);

                            try{
                                corrector.kill();
                            }catch(e){
                                logger(`corrector could't be killed (${e})`, this.channel_name,  "", this);
                            }

                            if(this.currently_correcting.hasOwnProperty(full_vod_path)){
                                delete this.currently_correcting[full_vod_path];
                            }
                        });
                        corrector.on('close', (code, sig) => {
                            if(code){
                                logger(`corrector finished with errors for '${file_path}' (code: ${code} sig: ${sig})`, this.channel_name, "ERROR", this);
                            }else{
                                logger(`corrector finished for '${file_path}' (code: ${code} sig: ${sig})`, this.channel_name,  "", this);
                                logger(`deleting '${file_path}'`, this.channel_name,  "", this);
                                fs.unlink(file_path, (err) => {
                                    if(err){
                                        logger(`can't remove '${file_path}', error: '${err}'`, this.channel_name, "ERROR", this);
                                    }
                                });
                            }

                            try{
                                corrector.kill();
                            }catch(e){
                                logger(`corrector could't be killed (${e})`, this.channel_name,  "", this);
                            }

                            if(this.currently_correcting.hasOwnProperty(full_vod_path)){
                                delete this.currently_correcting[full_vod_path];
                            }
                        });

                        // corrector.on('exit', (code) => {
                        //     logger(`corrector exited with code ${code}`,  "", this);
                        // });
                    }
                });
            }
        });
    }

    //like awesomeCrawler ... but better ... i think ... returns url of the latest vod/stream from provided community tab body
    returnLatestComVid(body){
        let stuff = JSON.parse(body.match(/(?<=var ytInitialData = )(.*)(?=;<\/script>)/g)[0].replace(/(\r\n|\n|\r)/g, ""));

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
            logger(`cant find member tab for '${(this.channel_name ? this.channel_name : this.url_channel)}'`, (this.channel_name ? this.channel_name : ""), "WARNING", this);
        }else{
            for (let tab in stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"]){
                //simple text posts dont contain ["backstageAttachment"] in json/dict/key value pair thingy or whatever its called
                try{
                    //unarchived/private(/img) returs undefined
                    if(!stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"]){
                        continue;
                    }

                    return "https://youtube.com/watch?v=" + stuff["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][member_tab_index]["tabRenderer"]["content"]["sectionListRenderer"]["contents"][1]["itemSectionRenderer"]["contents"][tab]["videoRenderer"]["videoId"];
                }catch{}
            }
        }
    
        return false;
    }

    //returns a yt link of the latest video on channel, false if crawler didn't found a video (prob wrong page or no connectiont)
    async getLatestVidUrl(url_channel_, com_post=false){
        return await new Promise(async (resolve, reject) => {
            let info = false;
            let warning = false;
            let c = 0;
            let got_data = false;
            let sleep_time = 10;

            while(!got_data){
                if(this.flatline){
                    resolve();
                }

                await request({
                    url:url_channel_ + (com_post ? "/membership" : "/live"),
                    headers: {
                        'cookie': this.readCookie(cookie_path)
                    }
                }, (err, response, body) => {
                    try{
                        let vid_url = com_post ? this.returnLatestComVid(body) : this.awesomeCrawler(body)

                        if(info){
                            logger(`successfully retrieved latest vod link of '${(this.channel_name ? this.channel_name : url_channel_)}' after ${c} retries`, this.channel_name ? this.channel_name : "",  "", this);
                        }

                        got_data = true;
                        resolve(vid_url);                        
                    }catch(e){
                        if(!info){
                            logger(`failed to get data for '${(this.channel_name ? this.channel_name : url_channel_)}' (${e})`, this.channel_name ? this.channel_name : "", "ERROR", this);
                            info = true;
                        }
                        c++;
                    }
                });

                if(c>100 && !warning){
                    warning = true;
                    logger(`--> !!! '${(this.channel_name ? this.channel_name : url_channel_)}' cant be reached, please check your internet connection !!! <---`, this.channel_name ? this.channel_name : "", "WARNING", this);
                    sleep_time = 600;
                }

                await this.sleep(sleep_time);
            }
        });
    }

    //returns vid info object
    async getYTInfo(url){
        let cache;
        let data;
        let info = false;
        let c = 0;
        let d = 0;
        let sleep_time = 10;
        let prev_url = url;

        while(true){
            await this.sleep(sleep_time);

            data = {requestOptions:{headers:{cookie: this.readCookie(cookie_path)}}};

            try{
                cache = await ytdl.getInfo(url, data);
                break;
            }catch(e){
                if(e.statusCode == 410 || e.stack.includes("miniget")){
                    if(e.stack.includes("miniget")){
                        logger(`miniget err ... is ... is this age restricted '${url}'?`, this.channel_name ? this.channel_name : "",  "", this);
                    }else{
                        logger(`no miniget err but still exception: ${e}`, this.channel_name ? this.channel_name : "", "WARNING", this)
                    }

                    sleep_time = 300;
                }

                if(!info){
                    logger(`failed to get latest data of '${url}' (${e})`, this.channel_name ? this.channel_name : "", "WARNING", this);
                    
                    info = true;
                }

                c++;
                d++;
            }

            //prevents infinite loop, if vod get privated/deleted/unavailable
            if(d>10){
                if(this.flatline){
                    return [];
                }

                logger(`too many retries, while trying to get latest vod info of '${url}', getting new latest vod url instead`, this.channel_name ? this.channel_name : "", "ERROR", this);
                this.url_latest_vid = await this.getLatestVidUrl(this.url_channel, false);
                url = this.url_latest_vid;
                d = 0;
            }
        }

        if(info){
            logger(`successfully retrieved vod info of '${url}'${url != prev_url ? ` (failed url: '${prev_url}')` : ""} after ${c} retries`, this.channel_name,  "", this);
        }

        //bacause of some special chars in the name, it created a funni folder/path and broke my windows ... it was fixable but unnecessary ..
        cache["videoDetails"]["ownerChannelName"] = cache["videoDetails"]["ownerChannelName"].replace(/[^a-zA-Z0-9 ]/g, "").trim();
        //will this break?
        //cache["videoDetails"]["title"] = cache["videoDetails"]["title"].replace(/[^a-zA-Z0-9 ]/g, "").trim();
        cache["videoDetails"]["title"] = cache["videoDetails"]["title"].replace(/\\|\/|:|\*|\?|"|<|>|\|/g, "_").trim();

        cache["videoDetails"]["title"] = cache["videoDetails"]["title"] ? cache["videoDetails"]["title"] : "empty_string";
        cache["videoDetails"]["ownerChannelName"] = cache["videoDetails"]["ownerChannelName"] ? cache["videoDetails"]["ownerChannelName"] : "empty_string";

        return cache["videoDetails"]; //dont need more, crucial info is in "videoDetails"
    }

    //depending on posts in community tab and videos tab, updates this.url_latest_vid and this.video_details accordingly
    async getLatestVidInfo(url_channel){
        //st (st from 1st (idk why, give me some break)) will always return a vod/stream link -> st will be prioritized
        let st_latest_vid = await this.getLatestVidUrl(url_channel, false); // /live
        let st_vid_info = await this.getYTInfo(st_latest_vid);
        
        //some stuff doesnt have basic infos idk why, just filling with some dummy values, so that it won't crash while trying to access undefined stuff
        try{
            st_vid_info["liveBroadcastDetails"]["isLiveNow"];
        }catch{
            st_vid_info["liveBroadcastDetails"] = {"isLiveNow":false, "startTimestamp":"2000-01-01T00:00:00+00:00", "endTimestamp":"2000-01-01T00:00:00+00:00"};
        }

        if(st_vid_info["liveBroadcastDetails"]["isLiveNow"]){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }

        //low priority -> no cookie -> no purchased extra content
        if(!this.high_prio){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }

        //(again nd for 2nd and i still dont know why i named it like this)
        let nd_latest_vid = await this.getLatestVidUrl(url_channel, true); // latest community tab vod/stream or false if nothing found
        let nd_vid_info = nd_latest_vid ? await this.getYTInfo(nd_latest_vid) : false;

        if(!nd_latest_vid){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }

        if(typeof nd_vid_info["liveBroadcastDetails"] === "undefined"){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }

        if(typeof nd_vid_info["liveBroadcastDetails"]["startTimestamp"] === "undefined"){
            nd_vid_info["liveBroadcastDetails"]["startTimestamp"] = false; //new Date(new Date().getTime()-1*60000).toISOString();
            nd_vid_info["liveBroadcastDetails"]["endTimestamp"] = false;

            if(typeof nd_vid_info["liveBroadcastDetails"]["isLiveNow"] === "undefined"){
                nd_vid_info["liveBroadcastDetails"]["isLiveNow"] = false;
            }

            this.url_latest_vid = nd_latest_vid;
            this.video_details = nd_vid_info;
            return;
        }

        if(nd_vid_info["liveBroadcastDetails"]["isLiveNow"]){
            this.url_latest_vid = nd_latest_vid;
            this.video_details = nd_vid_info;
            return;
        }
        
        let time_now_unix = Math.floor(new Date().getTime()/1000);
        let st_start_unix = Math.floor(new Date(st_vid_info["liveBroadcastDetails"]["startTimestamp"]).getTime()/1000);
        let nd_start_unix = Math.floor(new Date(nd_vid_info["liveBroadcastDetails"]["startTimestamp"]).getTime()/1000);

        //prioritize st if nd is in past
        if(time_now_unix - nd_start_unix >= 3600){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }

        //both timestamps are in future, choosing smaller positive (in future) delta time value
        if(st_start_unix - time_now_unix < nd_start_unix - time_now_unix && st_start_unix > time_now_unix && nd_start_unix > time_now_unix){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }else if(nd_start_unix - time_now_unix < st_start_unix - time_now_unix && st_start_unix > time_now_unix && nd_start_unix > time_now_unix){
            this.url_latest_vid = nd_latest_vid;
            this.video_details = nd_vid_info;
            return;
        }

        //one future timesamp
        if(st_start_unix > time_now_unix){
            this.url_latest_vid = st_latest_vid;
            this.video_details = st_vid_info;
            return;
        }else{
            this.url_latest_vid = nd_latest_vid;
            this.video_details = nd_vid_info;            
            return;
        }
    }

    //creates the path for vods, depends on provided information (like channel name or prio)
    createPath(channel_name_, prio_){
        let root_path = __dirname + "/vods/";

        //ik recursion could solve this better, but me too smoll brain
        //1st run: creates the root folder (vods/),
        //2nd run: creates the sub folder (vods/high/ / vods/low/),
        //3rd run: creates sub, sub folder with channel name (vods/*/channel_name/)
        //4th run: creates the recorded folder for fixing streams after channel goes offline (vods/*/channel_name/recorded/)
        for(let i = 0; i <= 3; i++){ 
            switch (i){
                case 1:
                    root_path += prio_ ? "high/" : "low/";
                    break;
                case 2:
                    root_path += channel_name_;
                    this.vod_path = root_path;
                    root_path += "/";
                    break;
                case 3:
                    root_path += "recorded/"
                    break;
            }

            if(!fs.existsSync(root_path)){
                fs.mkdirSync(root_path, function(err){
                    if(err){
                        logger(`couldn't create '${root_path}' dir (${err})`, this.channel_name, "ERROR", this);
                    }else{
                        logger(`'${root_path}' dir was created`, this.channel_name,  "", this);
                    }
                });
            }else{
                logger(`'${root_path}' dir already exists`, this.channel_name,  "", this);
            }
        }
    }

    //checks if required file for downloading exists; file is called in a subprocees and is beeing monitored (ytdl-core crashes sometime, that what the monitoring is for)
    createDlFile(){
        if (fs.existsSync(downloader_file)) {
            return;
        }

        let content = `
            const ytdl = require('ytdl-core');
            const fs = require('fs');
            let args = process.argv.slice(2);
            function recordYTLS(url, title, cookie=''){
                ytdl(url, {
                    requestOptions:{
                        headers:{
                            cookie:cookie
                        }
                    }
                }).pipe(fs.createWriteStream(title + '.mp4'));
            }
            recordYTLS(args[0], args[1], args[2]);
        `;

        fs.writeFile(downloader_file, content, () => {});
    }

    //renaming to not overwrite already existing vods
    renameFile(title){
        let i = 1;
        let info = false;
        let new_title = title;

        while(fs.existsSync(this.vod_path + "/" + new_title + ".mp4") || fs.existsSync(this.vod_path + "/recorded/" + new_title + ".mp4")){
            if(!info){
                info = true;
                logger(`'${title}' already exists, renaming ...`, this.channel_name,  "", this);
            }

            new_title = title + " " + i;
            i++;
        }

        return new_title;
    }

    //spawn subprocess that is responsible for stream recording, appends listener to know, when proccess dies/finishes
    async subprocessSpawner(url, title, data){
        this.createDlFile();

        title = this.renameFile(title);

        logger(`started recording ${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}'`, this.channel_name,  "", this);
        
        this.subprocess = spawner.spawn("node", [downloader_file, url, this.vod_path + "/recorded/" + title, data]);
        
        this.subprocess.on('message', (message) => {
            logger(`recorder of '${title}' threw a message: '${message}'`, this.channel_name,  "", this);
        });

        this.subprocess.on('data', (data) => {
            logger(`recorder of '${title}' threw data: '${data}'`, this.channel_name,  "", this);
        });

        this.subprocess.on('error', (err) => {
            logger(`recorder of '${title}' threw an error: '${err}'`, this.channel_name, "ERROR", this);
        });

        this.subprocess.on('close', (code, sig) => {
            if(code){
                logger(`recorder of '${title}' stopped with errors: '${code}': ${sig}`, this.channel_name, "ERROR", this);
            }else{
                logger(`recorder of '${title}' stopped: '${code}': ${sig}`, this.channel_name,  "", this);
            }
            
            this.fixRecordedStreams();
            this.subprocess = false;
        });

        //try{
        //    spawner.spawn("sudo", ["renice -11 " + this.subprocess.pid]);
        //}catch(e){
        //    logger("failed to change prio of " + title + " (" + e + ")")
        //}
    }

    //just some garbage ignore
    async subprocessSpawner2(url, title, data){
        return spawner.spawn("youtube-dl", ["-o", this.vod_path + "/recorded/" + title, url, data]);
    }

    unixFormatCreator(time_stamp, unix_in_s=false){
        let a = unix_in_s ? new Date(time_stamp * 1000) : time_stamp;
    
        let hour = a.getUTCHours();
        let min = a.getMinutes();
        let sec = a.getSeconds();
    
        return (hour < 10 ? "0" + hour : hour) + ':' + (min < 10 ? "0" + min : min) + ':' + (sec < 10 ? "0" + sec : sec);
    }

    //creates required vod directory depending on channel url
    async firstRun(){
        let i = 0;

        while(true){
            if(i>3){
                logger(`failed to create dir for '${this.url_channel}', exiting ...`, type="ERROR", this);
                process.exit();
            }

            await this.getLatestVidInfo(this.url_channel);

            if(!this.url_latest_vid || !this.video_details){
                await this.sleep(10);
                i++;
                continue;
            }
            
            break;
        }

        this.channel_name = this.video_details["ownerChannelName"];
        await this.createPath(this.video_details["ownerChannelName"], this.high_prio);
    }

    //all the logic for this object to work properly (at least i hope this works properly ...)
    async main(){
        await this.firstRun();        

        while(true){
            if(this.flatline){
                logger(`killing ${this.channel_name ? this.channel_name : this.url_channel}`, this.channel_name ? this.channel_name : "", "INFO");

                await this.sleep(5);

                let c = 0;
                while(this.subprocess){
                    if(!info){
                        logger(`${this.channel_name ? this.channel_name : this.url_channel}: recorder still running... waiting`, this.channel_name ? this.channel_name : "", "INFO");
                    }

                    if(c>30){
                        logger(`${this.channel_name ? this.channel_name : this.url_channel}: ignoring recorder...`, this.channel_name ? this.channel_name : "", "INFO");
                        break;
                    }

                    try{
                        this.subprocess.kill("SIGTERM");
                    }catch(e){}

                    c += 1;
                    await this.sleep(1);
                }

                if(c){
                    logger(`${this.channel_name ? this.channel_name : this.url_channel}: stopped recorder after ${c} retries`, this.channel_name ? this.channel_name : "", "INFO");
                }

                await this.sleep(5);

                c = 0;
                while(this.currently_correcting.length > 0){
                    if(!c){
                        logger(`${this.channel_name ? this.channel_name : this.url_channel}: corrector still running... waiting...`, this.channel_name ? this.channel_name : "", "INFO");
                    }
                    c += 1;
                    
                    if(c>30){
                        logger(`${this.channel_name ? this.channel_name : this.url_channel}: ignoring corrector...`, this.channel_name ? this.channel_name : "", "INFO");
                        break;
                    }

                    await this.sleep(1);
                }
                
                logger(`'oh, im die, thank you forever' - ${this.channel_name ? this.channel_name : this.url_channel}`, this.channel_name ? this.channel_name : "", "INFO");
                return;
            }

            await this.sleep(this.sleep_time);

            //firstRun() also gets the vod/channel info, so no need to do it twice in row
            if(!this.first_run){
                await this.getLatestVidInfo(this.url_channel);
            }else{
                this.first_run = false;
            }

            if(!this.video_details["liveBroadcastDetails"]["isLiveNow"]){
                //vod check
                if(this.video_details["liveBroadcastDetails"]["startTimestamp"] && this.video_details["liveBroadcastDetails"]["endTimestamp"]){
                    this.sleep_time = 300;
                    logger(`'${this.video_details["title"]}' is ${this.channel_name}'s vod, sleeping for ${this.sleep_time}s`, this.channel_name,  "", this);
                    continue;
                }

                //schedule check
                if(this.video_details["liveBroadcastDetails"]["startTimestamp"] && !this.video_details["liveBroadcastDetails"]["isLiveNow"]){
                    let time_unix_now = Math.floor(new Date().getTime()/1000); //in seconds
                    let time_unix_scheduled = Math.floor(new Date(this.video_details["liveBroadcastDetails"]["startTimestamp"]).getTime()/1000); //in seconds
                    let time_delta = time_unix_scheduled - time_unix_now; //in seconds until start of scheduled stream, 300 is just some tolerance

                    if(time_delta > 432000){ //5 days
                        this.sleep_time = 300;
                        logger(`'${this.video_details["title"]}' on ${this.channel_name}'s channel will start in ${time_delta}s and simply has less value, sleeping for ${this.sleep_time}s`, this.channel_name,  "", this);
                        continue;
                    }else if(time_delta > 600){
                        this.sleep_time = 600;
                    }else if(time_delta < 600 && time_delta > 20){
                        this.sleep_time = time_delta+10;
                    }else{
                        this.sleep_time = 20;
                        logger(`${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}' should start soon, sleeping for ${this.sleep_time}s`, this.channel_name,  "", this)
                        continue;
                    }

                    logger(`${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}' will start in ${time_delta}s, sleeping for ${this.sleep_time}s`, this.channel_name,  "", this)
                    continue;
                }

                //startTimestamp is empty, if scheduled time is reached and stream is still offline
                if(!this.video_details["liveBroadcastDetails"]["startTimestamp"] && !this.video_details["liveBroadcastDetails"]["endTimestamp"]){
                    this.sleep_time = 20;
                    logger(`${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}' should start soon, sleeping for ${this.sleep_time}s`, this.channel_name,  "", this)
                    continue;
                }
            }else{
                //stream recording
                logger(`${this.video_details["ownerChannelName"]} is streaming '${this.video_details["title"]}'`, this.channel_name,  "", this)

                let started_recording = Math.floor(new Date().getTime()/1000);
                this.subprocessSpawner(this.url_latest_vid, this.video_details["title"], this.readCookie(cookie_path));

                while(this.video_details["liveBroadcastDetails"]["isLiveNow"]){
                    for(let i = 0; i < 10; i++){
                        if(!this.subprocess || this.flatline){                            
                            break;
                        }

                        await this.sleep(10);
                    }

                    if(!this.subprocess || this.flatline){                            
                        break;
                    }

                    //currently ytdl-core doesnt know (and i dont know how to make it know), when stream ends, so you have to check "manually" and kill the process if needed
                    this.video_details = await this.getYTInfo(this.url_latest_vid);
                }

                let stopped_recording = Math.floor(new Date().getTime()/1000);
                logger(`${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}' ended (duration: ${this.unixFormatCreator(stopped_recording-started_recording, true)})`, this.channel_name,  "", this);

                //killing subprocess "manually" if stream ends
                try{
                    this.subprocess.kill();
                    this.subprocess = false;
                }catch{}

                //check if stream continues later on, for 15 min (prevents 300s sleep scycle; tolerance for fe: short internet outage/youtube beeing youtube/streamer disconnected)
                for(let i = 0; i < 45; i++){ 
                    if(this.flatline){
                        break;
                    }

                    await this.getLatestVidInfo(this.url_channel);

                    if(this.video_details["liveBroadcastDetails"]["isLiveNow"]){
                        this.sleep_time = 0;
                        logger(`${this.video_details["ownerChannelName"]}'s stream '${this.video_details["title"]}' continues ...`, this.channel_name,  "", this);
                        this.first_run = true;
                        break;
                    }

                    await this.sleep(20);
                }
            }
        }
    }
}

async function sleep(t) { //t in sec
    await new Promise(resolve => setTimeout(resolve, t*1000));
}

//its a logger ... what u expect ... appends new line to file
//format: <timestamp> <some usefull/useless info>
function logger(msg, log_name="", type="", ytc_object_ref=false) {
    if(!fs.existsSync(debug_log_path)){
        fs.mkdir(debug_log_path, function(err){
            if(err){
                console.log(`couldn't create '${debug_log_path}' (err: ${err})`);
            }else{
                console.log(`'${debug_log_path}' was created`);
            }
        });
    }

    let time_stamp = new Date();

    //format; yyyy.mm.dd hh:mm:ss.sss
    let ms = time_stamp.getMilliseconds() < 100 ? ("0" + (time_stamp.getMilliseconds() < 10 ? ("0" + time_stamp.getMilliseconds()) : time_stamp.getMilliseconds())) : time_stamp.getMilliseconds();
    let sec = time_stamp.getSeconds() < 10 ? ("0" + time_stamp.getSeconds()) : time_stamp.getSeconds();
    let min = time_stamp.getMinutes() < 10 ? ("0" + time_stamp.getMinutes()) : time_stamp.getMinutes();
    let hour = time_stamp.getHours() < 10 ? ("0" + time_stamp.getHours()) : time_stamp.getHours();
    let day = time_stamp.getDate() < 10 ? ("0" + time_stamp.getDate()) : time_stamp.getDate();
    let month = (time_stamp.getMonth()+1) < 10 ? ("0" + (time_stamp.getMonth()+1)) : (time_stamp.getMonth()+1);
    let year = time_stamp.getFullYear();

    time_stamp = `${year}.${month}.${day} ${hour}:${min}:${sec}.${ms}`;

    msg = type ? `${type}: ${msg}`: msg;

    if(!log_name || log_name.includes("//")){
        msg = log_name.includes("//") ? `${msg} '${log_name}'` : msg;
        log_name = "debug";
    }

    if(ytc_object_ref && ytc_object_ref.log_messages){
        ytc_object_ref.log_messages.unshift(`${time_stamp}: ${msg}`);
        ytc_object_ref.log_messages = ytc_object_ref.log_messages.slice(0, ytc_object_ref.log_limit)
    }

    // console.log("--logger-- " + msg);
    fs.appendFile(debug_log_path + "/" + log_name + ".log", `${time_stamp}: ${msg}\n`, function (err){});
    fs.appendFile(debug_log_path + "/" + "debug_timeline.log", `${time_stamp}: ${msg}\n`, function (err){}); //easier timing overview

    if(type && log_name != "debug"){
        fs.appendFile(debug_log_path + "/" + "debug.log", `${time_stamp}: ${type} IN '${log_name ? log_name : "idk"}': '${msg}'\n`, function (err){});
    }
}

//returns all file paths from dir path (subfolder included)
function getAllFiles(dirPath, arrayOfFiles) {
    try{
        files = fs.readdirSync(dirPath);
    }catch(e){
        logger(`couldn't get all files (${e})`, type="ERROR");
        return [];
    }

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
        }
    })

    return arrayOfFiles;
}

//removes old logs
async function logManager(){
    while(true){        
        let time_now_unix_sec = Math.floor(new Date().getTime()/1000);
        let dir = "logs";

        fs.readdir(dir, (err, files) => {
            let to_delete = [];

            if (err) {
                logger(`couldn't get all files in '${debug_log_path}' (err: ${err})`, type="ERROR");
            }

            files.forEach(file => {
                let btms;

                try{
                    btms = fs.statSync(dir+"/"+file)["birthtimeMs"];
                }catch(e){
                    return;
                }

                if((dir+"/"+file).search(/.old/g) !== -1 && (time_now_unix_sec - btms/1000 > 3600*48)){ //2days
                    to_delete.push(dir+"/"+file);
                }else if((dir+"/"+file).search(/.old/g) === -1 && fs.statSync(dir+"/"+file).size/1024 > 1000){ //1000kb
                    logger(`renaming log '${dir}/${file}'`);

                    fs.rename(dir+"/"+file, dir+"/"+file + ".old", function(err) {
                        if(err){
                            logger(`couldn't rename '${dir}/${file}' (err: ${err})`, type="ERROR")
                        };
                    });
                }
            });

            if(to_delete.length > 0){
                logger(`removing old logs: '${to_delete}'`);
                for(let i in to_delete){
                    fs.unlinkSync(to_delete[i]);
                }
            }
        });

        await sleep(3600); //1h
    }
}

//removes old vods, lifespan based on prio
async function vodManager(){
    while(true){            
        let list = getAllFiles("vods");
        let time_now = Math.floor(new Date().getTime()/1000);
        
        //checking creation date of every vod in "vods/" and removing, if older than, based on prio, <age>
        for(let i in list){
            if(!list[i].includes(".mp4")){
                continue;
            }
        
            let bd = Math.floor(new Date(fs.statSync(list[i])["atimeMs"]).getTime()/1000);
        
            //search in provided path for low/high dir, not elegant, because stuff like "high/some_stuff/vods/low/not_so_funni_vtuber" will be missunderstood
            if(list[i].includes("/high/")){
                if(time_now-bd > 6*2629800){ //months in sec
                    logger(`deleting vod (hp): '${list[i]}'`);
                    fs.unlinkSync(list[i]);
                }
            }else if(list[i].includes("/low/")){
                if(time_now-bd > 3*2629800){ //month in sec
                    logger(`deleting vod (lp): '${list[i]}'`);
                    fs.unlinkSync(list[i]);
                }
            }
        }

        await sleep(3600); //1h
    }
}

//returns dict {"https[...]":false} (or true for highprio)
function GetChannels(){
    let stuff = {};

    try{
        let file_content = fs.readFileSync(channel_list_file, 'utf8');

        if(!file_content){
            logger(`${channel_list_file} is empty`, type="WARNING");
            process.exit();
        }

        let cache = file_content.split("\n");

        for(let i in cache){
            cache[i] = cache[i].replace(/(\r)/g, '');

            // filter out comments and invalid links
            if(cache[i].search(/\/\//g) == 0 ||
                cache[i].search(/(?:https|http)\:\/\/(?:[\w]+\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-zA-Z0-9\-_]{1,})/g) == -1
            ){
                cache[i] = "";         
            }
        }
        
        cache = cache.filter(e => e);

        for(let i in cache){
            if(cache[i].split(" ")[1].search(/!/g) == -1){
                stuff[cache[i].replace(/(\r)/g, '').split(" ")[0]] = false;
            }else{
                stuff[cache[i].split(" ")[0]] = true;
            }
        }

    }catch{
        fs.writeFile(channel_list_file, "", () => {});
        logger(`${channel_list_file} was created, please add channel links and try again`);
        process.exit();
    }

    if(stuff.length < 1){
        logger(`${channel_list_file} doesn't contain valid urls`, type="WARNING");
        process.exit();
    }

    return stuff;
}

let object_array = {};
//manages objects based on entries in channel_list_file in realtime
async function objectManager(){
    while(true){
        let channel_list = GetChannels();
    
        //creates new ytc object based on entries in channel_list_file
        for(let i in channel_list){
            if(!(i in object_array)){
                object_array[i] = new YTC(i, channel_list[i]);
                logger(`created '${i}'`);
                await sleep(1); //some pause, so that youtube wont see this as a dos
            }
        }

        // //remove objects, which prio was changed in channel_list_file
        // for(let i in channel_list){
        //     if(object_array[i] !== channel_list[i]){
        //         logger(`prio changed for '${i}' to '${channel_list[i] ? "high" : "low"}'`);
        //         object_array[i].flatline = true;
        //         delete object_array[i];
        //     }
        // }

        //deletes object, if its channel link has been removed from channel_list_file
        for(let i in object_array){
            if(!(i in channel_list)){
                logger(`deleted '${i}'`);
                object_array[i].flatline = true;
                delete object_array[i];
            }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

function api(){
    var app = express();

    app.get('/', (req, res) => {
        return res.send(JSON.stringify(object_array));
    });

    app.listen("3001", () => {});
}

(async () => {
    logManager();
    vodManager();
    objectManager();
    api();
})();