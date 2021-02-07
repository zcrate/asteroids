const FPS = 30; // frames per second
const friction = 0.7; // friction coefficient of space (0=none, 1=lots)
const gameLives = 3; // starting number of lives
const saveKeyScore = "highscore" // save key for local storage of high score

const starCount = 50; // number of stars in background
const starSize = 4; // max size of stars in pixels
const starDepth = 0.3; // max depth of stars in background

const asteroidPtsLg = 20 // points scored for large asteroid
const asteroidPtsMd = 50 // points scored for medium asteroid
const asteroidPtsSm = 100 // points scored for small asteroid
const asteroidJag = 0.3 // jaggedness of the asteroids (0=none, 1=lots)
const asteroidCount = 3; // starting number of asteroids
const asteroidSize = 100; // starting size of asteroids in pixels
const asteroidSpeed = 50; // max starting speed of asteroids in pixels per second
const asteroidVert = 10; // average number of vertices on each asteroid

const laserDist = 0.6; // max distance laser can travel as fraction of screen width
const laserExplodeDuration = 0.1 // duration of laser's explosion in seconds
const laserMax = 10; // maximum number of lasers on screen
const laserSpeed = 500; // speed of lasers in pixels per second

const shipExplodeDuration = 0.3; // duration of the ship's explosion
const shipBlinkDuration = 0.1; // duration of blink during invulnerability in seconds
const shipInvDuration = 3; // duration of ship invulnerability in seconds
const shipSize = 30; // ship height in pixels
const shipThrust = 5; // acceleration of ship in pixels per second per second
const turnSpeed = 360; // turn speed in degrees per second

const bounding = false; // show or hide collision bounding 
const showCenterDot = false; // show or hide ship's center dot
const soundOn = true;
const musicOn = true;
const textFadeTime = 2.5; // text fade time in seconds
const textSize = 40; // text font height in pixels


var canv = document.querySelector('#gameCanvas')
var ctx = canv.getContext('2d')

//set up sound effects (src, max number, volume)
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.4);
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.4);
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.4);
var fxThrust = new Sound("sounds/thrust.m4a");
var fxHit = new Sound("sounds/hit.m4a", 5);
var fxExplode = new Sound("sounds/explode.m4a");
var fxLaser = new Sound("sounds/laser.m4a", 5, 0.4);

//set up the music
var music = new Music("sounds/music-low.m4a", "sounds/music-high.m4a");
var asteroidsLeft, asteroidTotal;

//set up the game parameters
var level, lives, asteroids, score, scoreHigh, ship, text, textAlpha;
newGame();


// set up stars in background
var stars = [];
createStars();

// set up asteroids
var asteroids = [];
createAsteroidBelt();

//set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createStars() {
	stars = [];
	starColors = [
		'#eec',
		'#aac',
		'#977',
		'#678',
		'#556',
	];
	var x, y, r, starColor;
	for (var i=0; i<starCount; i++) {
		x = Math.floor(Math.random() * canv.width);
		y = Math.floor(Math.random() * canv.height);
		r = Math.ceil(Math.random() * (starSize/2));
		starColor = starColors[Math.floor(Math.random() * starColors.length)];
		depth = Math.random() * starDepth;

		stars.push(newStar(x,y,r,starColor, depth));
	}
}

function createAsteroidBelt() {
	asteroids = [];
	asteroidTotal = (asteroidCount + level) * 7;
	asteroidsLeft = asteroidTotal;
	var x, y;
	for (var i=0; i<asteroidCount + level; i++) {
		do {
			x = Math.floor(Math.random() * canv.width);
			y = Math.floor(Math.random() * canv.height);

		} while (distBetweenPoints(ship.x, ship.y, x, y) < asteroidSize * 2 + ship.r);

		asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize/2)));
	}
}

