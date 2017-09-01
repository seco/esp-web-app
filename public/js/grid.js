jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
};

jQuery.fn.exists = function () {
    return this.length !== 0;
}

$(document).ready(function() {
    requestDashboardGrid();
    var options = {
        cellHeight: 80,
        verticalMargin: 10
    };

    $('.grid-stack').gridstack(options);
});