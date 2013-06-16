/*
 * Client side javascript for hitting the query-trucks api.
 * On successful queries, this file is responsible for both
 * appending queried trucks to a truck list container and 
 * displaying queried trucks on the map.
 *
 * NOTE that a huge assumption is made that clientside mapview.js 
 * is included
 */

var foodTruckNS = foodTruckNS || {};
foodTruckNS.query = foodTruckNS.query || {};

/*
 * Function called on the interval timer that grabs new tweets.
 */
foodTruckNS.query.intervalFunction = function(data) {
    if (!data.error)  {
        var id = data.truckid;
        var tweets = data.tweets;
        if (tweets.length && id in foodTruckNS.query.twitterLiElements) {
            var li = foodTruckNS.query.twitterLiElements[id];
            li.find('.truck-info > .truck-tweet')
                .html(foodTruckNS.twitter.parseTweet(tweets[0]));
            foodTruckNS.linker.linkify(li.find('.truck-info > .truck-tweet')[0]);
            li.find('time.tweet-timeago').timeago();
        }
    }
};

foodTruckNS.query.innerLiHTML = function(truck, thumbnailSize) {
    var tweet = truck.tweet ? foodTruckNS.twitter.parseTweet(truck.tweet) : "";
    var thumbnail = {
        src: truck.uploadid ? truck.thumb : "/images/default-truck.jpg",
        width: thumbnailSize,
        height: thumbnailSize
    };

    return foodTruckNS.templates.truckList({
        truck: truck,
        thumbnail: thumbnail,
        tweet: tweet 
    });
};

/*
 * Appends list of trucks to the truckContainer
 */
foodTruckNS.query.listTrucks = function(trucks, thumbnailSize) {
    var container = foodTruckNS.query.truckContainer;
    container.html('');
    foodTruckNS.query.twitterLiElements = {}; /* key: truck id, val: html */


    if (trucks.length === 0) {
        container.html("No trucks were found :(");
    }

    for (var i = 0; i < trucks.length; i++) {
        var truck = trucks[i];
        var $innerLiHTML = $(foodTruckNS.query.innerLiHTML(truck, thumbnailSize));
        container.append($innerLiHTML);

        /* for all trucks with twitter id's, lets check for more tweets */
        if (truck.twitterid) {
           foodTruckNS.query.twitterLiElements[truck.id] = $innerLiHTML;
        }
    }

    foodTruckNS.linker.linkify(container[0]);
    $("time.tweet-timeago").timeago();
};

/*
 * Hits API endpoint to get truck data
 */
foodTruckNS.query.getTrucks = function(args) {
    if (foodTruckNS.query.truckContainer !== null) {
        foodTruckNS.query.truckContainer.html("Loading trucks...");
    }

    $.ajax({
        type: 'POST',
        url: '/api/query-trucks',
        data: args,
        success: function(data) {
            if (data.error)  {
                foodTruckNS.displayError("Couldn't load trucks");
            } else {
                data.trucks.sort(function(a, b) {
                    /* sorting function. prioritize open trucks first, then tweeting trucks */
                    if (a.open && !b.open) {
                        return -1;
                    } else if (!a.open && b.open) {
                        return 1;
                    } else if (a.tweet && !b.tweet) {
                        return -1;
                    } else if (!a.tweet && b.tweet) {
                        return 1 ;
                    }
                    return 0;
                });
                if (foodTruckNS.query.truckContainer !== null) {
                    foodTruckNS.query.listTrucks(data.trucks, data.thumbnailSize);
                    foodTruckNS.query.truckContainer.fadeIn("slow");
                }

                /* Update the map to show only the newly listed trucks */
                /* NOTE THAT FUNCTIONAL PROGRAMMING UP IN HERE */
                foodTruckNS.mapview.placeMarkers(data.trucks.filter(function(truck) {
                    return truck.open;
                }));
            }
        }
    });
};


foodTruckNS.query.setupSearch = function() {
    var $searchBar = $('#truck-search');
    var $searchButton = $('#truck-search-button');

    var debouncedProcessFilters = _.debounce(foodTruckNS.query.processFilters, 300, true);

    $searchBar.keyup(function(e) {
        if (e.keyCode == 13) {
            debouncedProcessFilters();
        }
    });

    $searchButton.click(debouncedProcessFilters);
};


/*
 * Handler for when search button is pressed.
 * Checks which filters are active and sends them to
 * getTrucks.
 */
foodTruckNS.query.processFilters = function() {
    var $searchBar = $('#truck-search');
    var $near = $('#near-filter');
    var $open = $('#open-filter');

    var args = {};
    args.name = $searchBar.val();
     
    if ('userId' in foodTruckNS) {
        var $favorites = $('#favorites-filter');
        if ($favorites.hasClass('active')) {
            args.follows = foodTruckNS.userId;
        }
    }

    if ($open.hasClass('active')) {
        args.open = true;
    }
    foodTruckNS.query.prevArgs = args;

    if($near.hasClass('active')) {
        if (!navigator.geolocation) {
            foodTruckNS.displayError('Geolocation is not supported with this browser. Cannot get location.');
            return;
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            /* if searching by near you, only get open trucks */
            args.open = true;

            args.range = {};
            args.range.lat = pos.coords.latitude;
            args.range.lon = pos.coords.longitude;
            args.range.distance = 1600;

            foodTruckNS.mapview.displayUser(pos);
            foodTruckNS.query.prevArgs = args;
            foodTruckNS.query.getTrucks(args);
        }, function(error) {
            foodTruckNS.displayError('Error occurred trying to get geolocation data. Please reload the page and try again');
        }, {timeout: 8000});
    } else {
        foodTruckNS.mapview.displayUser(null);
        foodTruckNS.query.prevArgs = args;
        foodTruckNS.query.getTrucks(args);
    }
};


/*
 * Setup click handlers for the search filters
 */
foodTruckNS.query.setupFilters = function() {
    var $near = $('#near-filter');
    var $open = $('#open-filter');

    /* only show favorites if logged in */
    if ('userId' in foodTruckNS) {
        var $favorites = $('#favorites-filter');
        $favorites.click(function() {
             _.debounce(function() { 
                $favorites.toggleClass('active');
                foodTruckNS.query.processFilters();
            }, 300, true)();
        });
    }

    $near.click(function() {
         _.debounce(function() { 
            $near.toggleClass('active');
            foodTruckNS.query.processFilters();
        }, 300, true)();
    });
    $open.click(function() {
         _.debounce(function() { 
            $open.toggleClass('active');
            foodTruckNS.query.processFilters();
        }, 300, true)();
    });
};


/*
 * Expects one argument: the container for the trucklist.
 * if the provided argument is null, then none of the list creation will be done
 * (For now, argument being null means you are on the mapview page)
 */
foodTruckNS.query.init = function(truckContainer) {
    foodTruckNS.query.truckContainer = truckContainer; 
    
    /* Arguably not the best thing in the world, fix later maybe */
    if (truckContainer) {
        setInterval(function() {
            if (foodTruckNS.query.twitterLiElements) {
                for (var id in foodTruckNS.query.twitterLiElements) {
                    var li = foodTruckNS.query.twitterLiElements[id];
                    $.ajax({
                        type: 'POST',
                        url: '/api/get-truck-tweets',
                        data: {
                            truckid: id,
                            count: 1
                        },
                        success: foodTruckNS.query.intervalFunction
                    });
                }
            }
        }, 15000);
    }
    foodTruckNS.query.setupFilters();
    foodTruckNS.query.setupSearch();
};
