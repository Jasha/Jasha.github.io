'use strict';

const doubleClickTimeout = 300;
const rotationTimeout = 200;
const maxScaleLevelForTitle = 0.8;

let wheelDeltaForward = null;
let wheelDeltaBackward = null;
let clicks = 0;
let playingPlanetId = null;
let satellitesStyleArray = [];
let totalStepsToMove = 0;
let currentlyRotating = false;
let rotationInQ = 0;

function loadInitialData() {
	setInitialData(testData2);
	displayPlanets(testData2);
};

function setInitialData(data) {
	document.getElementById('navigator-title').innerHTML = data.Text;

	document.getElementById('planets-space').addEventListener('mousewheel', function(event) {
		// currently every mousewheel event means 1 step, in the future we can decide the velocity of the sattelites move using event.wheelDelta (find on the bitbucket history)
		let direction = event.wheelDelta > 0 ? 'l' : 'r';
		handleScrollAndSwipeEvents(direction);
	}, false);

	detectSwipe(document.getElementById('planets-space'), function(direction) {
		// currently we are not use distance and duration provided from the 'detectSwipe' function, but in the future we can use these values to decide the velocity of the satellites move
		handleScrollAndSwipeEvents(direction);
	});

	appendPath(data, true);
};

function handleScrollAndSwipeEvents(direction) {
	rotationInQ++;

	let currentTotalSteps = totalStepsToMove;
	totalStepsToMove++;

	setTimeout(function() {
		rotationInQ--;

		rotateSatellites(direction);
	}, currentTotalSteps * rotationTimeout);
};

function appendPath(data, isFirst) {
	let navigatorPath = document.getElementById('navigator-path');

	let pathElem = document.createElement('span');
	pathElem.innerHTML = isFirst ? data.Text : ' / ' + data.Text;
	pathElem.onclick = function () { 
		// TODO: ON PATH CLICK
	};

	navigatorPath.appendChild(pathElem);
};

function rotateSatellites(direction) {
	let transitionDuration = 0.2;

	setTimeout(function () {
		if (direction === 'l') {
			shiftArrayLeft();
		} else if (direction === 'r') {
			shiftArrayRight();
		}
		
		if (rotationInQ < 4) {
			transitionDuration = (5.0 - rotationInQ) / 10;
		} else {
			transitionDuration = 0.2;
		}

		updateSatellitesStyle(transitionDuration);

		totalStepsToMove--;
	}, rotationTimeout);
};

function shiftArrayLeft() {
	let firstElement = satellitesStyleArray.shift();
	satellitesStyleArray.push(firstElement);
};

function shiftArrayRight() {
	let lastElement = satellitesStyleArray.pop();
	satellitesStyleArray.unshift(lastElement);
};

function updateSatellitesStyle(transitionDuration = 0.2) {
	let satellitesElements = document.getElementsByClassName('satellite');

	for (let i = 0; i < satellitesElements.length; i++) {
		satellitesElements[i].style = satellitesStyleArray[i] + ' transition: all ' + transitionDuration + 's linear;';
		satellitesElements[i].firstChild.style = 'opacity: ' + (getScaleLevelFromStyle(satellitesStyleArray[i]) < maxScaleLevelForTitle ? '0' : '1') + ';';
	}
}

function goBack() {
	// TODO: GO BACK
};

function displayPlanets(data) {
	let satellitesElements = getSatellites(data);

	let planetsSpaceElement = document.getElementById('planets-space');
	for (let i = 0; i < satellitesElements.length; i++) {
		planetsSpaceElement.appendChild(satellitesElements[i]);
	}

	let titleBlockElement = document.createElement('div');
	titleBlockElement.className = 'planet-title';

	let titleElement = document.createElement('span');
	titleElement.innerHTML = data.Text;
	titleBlockElement.appendChild(titleElement);

	let mainPlanetElement = resetCurrentMainPlanet();
	mainPlanetElement.appendChild(titleBlockElement);
};

