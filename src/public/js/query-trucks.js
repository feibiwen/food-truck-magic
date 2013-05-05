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

foodTruckNS.query.intervalFunction = function(data) {
    if (!data.error)  {
        var truck = data.trucks[0];
        if (truck.tweet) {
            foodTruckNS.query.truckContainer.find('li.' + truck.id + ' > .truck-info > .truck-tweet').text(truck.tweet.text);
        }        
    }
};

foodTruckNS.query.innerLiHTML = function(truck, thumbnailSize) {
    var name = truck.name;
    var urlid = truck.urlid;
    var description = "";
    var thumbnailLink = "/images/default-truck.jpg";
    var openStatus = "closed";
    if (truck.description) {
        description = truck.description;
    }
    if (truck.uploadid) {
        thumbnailLink = truck.thumb;
    }
    if (truck.open) {
        openStatus = "open!";
    }
    
    var tweet = "<p class='truck-tweet'>";
    if (truck.tweet) {
        tweet += truck.tweet.text;
    }
    tweet += "</p>";

    var innerLi = '' +
        '<li class="' + truck.id + '">' +
            '<a class="truck-image" href="trucks/' + urlid + '">' +
            '   <img class="truck-thumbnail"' +
            '       src="' + thumbnailLink + '"' +
            '       alt="' + name + '"' +
            '       width="' + thumbnailSize + '" height="' + thumbnailSize + '" />' +
            '</a>' +
            '<div class="truck-info">' +
            '   <a href="trucks/' + urlid + '">' +
            '       <h3 class="truck-name">' + name + '</h3>' +
            '   </a>' +
            '   <span class="openStatus">(' + openStatus + ')</span>' +
            '   <p>' + description + '</p>' +
                tweet +
            '</div>' +
        '</li>';
    
    return innerLi;
};

/*
 * Appends list of trucks to the truckContainer
 */
foodTruckNS.query.listTrucks = function(trucks, thumbnailSize) {
    var container = foodTruckNS.query.truckContainer;
    var containerHTML = '';

    for (var i = 0; i < trucks.length; i++) {
        var truck = trucks[i];
        containerHTML += foodTruckNS.query.innerLiHTML(truck, thumbnailSize);
    }

    container.html(containerHTML);
    foodTruckNS.query.listElements = container.children('li');
};

/*
 * Hits API endpoint to get truck data
 */
foodTruckNS.query.getTrucks = function(args) {
    if (foodTruckNS.query.truckContainer !== null) {
        foodTruckNS.query.truckContainer.hide();
        foodTruckNS.query.truckContainer.fadeIn("slow");
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
                    if (a.open) {
                        return -1;
                    } else if (b.open) {
                        return 1;
                    }
                    return 0;
                });
                if (foodTruckNS.query.truckContainer !== null) {
                    foodTruckNS.query.listTrucks(data.trucks, data.thumbnailSize);
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

    $searchBar.keyup(function(e) {
        if (e.keyCode == 13) {
            foodTruckNS.query.processFilters();
        }
    });

    $searchButton.click(function() {
        foodTruckNS.query.processFilters();
    });
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
            args.range.distance = 50;
            foodTruckNS.query.prevArgs = args;
            foodTruckNS.query.getTrucks(args, true);
        }, function(error) {
            foodTruckNS.displayError('Error occurred trying to get geolocation data. Please reload the page and try again');
        }, {timeout: 8000});
    } else {
        foodTruckNS.query.prevArgs = args;
        foodTruckNS.query.getTrucks(args, true);
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
            $favorites.toggleClass('active');
        });
    }

    $near.click(function() {
        $near.toggleClass('active');
    });
    $open.click(function() {
        $open.toggleClass('active');
    });
};


/*
 * Expects one argument: the container for the trucklist.
 * if the provided argument is null, then none of the list creation will be done
 * (For now, argument being null means you are on the mapview page)
 */
foodTruckNS.query.init = function(truckContainer) {
    foodTruckNS.query.truckContainer = truckContainer; 
    
    /* Timer to update the trucklist dynamically.
     * Unfortunately, the way it does this is by hitting the query-trucks
     * endpoint, which is clearly NOT meant to be used like this.
     * TODO: make a better endpoint specifically to handle this
     */

    if (truckContainer) {
        setInterval(function() {
            if (foodTruckNS.query.listElements) {
                for (var i = 0; i < foodTruckNS.query.listElements.length; i++) {
                    var li = foodTruckNS.query.listElements[i];
                    var truckId = li.classList[0];
                    $.ajax({
                        type: 'POST',
                        url: '/api/query-trucks',
                        data: {
                            truckid: truckId
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
