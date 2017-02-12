'use strict';

const doubleClickTimeout = 300;
const rotationTimeout = 200;

let selectedPlanetData = null;
let selectedIndex = null;
let wheelDeltaForward = null;
let wheelDeltaBackward = null;
let clicks = 0;
let playingPlanetId = null;
let satellitesStyleArray = [];
let totalStepsToMove = 0;
let currentlyRotating = false;
let rotationInQ = 0;
let scaleLevelForTitle = 0.8;

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
	selectedIndex--;

	let firstElement = satellitesStyleArray.shift();
	satellitesStyleArray.push(firstElement);
};

function shiftArrayRight() {
	selectedIndex++;

	let lastElement = satellitesStyleArray.pop();
	satellitesStyleArray.unshift(lastElement);
};

function updateSatellitesStyle(transitionDuration = 0.2) {
	let satellitesElements = document.getElementsByClassName('satellite');

	for (let i = 0; i < satellitesElements.length; i++) {
		satellitesElements[i].style = satellitesStyleArray[i] + ' transition: all ' + transitionDuration + 's linear;';
		satellitesElements[i].firstChild.style = 'opacity: ' + (getAttributeFromTranformStyle(satellitesStyleArray[i], 'scale') < scaleLevelForTitle ? '0' : '1') + ';';
	}
};

function goBack() {
	// TODO: GO BACK
};

function displayPlanets(data) {
	selectedPlanetData = data;
	selectedIndex = 0;

	let satellitesElements = getSatellites(data);

	let oldSatellitesElements = document.getElementsByClassName('satellite');
	while (oldSatellitesElements[0]) {
		oldSatellitesElements[0].parentNode.removeChild(oldSatellitesElements[0]);	
	}

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
	let minScaleLevel = maxScaleLevel < 1 ? 0.4 - (1 - maxScaleLevel) < 0.1 ? 0.1 : 0.4 - (1 - maxScaleLevel) : 0.4;
	let scaleStep = (maxScaleLevel - minScaleLevel) / (numberOfSatellites / 2);

	scaleLevelForTitle = maxScaleLevel < 1 ? maxScaleLevel - 0.1 : 0.8;
	
	let mainPlanetElement = document.getElementById('main-planet');
	mainPlanetElement.style.zIndex = parseInt(zIndex / 2) + 1;
	let center = getCenterOfElement(mainPlanetElement);
	
	let positionOfNextSatellite = { x: 0, y: 0 };

	satellitesStyleArray = [];
	
	for (let i = 0; i < numberOfSatellites; i++) {
		positionOfNextSatellite = calculateNewPosition(angleForSatellite, center);
		
		let satelliteStyle = 'z-index: ' + zIndex + '; cursor: ' + (i === 0 ? 'pointer' : 'default') + '; ' +
			'transform: translateX(' + (positionOfNextSatellite.x - center.x) + 'px) translateY(' + (positionOfNextSatellite.y - center.y) + 'px) scale(' + scaleLevel + ');';
		let satelliteTitleStyle = 'opacity: ' + (scaleLevel < scaleLevelForTitle ? '0' : '1') + ';';

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
		// only front satellite could be playable and activable 
		if (planetIndex !== selectedIndex) clicks = 0;

		if (clicks === 1) {
			setSatellitePlay(planetIndex, data.children[planetIndex].Id, event);
		} else if (clicks === 2) {
			setSatelliteActive(data.children[planetIndex], planetIndex);
		}

		clicks = 0;
	}, doubleClickTimeout);
};

function setSatelliteActive(data, index) {
	let satelliteElement = document.getElementsByClassName('satellite')[index];
	satelliteElement.getElementsByClassName('planet-title')[0].style = 'transition: all 0.3s linear; transform: translateY(-60px) scale(0.5);';
	satelliteElement.getElementsByClassName('play-icon')[0].style.opacity = 0;

	animateNavigationToSatellite(index);

	setTimeout(function() {
		let mainPlanetElement = document.getElementById('main-planet');
		mainPlanetElement.style = '';
		mainPlanetElement.classList.toggle('hidden');

		displayPlanets(data);
		
		appendPath(data);
	}, 490);
};

function animateNavigationToSatellite(index) {
	let mainPlanetElement = document.getElementById('main-planet');
	let satellitesElements = document.getElementsByClassName('satellite');

	mainPlanetElement.style = 'transition: all 0.5s linear; transform: translateY(-80px) scale(0.2); opacity: 0;';
	mainPlanetElement.className += ' hidden';

	for (let i = 0; i < satellitesElements.length; i++) {
		let satelliteTransform = satellitesElements[i].style.transform;

		if (i === index) {
			satellitesElements[i].style.transform = satelliteTransform.replace(/translateY\(.*\)/g, 'translateY(0px)') + ' scale(2)';
		} else {
			let currentTranlateY = getAttributeFromTranformStyle(satelliteTransform, 'translateY', 2);
			let currentTranlateX = getAttributeFromTranformStyle(satelliteTransform, 'translateX', 2);
			let currentScaleLevel = getAttributeFromTranformStyle(satelliteTransform, 'scale');
			
			satellitesElements[i].className += ' hidden';
			satellitesElements[i].style.transform = satelliteTransform.replace(/translateX\(.*\)/g, 'translateX(' + (currentTranlateX * 2 / 3) + 'px)') +
			 ' translateY(' + (currentTranlateY - 40) + 'px) scale(' + (currentScaleLevel - 0.3) + ')';
		}		
	}
};

function setSatellitePlay(index, id, clickEvent) {
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
