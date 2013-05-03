/*
 * Client side javascript for the truckle box. ;) 
 *
 * (spr-style naming conventions up in hurr)
 */

var foodTruckNS = foodTruckNS || {};
foodTruckNS.trucklebox = foodTruckNS.trucklebox || {};

/* The event listener for toggling the display of the truckle box.
 */
foodTruckNS.trucklebox.toggleTrucklebox = function(e) {
    if(foodTruckNS.trucklebox.menuOpen) {
        foodTruckNS.trucklebox.hideMenu();
    } else {
        foodTruckNS.trucklebox.showMenu();
    }
};

/* Hides the truckle menu.
 */
foodTruckNS.trucklebox.hideMenu = function() {
    $(foodTruckNS.trucklebox.menu).hide();
    foodTruckNS.trucklebox.menuOpen = false;
};

/* Shows the truckle menu.
 */
foodTruckNS.trucklebox.showMenu = function() {
    $(foodTruckNS.trucklebox.menu).show();
    foodTruckNS.trucklebox.menuOpen = true;
};

/* Called by constructMenu to construct menu items to populate
 * the menu.
 */
foodTruckNS.trucklebox.constructMenuItem = function(url, name, className) {
    var li = $('<li />');
    if(className) {
        $(li).addClass(className);
    }
    var a = $('<a />');
    $(a).attr('href', url);
    $(a).text(name);
    $(li).append(a);
    return li;
};

/* Constructs the truckle menu for the truckle box. God damn I love
 * the name foodtruckler.
 */
foodTruckNS.trucklebox.constructMenu = function() {
    var menu = $('<div id="truckle-menu" />');
    
    var list = $('<ul />');
    $(menu).append(list);

    $(list).append(foodTruckNS.trucklebox.constructMenuItem('/edit-truck/info', 'Manage your truck', 'edit-truck'));
    $(list).append(foodTruckNS.trucklebox.constructMenuItem('/edit-truck/location', 'Update location', 'update-location'));
    $(list).append(foodTruckNS.trucklebox.constructMenuItem('/edit-account/password', 'Edit your account', 'edit-account'));
    $(list).append(foodTruckNS.trucklebox.constructMenuItem('/logout', 'Log out'));

    $(menu).hide();
    $(menu).click(function(e) {
        e.stopPropagation();
    });
    return menu;
};

foodTruckNS.trucklebox.init = function() {
    if($("#truckle-box")) {
        /* Only initialize if the truckle box is on the page. */
        foodTruckNS.trucklebox.box = $("#truckle-box");
        foodTruckNS.trucklebox.menu = foodTruckNS.trucklebox.constructMenu();
        $(foodTruckNS.trucklebox.box).append(foodTruckNS.trucklebox.menu);
        foodTruckNS.trucklebox.hideMenu();
        $(foodTruckNS.trucklebox.box).click(foodTruckNS.trucklebox.toggleTrucklebox);
    }
};

$(document).ready(function(e) {
    foodTruckNS.trucklebox.init();
});