function destroyAsteroid(index) {
	var x = asteroids[index].x;
	var y = asteroids[index].y;
	var r = asteroids[index].r;

	//split the asteroid in two if necessary
	if (r == Math.ceil(asteroidSize/2)) {
		asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize/4)));
		asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize/4)));
		score += asteroidPtsLg;
	} else if (r == Math.ceil(asteroidSize/4)) {
		asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize/8)));
		asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize/8)));
		score += asteroidPtsMd;
	} else {
		score += asteroidPtsSm;
	}

	//check high score
	if (score > scoreHigh) {
		scoreHigh = score;
		localStorage.setItem(saveKeyScore, scoreHigh);
	}

	//destroy the asteroid
	asteroids.splice(index, 1);
	fxHit.play();

	//calculate the ratio of remaining asteroids to determind music tempo
	asteroidsLeft--;
	music.setAsteroidRatio(asteroidsLeft == 0 ? 1 : asteroidsLeft / asteroidTotal);

	// new level when no more asteroids
	if (asteroids.length == 0) {
		level++;
		newLevel();
	}
}

function distBetweenPoints(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, color = "white") {
	ctx.strokeStyle = color;
	ctx.fillStyle = "black";
	ctx.lineWidth = shipSize / 20;
	ctx.beginPath();
	ctx.moveTo( // nose of ship
		x + 4/3 * ship.r * Math.cos(a),
		y - 4/3 * ship.r * Math.sin(a)
		);
	ctx.lineTo( // rear left
		x - ship.r * (2/3 * Math.cos(a) + Math.sin(a)),
		y + ship.r * (2/3 * Math.sin(a) - Math.cos(a))
		);
	ctx.lineTo( // rear right
		x - ship.r * (2/3 * Math.cos(a) - Math.sin(a)),
		y + ship.r * (2/3 * Math.sin(a) + Math.cos(a))
		);
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
} 

function keyDown(ev) {

	if (ship.dead) {
		return
	}

    switch(ev.keyCode) {
    	case 32: // spacebar (shoot laser)
    		shootLaser();
    		break;
        case 37: // left arrow (rotate ship left)
            ship.rot = turnSpeed / 180 * Math.PI / FPS;
            break;
        case 38: // up arrow (thrust the ship forward)
            ship.thrusting = true;
            break;
        case 39: // right arrow (rotate ship right)
            ship.rot = -turnSpeed / 180 * Math.PI / FPS;
            break;
        case 40: // down arrow (brake)
        	ship.braking = true;
        	break;
    }
}

function keyUp(ev) {

	if (ship.dead) {
		return
	}

    switch(ev.keyCode) {
    	case 32: // spacebar (allow shooting)
    		ship.canShoot = true;
    		break;
        case 37: // left arrow (stop rotating left)
            ship.rot = 0;
            break;
        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break;
        case 39: // right arrow (stop rotating right)
            ship.rot = 0;
            break;
        case 40: // down arrow (brake)
        	ship.braking = false;
        	break;
    }
}

function newStar(x, y, r, c, d) {
	return {
		x: x,
		y: y,
		r: r,
		color: c,
		depth: d,
		movement: {
			x: 0,
			y: 0
		}
	}
}

function newAsteroid(x, y, r) {
	var lvlMult = 1 + 0.1 * level;
	var asteroid = {
		x: x,
		y: y,
		xv: Math.random() * asteroidSpeed * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
		yv: Math.random() * asteroidSpeed * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
		r: r,
		a: Math.random() * Math.PI * 2, // in radians
		vert: Math.floor(Math.random() * (asteroidVert+1) + asteroidVert/2), // vertex, random number between 5 and 15	
		offsets: [],
		movement: {
			x: 0,
			y: 0
		}
	}

	// create the vertex offsets array
	for (var i=0; i<asteroid.vert; i++) {
		asteroid.offsets.push(Math.random() * asteroidJag * 2 + 1 - asteroidJag)
	}

	return asteroid;
}

function newGame() {
	level = 0;
	lives = gameLives;
	score = 0;
	ship = newShip();
	star = newStar();

	//get the high score from local storage
	var scoreStr = localStorage.getItem(saveKeyScore);
	if (scoreStr == null) {
		scoreHigh = 0;
	} else {
		scoreHigh = parseInt(scoreStr);
	}

	newLevel();
}

function newLevel() {
	text = "Level " + (level+1);
	textAlpha = 1.0;
	createStars();
	createAsteroidBelt();
}