function getSatellites(data) {
	const minScaleLevel = 0.4;
	
	let satellitesElements = [];
	let childrenData = data.children;
	let numberOfSatellites = childrenData ? childrenData.length : 0;
	let isEven = numberOfSatellites % 2 === 0;
	let zIndex = parseInt(numberOfSatellites / 2) + 1;
	let zStep = 1;
	let angleForSatellite = -90;
	let angleStep = 360 / numberOfSatellites;
	let scaleLevel = getScaleLevel(numberOfSatellites);
	let maxScaleLevel = scaleLevel;
	let scaleStep = (maxScaleLevel - minScaleLevel) / (numberOfSatellites / 2);
	
	let mainPlanetElement = document.getElementById('main-planet');
	mainPlanetElement.style.zIndex = parseInt(zIndex / 2) + 1;
	let center = getCenterOfElement(mainPlanetElement);
	
	let positionOfNextSatellite = { x: 0, y: 0 };
	
	for (let i = 0; i < numberOfSatellites; i++) {
		positionOfNextSatellite = calculateNewPosition(angleForSatellite, center);
		
		let satelliteStyle = 'z-index: ' + zIndex + '; cursor: ' + (i === 0 ? 'pointer' : 'default') + '; ' +
			'transform: translateX(' + (positionOfNextSatellite.x - center.x) + 'px) translateY(' + (positionOfNextSatellite.y - center.y) + 'px) scale(' + scaleLevel + ');';
		let satelliteTitleStyle = 'opacity: ' + (scaleLevel < maxScaleLevelForTitle ? '0' : '1') + ';';

		satellitesStyleArray.push(satelliteStyle);

		let newSatelliteElement = createSatelliteElement({satelliteStyle, satelliteTitleStyle}, data, childrenData[i], i);
		satellitesElements.push(newSatelliteElement);
		
		// increase/decrease scale level
		if (i === parseInt(numberOfSatellites / 2)) {
			scaleStep = -scaleStep;

			if (!isEven) {
				scaleLevel += scaleStep;
			}
		}
		scaleLevel -= scaleStep;

		// increase/decrease z index
		if (zIndex <= 1) {
			zStep = -zStep;
		}
		zIndex -= zStep;

		// increase angel
		angleForSatellite += angleStep;
	}

	return satellitesElements;
};

function calculateNewPosition(angel, center) {
    let cos = Math.cos(angel * Math.PI / 180);
    let sin = Math.sin(angel * Math.PI / 180);
    
	let deltaX = cos * 60; // 60 = distance from center to the desired position
    let deltaY = sin * 60;
    
	// 2.3 = width to height ratio (since it should looks like 3D)
    return { x: center.x - (deltaX * 2.3), y: center.y - deltaY };
};

function getScaleLevel(numberOfSatellites) {
	let scaleLevel = 1;
	let maxNumberOfSatellites = 10;

	if (numberOfSatellites > maxNumberOfSatellites) {
		scaleLevel = maxNumberOfSatellites / numberOfSatellites;
	}

	return scaleLevel;
};

function createSatelliteElement(styles, parentData, data, planetIndex) {
	let newSatelliteElement = document.createElement('div');
	newSatelliteElement.className = 'satellite';
	newSatelliteElement.style = styles.satelliteStyle;

	newSatelliteElement.onclick = function(event) { onSatelliteClick(event, planetIndex, parentData); };

	let titleBlockElement = createSatelliteTitleBlock(styles.satelliteTitleStyle, data.Text);
	newSatelliteElement.appendChild(titleBlockElement);

	let playIconElement = createSatellitePlayIcon(data.Id);
	newSatelliteElement.appendChild(playIconElement);

	return newSatelliteElement;
};

function onSatelliteClick(event, planetIndex, data) {
	clicks++;

	setTimeout(function() {
		if (clicks === 1) {
			// TODO: ONLY MIDDLE FRONT PLANET SHOULD BE PLAYABLE
			setSatellitePlay(planetIndex, data.children[planetIndex].Id, event);
		} else if (clicks === 2) {
			// TODO: SET SATELLITE ACTIVE
		}

		clicks = 0;
	}, doubleClickTimeout);
};

function setSatellitePlay(index, id, clickEvent) {
	let satelliteScaleLevel = getScaleLevelFromStyle(JSON.stringify(document.getElementsByClassName('satellite')[index].style));
	if (satelliteScaleLevel !== '1') return;

	let currentActiveElement = document.querySelector('.play-icon.playing');

	if (currentActiveElement) {
		currentActiveElement.classList.toggle('playing');
	}

	let newActiveElement = index >= 0 ? document.getElementsByClassName('play-icon')[index] : null;

	if (!newActiveElement) {
		playingPlanetId = null;
		return;
	} else {
		playingPlanetId = id;
		newActiveElement.className += ' playing';
	}
};

function createSatelliteTitleBlock(style, text) {
	let titleBlockElement = document.createElement('div');
	titleBlockElement.className = 'planet-title';
	titleBlockElement.style = style;

	let titleElement = document.createElement('span');
	titleElement.innerHTML = text;

	titleBlockElement.appendChild(titleElement);

	return titleBlockElement;
};

function createSatellitePlayIcon(planetId) {
	let playIconElement = document.createElement('div');
	playIconElement.className = 'play-icon';

	if (planetId === playingPlanetId) {
		playIconElement.className += ' playing';
	}

	return playIconElement;
};

function resetCurrentMainPlanet() {
	let mainPlanetElement = document.getElementById('main-planet');

	if (mainPlanetElement.className.indexOf('hidden') !== -1) {
		mainPlanetElement.classList.toggle('hidden');
	}

	while (mainPlanetElement.firstChild) {
	    mainPlanetElement.removeChild(mainPlanetElement.firstChild);
	}

	return mainPlanetElement;
};
