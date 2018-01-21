$(document).ready(function () {

    /* Variables */

    // Ueer token for request
    var userToken = '';

    //Seeds
    var seeds = [];
    var activeSeeds = [];

    // Colony
    var home;

    /* Functions */

    // Get the user token and others stuff
    function autoload() {
        var url = "https://f24h2018.herokuapp.com/auth/local";

        var logInfos = {
            email : "ant1@viking.ant",
            password : "Thor"
        };

        $.ajax({
            type: "POST",
            url: url,
            data: logInfos,
            success: function (data) {
                userToken = data.token;

                getSeeds();
            },
            error: function (jqXHR, textStatus, errorThrown ) {
                console.log(errorThrown);

                // Log error and stop the process
                return false;
            }
        });
    }

    function getSeeds(){
        var url = "https://f24h2018.herokuapp.com/api/seeds/search";

        $.ajax({
            type: "GET",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function(data) {
                seeds = data;

                // Search for the home seed
                jQuery.each(seeds, function(i, val) {
                    if(val.active === true) {

                        if (val.type === "home")
                            home = val;
                        else
                            activeSeeds.push(val);
                    }
                });

                console.log(activeSeeds);
                jQuery.each(activeSeeds, function (i, val) {
                    createTrack(home, val, false);
                });

                getMyTracks();
            }
        });
    }

    function createTrack(startSeed, endSeed, back){
        var startSeedID;
        var endSeedID;
        var dir  = '';

        if(back) {
            startSeedID = endSeed['_id'];
            endSeedID =  startSeed['_id'];
            dir = "retour";
        } else {
            startSeedID = startSeed['_id'];
            endSeedID = endSeed['_id'];
            dir = "aller";
        }

        var url = "https://f24h2018.herokuapp.com/api/tracks";

        /* Uncomment this part if needed */

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : {
                'name' : 'Track ' + dir +' - '+startSeed.name + ' / ' + endSeed.name,
                // 'info' : 'TEST TEST TEST',
                'info' : '(VIKING) - Trajet de '+startSeed.name + ' à ' + endSeed.name,
                'startSeedId' : startSeedID,
                'endSeedId' : endSeedID
            },
            success: function (data) {

                if(!back)
                    createTrack(startSeed,endSeed,true);
            }
        });
    }

    function getMyTracks(){

        var url = "https://f24h2018.herokuapp.com/api/tracks/me";

        $.ajax({
            type: "GET",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function(data) {
                getTrackSeeds(data,false);
            }
        });
    }

    function getWays(track, back){

        // console.log(track);
        getTrackSeeds(track, back);
    }

    function getTrackSeeds(track,back){
        var url = 'https://f24h2018.herokuapp.com/api/seeds/'+track["endSeedId"];

        $.ajax({
            type: "GET",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function(data) {
                // console.log(data);
                var go = data;
                var url;
                if(!back)
                    url = 'http://router.project-osrm.org/route/v1/driving/'+getCoordonates(home)[1]+','+getCoordonates(home)[0]+';'+getCoordonates(data)[1]+','+getCoordonates(data)[0]+'?annotations=true';
                else
                    url = 'http://router.project-osrm.org/route/v1/driving/'+getCoordonates(go)[1]+','+getCoordonates(go)[0]+';'+getCoordonates(home)[1]+','+getCoordonates(home)[0]+'?annotations=true';

                $.ajax({
                    type: "GET",
                    url: url,
                    success: function (data) {
                        var nodes_ids = data.routes[0].legs[0].annotation.nodes;
                        getNodes(nodes_ids);
                        if(!back)
                            getTrackSeeds(track,true);
                    }
                });
            }
        });
    }

    function getCoordonates(seed) {
        return seed.location.coordinates;
    }

    function getNodes(nodes){
        var url = "https://lz4.overpass-api.de/api/interpreter";

        var nodes_string  = '';

        nodes_string = nodes.toString();

        console.log(nodes_string);

        var data = '[out:json];node(id:'+nodes_string+');out;';

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : data,
            success: function (data) {
                var nodes = data.elements;

                Jquery.each(nodes, function (i, val) {
                    setTrackPosition(val);
                });
            }
        });
    }

    function setTrackPosition(node){
        var url = "https://f24h2018.herokuapp.com/api/positions/bulk";

        var data = {
            "trackId": "576900a615cf52a849374947",
            "positions": [
                {
                    "lat": node.lat,
                    "lon": node.lon,
                    "timestamp": Date.now()
                }
            ]
        };

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : data,
            success: function (data) {
            }
        });

        console.log(Date.now());
    }

    function getTrackPositions(track) {
        var url = 'https://f24h2018.herokuapp.com/api/tracks/'+track["_id"]+'/positions';

        $.ajax({
            type: "GET",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function(data) {
                // console.log(data);
            }
        });
    }



    /* Main */
    autoload();

    setTrackPosition();

});