function newShip() {
	return {
		x: canv.width/2,
		y: canv.height/2,
		r: shipSize/2,
		a: 90 / 180 * Math.PI, // direction of ship, convert to radians
		blinkNum: Math.ceil(shipInvDuration / shipBlinkDuration),
		blinkTime: Math.ceil(shipBlinkDuration * FPS),
		canShoot: true,
		dead: false,
		lasers: [],
		explodeTime: 0,
		rot: 0,
		thrusting: false,
		thrust: {
			x: 0,
			y: 0
		},
		braking: false,
	}
}

function shootLaser() {
	// create laser object
if (ship.canShoot && ship.lasers.length < laserMax) {
	ship.lasers.push({ // from the nose of the ship
		x: ship.x + 4/3 * ship.r * Math.cos(ship.a),
		y: ship.y - 4/3 * ship.r * Math.sin(ship.a),
		xv: laserSpeed * Math.cos(ship.a) / FPS,
		yv: -laserSpeed * Math.sin(ship.a) / FPS,
		dist: 0,
		explodeTime: 0,
	});
	fxLaser.play();
}
	//prevent further shooting
	ship.canShoot = false; 
}

function explodeShip() {
	ship.explodeTime = Math.ceil(shipExplodeDuration * FPS);
	fxExplode.play();
}

function gameOver() {
	ship.dead = true;
	text = "Game Over";
	textAlpha = 1.0;
}

//handle edge of screen
function handleEdge(object) {
	if (object.x < 0 - object.r) {
		object.x = canv.width + object.r;
	} else if (object.x > canv.width + object.r) {
		object.x = 0 - object.r;
	}

	if (object.y < 0 - object.r) {
		object.y = canv.height + object.r;
	} else if (object.y > canv.height + object.r) {
		object.y = 0 - object.r;
	}
}

// show object bounding
function showBounding(object) {
	if (bounding) {
		ctx.strokeStyle = "lime";
		ctx.beginPath();
		ctx.arc(object.x, object.y, object.r, 0, Math.PI*2, false);
		ctx.stroke();
	}
}

function Music(srcLow, srcHigh) {
	this.soundLow = new Audio(srcLow);
	this.soundHigh = new Audio(srcHigh);
	this.low = true;
	this.tempo = 1.0; // seconds per beat
	this.beatTime = 0; // frames left until next beat

	this.play = function() {
		if (musicOn) {
			if (this.low) {
				this.soundLow.play();
			} else {
				this.soundHigh.play();
			}
			this.low = !this.low;
		}	
	}

	this.setAsteroidRatio = function(ratio) {
		this.tempo = 1.0 - 0.75 * (1.0 - ratio);
	}

	this.tick = function() {
		if (this.beatTime == 0) {
			this.play();
			this.beatTime = Math.ceil(this.tempo * FPS);
		} else {
			this.beatTime--;
		}
	}
}

function Sound(src, maxStreams = 1, vol = 0.7) {
	this.streamNum = 0;
	this.streams = [];
	for (var i=0; i<maxStreams; i++) {
		this.streams.push(new Audio(src));
		this.streams[i].volume = vol;
	}

	this.play = function() {
		if (soundOn) {
			this.streamNum = (this.streamNum +1) % maxStreams;
			this.streams[this.streamNum].play();
		}	
	}

	this.stop = function() {
		this.streams[this.streamNum].pause();
		this.streams[this.streamNum].currentTime = 0;
	}
}

