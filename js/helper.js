'use strict';

function getCenterOfElement(element) {
    let elementInfo = element.getBoundingClientRect();
    
    return {
        x: elementInfo.left + elementInfo.width / 2,
        y: elementInfo.top + elementInfo.height / 2
    };
};

function getDistanceBetweenElements(a, b) {
    let aPosition = getCenterOfElement(a);
    let bPosition = getCenterOfElement(b);

    return {
    	x: aPosition.x - bPosition.x,
    	y: aPosition.y - bPosition.y
    };
};

function getElementPosition(planet) {
	let elementInfo = planet.getBoundingClientRect();
			
	return { x: elementInfo.left, y: elementInfo.top };
};

function getScaleLevelFromStyle(style) {
	let scaleLevelText = style.match(/scale\(.*\)/)[0];
	
	let start = scaleLevelText.indexOf('(');
	let end = scaleLevelText.indexOf(')');
	
	let scaleLevel = scaleLevelText.substr(start + 1, end - start - 1);

	return scaleLevel;
};

function detectSwipe(element, callback) {
    let swipeData = new Object();
    swipeData.startX = 0; swipeData.startY = 0; swipeData.endX = 0; swipeData.endY = 0; swipeData.startTime = 0; swipeData.endTime = 0;
    
    let min_x = 10;  // min x swipe for horizontal swipe
    let max_x = 10;  // max x difference for vertical swipe
    let min_y = 50;  // min y swipe for vertical swipe
    let max_y = 60;  // max y difference for horizontal swipe
    
    let direction = '';

    let checkTheValuesAndPerfromTheAction = function () {
        // detect horizontal swipe
        if ((((swipeData.endX - min_x > swipeData.startX) || (swipeData.endX + min_x < swipeData.startX)) &&
        ((swipeData.endY < swipeData.startY + max_y) && (swipeData.startY > swipeData.endY - max_y) && (swipeData.endX > 0)))) {
            if (swipeData.endX > swipeData.startX) {
                direction = 'r';
            } else {
                direction = 'l';
            }
        }
        
        if (direction !== '') {
            if (typeof callback === 'function') {
                callback(direction, swipeData.endX - swipeData.startX, swipeData.endTime - swipeData.startTime);

                // reset values
                direction = '';
                swipeData.startX = swipeData.endX; swipeData.startY = swipeData.endY;
            }
        }
    };
    
    element.addEventListener('touchstart', function(e) {
        let t = e.touches[0];
        swipeData.startX = t.screenX; 
        swipeData.startY = t.screenY;
        swipeData.startTime = new Date();
    }, false);

    element.addEventListener('touchmove', function(e) {
        e.preventDefault();
        
        let t = e.touches[0];
        swipeData.endX = t.screenX;
        swipeData.endY = t.screenY;
        swipeData.endTime = new Date();

        checkTheValuesAndPerfromTheAction();
    }, false);

    element.addEventListener('touchend', function(e) {
        checkTheValuesAndPerfromTheAction();

        // reset values
        direction = '';
        swipeData.startX = 0; swipeData.startY = 0; swipeData.endX = 0; swipeData.endY = 0; swipeData.startTime = 0; swipeData.endTime = 0;
    }, false);
};
