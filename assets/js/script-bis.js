$(document).ready(function () {
    /* Variables */

    // Ueer token for request
    var userToken = '';

    //Seeds
    var seeds = [];
    var activeSeeds = [];

    // Colony
    var home;

    var lastTrackId;

    var back;

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
                // console.log(seeds);

                // Search for the home seed
                jQuery.each(seeds, function(i, val) {
                    if(val.active === true) {

                        if (val.type === "home")
                            home = val;
                        else
                            activeSeeds.push(val);
                    }
                });

                // console.log(activeSeeds);
                jQuery.each(activeSeeds, function (i, val) {
                    back = false;

                    if(!back){
                        setItineraire(val, home);
                        if(back) {
                            setItineraire(home, val);
                        }
                    }
                });
            }
        });
    }

    function setItineraire(seed, home){
        var coordonate_seed = getCoordonates(seed);
        var coordonate_home = getCoordonates(home);

        createTrack(coordonate_home,coordonate_seed);

        getTrackNodesIds(coordonate_home,coordonate_seed);

        back = true;
    }

    function createTrack(startSeed, endSeed){
        var startSeedID;
        var endSeedID;

        startSeedID = startSeed.id;
        endSeedID = endSeed.id;


        var url = "https://f24h2018.herokuapp.com/api/tracks";

        /* Uncomment this part if needed */

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : {
                'name' : 'Track viking',
                // 'info' : 'TEST TEST TEST',
                'info' : '(VIKING) - Trajet de '+startSeed.name + ' à ' + endSeed.name,
                'startSeedId' : startSeedID,
                'endSeedId' : endSeedID
            },
            success: function (data) {
                lastTrackId = data['_id'];

                console.log(lastTrackId);
            }
        });
    }

    function getCoordonates(seed) {
        return {
            pos : seed.location.coordinates,
            id : seed['_id'],
            name: seed.name
        }
}

    function getTrackNodesIds(startPos, endPos){
        url = 'http://router.project-osrm.org/route/v1/driving/'+startPos.pos[1]+','+startPos.pos[0]+';'+endPos.pos[1]+','+endPos.pos[0]+'?annotations=true';

        $.ajax({
            type: "GET",
            url: url,
            success: function (data) {
                var nodes_ids = data.routes[0].legs[0].annotation.nodes;

                getNodes(nodes_ids);
            }
        });
    }

    function getNodes(nodes_ids){
        var url = "https://lz4.overpass-api.de/api/interpreter";

        var nodes_string  = '';

        nodes_string = nodes_ids.toString();

        console.log(nodes_string);

        var data = '[out:json];node(id:'+nodes_string+');out;';

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : data,
            success: function (data) {
                var nodes = data.elements;

                jQuery.each(nodes, function (i, val) {
                    setInterval(setTrackPosition,1000,val);
                });

                setTrackEnd(lastTrackId);
            }
        });
    }

    function setTrackPosition(node){
        var url = "https://f24h2018.herokuapp.com/api/positions/bulk";

        var data = {
            "trackId": lastTrackId,
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
    }

    function setTrackEnd(trackId) {
        var url = 'https://f24h2018.herokuapp.com/api/tracks/'+trackId+'/end';

        $.ajax({
            type: "PUT",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function (data) {
            }
        });
    }

    /* Main */
    autoload();
});