function update() {
	var blinkOn = ship.blinkNum%2 == 0
	var exploding = ship.explodeTime > 0;

	// tick the music
	music.tick();

	// draw background (space)
	ctx.fillStyle = "black",
	ctx.fillRect(0, 0, canv.width, canv.height)

	// draw the stars
	var x, y, r, color;
	for (var i=0; i<stars.length; i++) {
		
		// star properties
		x = stars[i].x;
		y = stars[i].y;
		r = stars[i].r;
		color = stars[i].color;

		ctx.fillStyle = color;
		ctx.lineWidth = 1;
		// draw path
		ctx.beginPath();
		ctx.arc(x,y,r,0,Math.PI*2);
		ctx.fill();
	}

	// move the stars
	for (var i=0; i<stars.length; i++) {
		star = stars[i];

		if (ship.thrusting) {		
			star.movement.x -= shipThrust * Math.cos(ship.a) * star.depth / FPS;
			star.movement.y += shipThrust * Math.sin(ship.a) * star.depth / FPS;
		} else {
			star.movement.x -= friction * star.movement.x / FPS;
			star.movement.y -= friction * star.movement.y / FPS;
		}

		star.x += star.movement.x;
		star.y += star.movement.y;

		handleEdge(star);
	}	

	//draw lives
	var lifeColor;
	for (var i=0; i<lives; i++) {
		lifeColor = exploding && i == lives - 1 ? "red" : "white";
		drawShip(shipSize + i * shipSize * 1.2, shipSize, 0.5 * Math.PI, lifeColor);
	}

	// draw the score
	ctx.textAlign = "right";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "white";
	ctx.font = textSize + "px impact";
	ctx.fillText(score, canv.width - shipSize/2, shipSize);

	// draw the high score
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "white";
	ctx.font = (textSize * 0.7) + "px impact";
	ctx.fillText("Best: "+ scoreHigh, canv.width/2, shipSize);

	// draw the asteroids
	var x, y, r, a, vert, offsets;

	for (var i=0; i<asteroids.length; i++) {
		ctx.strokeStyle = "slategrey";
		ctx.fillStyle = "black";
		ctx.lineWidth = shipSize / 15;

		//get the asteroid properties
		x = asteroids[i].x;
		y = asteroids[i].y;
		r = asteroids[i].r;
		a = asteroids[i].a;
		vert = asteroids[i].vert;
		offsets = asteroids[i].offsets;

		// draw a path
		ctx.beginPath();
		ctx.moveTo(
			x + r * offsets[0] * Math.cos(a),
			y + r * offsets[0] * Math.sin(a)
			);

		// draw a polygon
		for (var j=1; j<vert; j++) {
			ctx.lineTo(
				x + r * offsets[j] * Math.cos(a + j * Math.PI * 2 / vert),
				y + r * offsets[j] * Math.sin(a + j * Math.PI * 2 / vert)
			)
		}
		ctx.closePath();
		ctx.stroke();
		ctx.fill();

		showBounding(asteroids[i]);
	}


	//thrust the ship
	if (ship.thrusting && !ship.dead) {
		ship.thrust.x += shipThrust * Math.cos(ship.a) / FPS;
		ship.thrust.y -= shipThrust * Math.sin(ship.a) / FPS;
		fxThrust.play();

		//draw the thruster
		if (!exploding && blinkOn) {
			ctx.fillStyle = "orange"
			ctx.strokeStyle = "yellow";
			ctx.lineWidth = shipSize / 15;
			ctx.beginPath();
			ctx.moveTo( // rear left
				ship.x - ship.r * (2/3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
				ship.y + ship.r * (2/3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
				);
			ctx.lineTo( // rear center behind the ship
				ship.x - ship.r * 5/3 * Math.cos(ship.a),
				ship.y + ship.r * 5/3 * Math.sin(ship.a)
				);
			ctx.lineTo( // rear right
				ship.x - ship.r * (2/3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
				ship.y + ship.r * (2/3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
				);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			}

	} else {
		ship.thrust.x -= friction * ship.thrust.x / FPS;
		ship.thrust.y -= friction * ship.thrust.y / FPS;
		fxThrust.stop();
	}

	//deccelerate the ship
	if (ship.braking) {
		ship.thrust.x -= (friction*1.15) * ship.thrust.x / FPS;
		ship.thrust.y -= (friction*1.15) * ship.thrust.y / FPS;
	}

	//draw triangular ship
	if (!exploding) {
		if (blinkOn && !ship.dead) {
			drawShip(ship.x, ship.y, ship.a);
		}

		//handle blinking
		if (ship.blinkNum > 0) {
			//reduce the blink time
			ship.blinkTime--;

			//reduce the blink number
			if (ship.blinkTime==0) {
				ship.blinkTime = Math.ceil(shipBlinkDuration * FPS);
				ship.blinkNum--;
			}
		}
		
	} else {
		// draw the explosion
		ctx.fillStyle = "darkred";
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI*2, false);
		ctx.fill();
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI*2, false);
		ctx.fill();
		ctx.fillStyle = "orange";
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI*2, false);
		ctx.fill();
		ctx.fillStyle = "yellow";
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI*2, false);
		ctx.fill();
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI*2, false);
		ctx.fill();
	}
	
	showBounding(ship); // show ship's collision circle

	if (showCenterDot) { // show ship's center dot
		ctx.fillStyle = "red"
		ctx.fillRect(ship.x - 1, ship.y -1, 2, 2)
	}

	//draw the lasers 
	for (var i=0; i<ship.lasers.length; i++) {
		if (ship.lasers[i].explodeTime == 0) {
			ctx.fillStyle = "salmon";
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, shipSize/15, 0, Math.PI*2, false);
			ctx.fill();
		} else {
			//draw the explosion
			ctx.fillStyle = "orangered";
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r*.75, 0, Math.PI*2, false);
			ctx.fill();
			ctx.fillStyle = "salmon";
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r*.5, 0, Math.PI*2, false);
			ctx.fill();
			ctx.fillStyle = "pink";
			ctx.beginPath();
			ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r*.25, 0, Math.PI*2, false);
			ctx.fill();
		}
		
	}

	// detect laser hit on asteroids
	var ax, ay, ar, lx, ly;
	for (var i=asteroids.length-1; i>=0; i--) {

		//grab the asteroid properties
		ax = asteroids[i].x;
		ay = asteroids[i].y;
		ar = asteroids[i].r;

		//loop over the lasers
		for (var j=ship.lasers.length-1; j>=0; j--) {
			//grab the laser properties
			lx = ship.lasers[j].x;
			ly = ship.lasers[j].y;

			//detect hits
			if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {

				//destroy the asteroid and activate laser explosion
				destroyAsteroid(i);
				ship.lasers[j].explodeTime = Math.ceil(laserExplodeDuration * FPS);

				break;
			}
		}
	}

	//draw game text
	if (textAlpha >= 0) {
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
		ctx.font = "small-caps " + textSize + "px impact";
		ctx.fillText(text, canv.width/2, canv.height * 0.75);
		textAlpha -= (1.0 / textFadeTime / FPS);
	} else if (ship.dead) {
		newGame();
	}

	//check for asteroid collisions
	if (!exploding) {

		//only check when not blinking
		if (ship.blinkNum == 0 && !ship.dead) {
			for (var i=0; i<asteroids.length; i++) {
				a = asteroids[i];
				if (distBetweenPoints(ship.x, ship.y, a.x, a.y) < ship.r + a.r) {
					explodeShip();
					destroyAsteroid(i);
					break;
				}
			}
		}

		//rotate ship
		ship.a += ship.rot;

		//move ship
		ship.x += ship.thrust.x;
		ship.y += ship.thrust.y;
	} else {
		//reduce explode time
		ship.explodeTime--;

		//reset the ship after the explosion has finished
		if (ship.explodeTime == 0) {
			lives--;
			if (lives == 0) {
				gameOver()
			} else {
				ship = newShip();
			}
		}
	}

	handleEdge(ship);

	//move the lasers
	for (var i=ship.lasers.length-1; i>=0; i--) {

		//check distance traveled
		if (ship.lasers[i].dist > laserDist * canv.width) {
			ship.lasers.splice(i, 1);
			continue;
		}

		//handle the explosion
		if (ship.lasers[i].explodeTime > 0) {
			ship.lasers[i].explodeTime--;

			//destroy the laser after duration is up
			if (ship.lasers[i].explodeTime == 0) {
				ship.lasers.splice(i, 1);
				continue;
			}

		} else {
			//move the laser
			ship.lasers[i].x += ship.lasers[i].xv;
			ship.lasers[i].y += ship.lasers[i].yv;

			//calculate the distance traveled
			ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
		}

		//handle edge of screen
		if (ship.lasers[i].x < 0) {
			ship.lasers[i].x = canv.width;
		} else if (ship.lasers[i].x > canv.width) {
			ship.lasers[i].x = 0;
		}

		if (ship.lasers[i].y < 0) {
			ship.lasers[i].y = canv.height;
		} else if (ship.lasers[i].y > canv.height) {
			ship.lasers[i].y = 0;
		}
	}


	// move the asteroid
	for (var i=0; i<asteroids.length; i++) {
		asteroids[i].x += asteroids[i].xv;
		asteroids[i].y += asteroids[i].yv;
		handleEdge(asteroids[i]);
	}
}