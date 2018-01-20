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

    function createTracks(startSeed, endSeed, back){
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

        $.ajax({
            type: "POST",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            data : {
                'name' : 'Track ' + dir +' - '+startSeed.name + ' / ' + endSeed.name,
                // 'info' : 'TEST TEST TEST',
                'info' : 'Trajet de '+startSeed.name + ' à ' + endSeed.name,
                'startSeedId' : startSeedID,
                'endSeedId' : endSeedID
            },
            success: function (data) {

                if(!back)
                    createTracks(startSeed,endSeed,true);
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
                    createTracks(home, val, false);
                });

                getMyTracks();
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
                console.log(data);
                jQuery.each(data, function (i, val) {
                    getTrackPosition(val);
                });
            }
        });
    }

    function getCoordonates(seed) {
        return seed.location.coordinates;
    }

    function getTrackPosition(track) {
        var url = 'https://f24h2018.herokuapp.com/api/tracks/'+track["_id"]+'/positions';

        $.ajax({
            type: "GET",
            url: url,
            beforeSend: function(xhr, settings) { xhr.setRequestHeader('Authorization','Bearer ' + userToken); },
            success: function(data) {
                console.log(data);
            }
        });
    }

    /* Main */
    autoload();

});