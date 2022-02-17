let game = {
    level: 1,
    currentStrokes: 0,
    strokes: 0,
    ball: {
        pos: undefined,
        vel: undefined,
    },
    world: {},
    par: {
        BALL_RADIUS: 0.1,
        BOUNCINESS: 0.5,
        FRICTION: 0.95,
        SHOT_POWER: 0.04,
    },

    particles: [],

    shotStart: undefined,
    shotNormalized: undefined,
    shotPower: 0,
    shotDir: 0,

    resetTimer: 0,

    canShoot: true,

    transitioning: false,
    transitionStart: 0,
    transitionAnim: 0,

    cameraX: 0,
    pcameraX: 0,

    frameCount: 0,
}

let SCALE_CONSTANT = 0;
let nathanImage = undefined;

function createVec(x1, y1) {
    return {x: x1, y: y1};
}

function magnitude(v) {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}

function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y;
}

function normalize(v) {
    let magn = magnitude(v);
    if (magn === 0) {
        return {x: 0, y: 0};
    }
    return {x: v.x / magn, y: v.y / magn};
}

function multiply(v, a) {
    return {x: v.x * a, y: v.y * a};
}

function setup() {
    loadGame();

    createCanvas(windowWidth, windowHeight);
    windowResized();

    textFont('IBM Plex Mono');

    nathanImage = loadImage('https://i.imgur.com/Eo0ULZd.png');

}

function reset() {

    game.shotStart = createVec(0, 0);
    game.shotNormalized = createVec(0, 0);

    game.ball.pos = createVec(2, 6 - game.par.BALL_RADIUS - 0.01);
    game.ball.vel = createVec(0, 0);
    

    noiseSeed(420690);
    randomSeed(42069024);

    game.world = {
        lastlast: {
            points: [
                createVec(-64, 6),
                createVec(-32, 6),
            ],
            hole: createVec(-1000, 0),
            holeIndices: [],
            number: -2,
        },
        last: {
            points: [
                createVec(-32, 6),
                createVec(0, 6),
            ],
            holeIndices: [],
            hole: createVec(2, 6, 0),
            number: -1,
        },
        current: {
            points: [
                createVec(0, 6),
                createVec(25.75, 6),
                createVec(25.75, 6.4),
                createVec(26, 6.5),
                createVec(26.25, 6.4),
                createVec(26.25, 6),
                createVec(28, 6),
            ],
            holeIndices: [1, 2, 3, 4, 5],
            hole: createVec(26, 6),
            number: 0,
        }
    };

    game.world.next = generateLevel(28, 6, 1);
    let pt = game.world.next.points[game.world.next.points.length - 1];
    game.world.nextnext = generateLevel(pt.x, pt.y, 2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    SCALE_CONSTANT = innerWidth / 32;
}

function mousePressed() {
    game.shotStart = createVec(mouseX, mouseY);
}

function mouseReleased() {
    if (game.canShoot && game.shotPower > 0.1 && !game.transitioning) {
        game.canShoot = false;
        game.currentStrokes += 1;
        game.ball.vel.x += -game.shotNormalized.x * game.par.SHOT_POWER * game.shotPower;
        game.ball.vel.y += -game.shotNormalized.y * game.par.SHOT_POWER * game.shotPower;
    }
}

function saveGame() {
    game.frameCount = frameCount;
    localStorage.setItem('nathanGolfing', JSON.stringify(game));
}

function loadGame() {
    if (localStorage.getItem('nathanGolfing') != undefined) {
        game = JSON.parse(localStorage.getItem('nathanGolfing'));
        frameCount = game.frameCount;
    } else {
        reset();
    }
}

function addParticles(count, size, sizev, x, y, minx, maxx, miny, maxy) {
    for (let i = 0; i < count; i++) {

    }
}

function update() {
    if (frameCount % 60 === 0) {
        saveGame();
        loadGame();
    }
    if (mouseIsPressed) {
        let normTarget = normalize(createVec(mouseX - game.shotStart.x, mouseY - game.shotStart.y));
        
        game.shotDir = Math.atan2(mouseX - game.shotStart.x, mouseY - game.shotStart.y);
        game.shotNormalized = createVec(lerp(game.shotNormalized.x, normTarget.x, 0.2), lerp(game.shotNormalized.y, normTarget.y, 0.2));
        game.shotPower = lerp(game.shotPower, min(dist(mouseX, mouseY, game.shotStart.x, game.shotStart.y) / SCALE_CONSTANT, 5), 0.2);
    } else {
        game.shotNormalized = createVec(lerp(game.shotNormalized.x, 0, 0.5), lerp(game.shotNormalized.y, 0, 0.5));
        game.shotPower = lerp(game.shotPower, 0, 0.5);
    }

    let points = getPoints();

    if (!game.transitioning && game.canShoot && dist(game.world.current.hole.x, game.world.current.hole.y + 0.5, game.ball.pos.x, game.ball.pos.y) < 0.2) {
        game.transitionStart = frameCount;
        game.transitioning = true;
        game.pcameraX = game.cameraX;
        game.strokes += game.currentStrokes;
        game.currentStrokes = 0;
    }

    if (game.transitioning) {
        game.transitionAnim = (frameCount - game.transitionStart) / 400;
        game.cameraX = lerp(game.pcameraX, (game.world.current.hole.x - 1), min(game.transitionAnim * 1.5, 1));

        let holeRise = max(min(game.transitionAnim * 3 - 2, 1), 0);
        
        game.ball.vel = createVec(0, 0);
        game.ball.pos.y = game.world.current.hole.y + 0.5 * (1 - holeRise) - 0.11;

        game.canShoot = false;

        if (game.world.current.holeIndices.length >= 5) {
            let hind = game.world.current.holeIndices;
            game.world.current.points[hind[1]].y = game.world.current.hole.y + 0.4 * (1 - holeRise);
            game.world.current.points[hind[2]].y = game.world.current.hole.y + 0.5 * (1 - holeRise);
            game.world.current.points[hind[3]].y = game.world.current.hole.y + 0.4 * (1 - holeRise);
        }

        if (frameCount - game.transitionStart >= 400) {
            game.transitionAnim = 0;
            game.transitioning = false;
            game.cameraX = (game.world.current.hole.x - 1);

            let hind = game.world.current.holeIndices;
            game.world.current.points[hind[1]].y = game.world.current.hole.y;
            game.world.current.points[hind[2]].y = game.world.current.hole.y;
            game.world.current.points[hind[3]].y = game.world.current.hole.y;
            game.ball.pos.y = game.world.current.hole.y - 0.11;
            
            game.world.lastlast = {...game.world.last};
            game.world.last = {...game.world.current};
            game.world.current = {...game.world.next};
            game.world.next = {...game.world.nextnext};

            let contPoint = game.world.next.points[game.world.next.points.length - 1];
            game.world.nextnext = generateLevel(contPoint.x, contPoint.y, game.world.next.number + 1);

            game.canShoot = true;
        }

    } else {
        if (magnitude(game.ball.vel) < 0.001) {
            for (let i = 1; i < points.length; i++) {
                let point = points[i], prevPoint = points[i - 1];
                let normal = getNormal(prevPoint, point);
    
                let inter = intersect(game.ball.pos.x, game.ball.pos.y, game.ball.pos.x, game.ball.pos.y + 0.01, 
                    prevPoint.x + normal.x * game.par.BALL_RADIUS, prevPoint.y + normal.y * game.par.BALL_RADIUS, 
                    point.x + normal.x * game.par.BALL_RADIUS, point.y + normal.y * game.par.BALL_RADIUS);
    
                if (inter !== false) {
                    game.canShoot = true;
                    game.ball.vel = createVec(0, 0);
                    break;
                }
            }
        }
    
        if (!game.canShoot) {
            game.canShoot = false;
            game.ball.vel.y += 0.0012;
        }

        let newPos = createVec(game.ball.pos.x + game.ball.vel.x, game.ball.pos.y + game.ball.vel.y); 

        for (let j = 0; j < 3; j++) {
            for (let i = 1; i < points.length; i++) {
                stroke(0);
                let point = points[i], prevPoint = points[i - 1];
                let normal = getNormal(prevPoint, point);
                
                let inter = intersect(game.ball.pos.x, game.ball.pos.y, newPos.x, newPos.y, 
                    prevPoint.x + normal.x * game.par.BALL_RADIUS, prevPoint.y + normal.y * game.par.BALL_RADIUS, 
                    point.x + normal.x * game.par.BALL_RADIUS, point.y + normal.y * game.par.BALL_RADIUS);
                
                let hadCollision = false;

                if (inter !== false) {
                    hadCollision = true;
                } else {
                    if (distToSegment(prevPoint, game.ball.pos, newPos) < game.par.BALL_RADIUS) {
                        let outDir = normalize(createVec(newPos.x - prevPoint.x, newPos.y - prevPoint.y));
                        outDir = createVec(-outDir.x, -outDir.y);
                        inter = createVec(prevPoint.x + outDir.x * game.par.BALL_RADIUS, prevPoint.y + outDir.y * game.par.BALL_RADIUS);
                        normal = createVec(outDir.x, outDir.y);
                        hadCollision = true;
                    }
                    if (distToSegment(point, game.ball.pos, newPos) < game.par.BALL_RADIUS) {
                        let outDir = normalize(createVec(newPos.x - point.x, newPos.y - point.y));
                        inter = createVec(point.x + outDir.x * game.par.BALL_RADIUS, point.y + outDir.y * game.par.BALL_RADIUS);
                        normal = createVec(outDir.x, outDir.y);
                        hadCollision = true;
                    }
                }

                if (hadCollision) {
                    let dot = dotProduct(game.ball.vel, normal);
                    let normDot = 1 - Math.abs(dotProduct(normalize(game.ball.vel), normal));
                    game.ball.vel = createVec(game.ball.vel.x - 2 * dot * normal.x, game.ball.vel.y - 2 * dot * normal.y);
                    game.ball.vel = multiply(game.ball.vel, lerp(game.par.BOUNCINESS, game.par.FRICTION, normDot));
                    newPos.x = inter.x + game.ball.vel.x;
                    newPos.y = inter.y + game.ball.vel.y;
                }
            }
        }

        game.ball.pos.x = newPos.x;
        game.ball.pos.y = newPos.y;
        
        

        if (game.ball.pos.x * SCALE_CONSTANT - game.cameraX * SCALE_CONSTANT > width || game.ball.pos.x * SCALE_CONSTANT - game.cameraX * SCALE_CONSTANT < 0 || game.ball.pos.y > 9) {
            game.resetTimer += 1;
            if (game.resetTimer > 120) {
                game.ball.pos.x = game.world.last.hole.x;
                game.ball.pos.y = game.world.last.hole.y - game.par.BALL_RADIUS - 0.01;
                game.ball.vel = createVec(0, 0);
            }
        } else {
            game.resetTimer = 0;
        }
    }

}

function getPoints() {
    let points = [];
    points = points.concat(game.world.last.points);
    points = points.concat(game.world.current.points);
    points = points.concat(game.world.next.points);
    return points;
}

function getAllPoints() {
    let points = [];
    points = points.concat(game.world.lastlast.points);
    points = points.concat(game.world.last.points);
    points = points.concat(game.world.current.points);
    points = points.concat(game.world.next.points);
    points = points.concat(game.world.nextnext.points);
    return points;
}

function generateLevel(sx, sy, l) {
    let points = [createVec(sx, sy)];
    let hole = createVec(sx + floor(noiseGen(l * 100, 100, 17, 31)) + 0.5, 0);
    let holeIndices = [];
    let hasHole = false;

    let i = 0;
    do {
        i++;
        let x = points[i - 1].x + floor(1 + random(0, 4));
        let heightFactor = min(l / 100 + 0.5, 1);
        let y = min(max((floor(noiseGen(x * 2, 40, -2, 2) + noiseGen(x, 0, -5, 5) + noiseGen(x * 0.01, 20, -10, 10) + (1 - heightFactor) * 18) * heightFactor * 2) / 2, -6), 6);
        
        let rnd = noiseGen(i * 10, 10);
        
        if (!hasHole && x > hole.x) {
            y = points[i - 1].y;
            hole.y = y;
            hasHole = true;
            
            points.push(createVec(hole.x - 0.25, hole.y));
            points.push(createVec(hole.x - 0.25, hole.y + 0.4));
            points.push(createVec(hole.x, hole.y + 0.5));
            points.push(createVec(hole.x + 0.25, hole.y + 0.4));
            points.push(createVec(hole.x + 0.25, hole.y));

            holeIndices = [i, i + 1, i + 2, i + 3, i + 4];

            points.push(createVec(x, y));
            break;
        } else if (rnd > 0.3) {
            y = points[i - 1].y;
        } else if (rnd < -0.4) {
            if (!(points.length >= 2 && points[i - 2].x === points[i - 1].x)) {
                x = points[i - 1].x;
            }
        }

        if (l > 10000 && x > sx + 16) {
            y = -10000;
        }
        
        points.push(createVec(x, y));
    } while (points[i].x < sx + 32);


    hole = createVec(hole.x, hole.y);

    let level = {
        points: points,
        hole: hole,
        holeIndices: holeIndices,
        number: l,
    }
    
    return level;
}

function amongUsInRealLife() {
    let cl = game.world.current;
    game.canShoot = true;
    game.transitioning = false;
    game.ball.pos.x = cl.hole.x; 
    game.ball.pos.y = cl.hole.y + 0.5;
    game.ball.vel = createVec(0, 0);
    update();
    frameCount += 401;
    update();
}

function noiseGen(x, y = 0, min = -1, max = 1, pow = 1) {
    return map(Math.pow(map(noise(x, y), 0, 1, -1, 1), pow), -1, 1, min, max);
}

function worldToScreen(point) {
    return createVec(point.x * SCALE_CONSTANT, height / 2 + point.y * SCALE_CONSTANT);
}

function getNormal(pa, pb) {
    let dx = pa.x - pb.x;
    let dy = pa.y - pb.y;
    return normalize(createVec(-dy, dx));
}

function draw() {
    update();
    textStyle(NORMAL);
    background(250);

    // world
    push();
    translate(-game.cameraX * SCALE_CONSTANT, 0);

    let points = getAllPoints();
    let currentLevel = game.world.current;

    if (currentLevel.holeIndices.length >= 5) {
        let hPos = worldToScreen(currentLevel.points[currentLevel.holeIndices[4]]);
        hPos.y += game.transitionAnim * 200;
        stroke(0);
        fill(255, 255, 150);

        textAlign(LEFT, CENTER);
        textSize(0.4 * SCALE_CONSTANT);

        let flagWidth = 0.2 * SCALE_CONSTANT + textWidth(currentLevel.number);
        
        beginShape(TESS);
        vertex(hPos.x, hPos.y - 1 * SCALE_CONSTANT);
        vertex(hPos.x + flagWidth, hPos.y - 1 * SCALE_CONSTANT);
        vertex(hPos.x + flagWidth + 0.1 * SCALE_CONSTANT, hPos.y - 0.75 * SCALE_CONSTANT);
        vertex(hPos.x + flagWidth, hPos.y - 0.5 * SCALE_CONSTANT);
        vertex(hPos.x, hPos.y - 0.5 * SCALE_CONSTANT);
        endShape();

        noStroke();
        fill(10, 10, 30);
        text(currentLevel.number, hPos.x + 0.15 * SCALE_CONSTANT, hPos.y - 0.72 * SCALE_CONSTANT);

        stroke(0);
        fill(255);
        rect(hPos.x, hPos.y - 1 * SCALE_CONSTANT, 0.1 * SCALE_CONSTANT, 1 * SCALE_CONSTANT);
    }

    noStroke();
    colorMode(HSB);
    fill(220, Math.abs(Math.sin(currentLevel.number / 1000) * 15) + currentLevel.number / 10000 * 50, 75);

    beginShape(TESS);
    for (let i = 0; i < points.length; i++) {
        let point = worldToScreen(points[i]);
        vertex(point.x, point.y);
    }
    vertex(points[points.length - 1].x * SCALE_CONSTANT, height);
    vertex(0, height);
    endShape();

    colorMode(RGB);

    for (let i = 1; i < points.length; i++) {
        stroke(0);
        let point = worldToScreen(points[i]), prevPoint = worldToScreen(points[i - 1]);
        line(prevPoint.x, prevPoint.y, point.x, point.y);
    }

    stroke(0);
    let ballPos = worldToScreen(game.ball.pos);
    let ballRad = game.par.BALL_RADIUS * SCALE_CONSTANT * 2;
    imageMode(CENTER);
    image(nathanImage, ballPos.x, ballPos.y, ballRad, ballRad);

    noFill();
    circle(ballPos.x, ballPos.y, ballRad);

    noStroke();
    textAlign(CENTER, CENTER);
    textSize(1 * SCALE_CONSTANT);
    fill(0);
    text("Nathan Golfing", width / 2, height / 2);

    pop();

    // shoot

    stroke(0, min(game.shotPower * 400, 100));
    noFill();

    let circMaxRadius = 0.5 * SCALE_CONSTANT;
    let shotDist = max(game.shotPower * SCALE_CONSTANT - circMaxRadius / 2, 0) + circMaxRadius / 2;
    line(game.shotStart.x + game.shotNormalized.x * (circMaxRadius / 2), game.shotStart.y + game.shotNormalized.y * (circMaxRadius / 2), game.shotStart.x + game.shotNormalized.x * shotDist, game.shotStart.y + game.shotNormalized.y * shotDist);
        
    stroke(0, min(game.shotPower * 400, game.canShoot ? 200 : 50));
    line(game.shotStart.x - game.shotNormalized.x * (circMaxRadius / 2), game.shotStart.y - game.shotNormalized.y * (circMaxRadius / 2), game.shotStart.x - game.shotNormalized.x * shotDist, game.shotStart.y - game.shotNormalized.y * shotDist);
    line(game.shotStart.x - game.shotNormalized.x * shotDist, game.shotStart.y - game.shotNormalized.y * shotDist, game.shotStart.x - game.shotNormalized.x * shotDist + Math.sin(game.shotDir + 0.5) * 0.2 * SCALE_CONSTANT, game.shotStart.y - game.shotNormalized.y * shotDist + Math.cos(game.shotDir + 0.5) * 0.2 * SCALE_CONSTANT);
    line(game.shotStart.x - game.shotNormalized.x * shotDist, game.shotStart.y - game.shotNormalized.y * shotDist, game.shotStart.x - game.shotNormalized.x * shotDist + Math.sin(game.shotDir - 0.5) * 0.2 * SCALE_CONSTANT, game.shotStart.y - game.shotNormalized.y * shotDist + Math.cos(game.shotDir - 0.5) * 0.2 * SCALE_CONSTANT);

    // console.log(game.shotNormalized);

    let circRad = min(game.shotPower * SCALE_CONSTANT * 2, circMaxRadius);

    stroke(0, min(game.shotPower * 400, game.canShoot ? 300 : 150));
    circle(game.shotStart.x, game.shotStart.y, circRad);

    let endPos = createVec(game.shotStart.x + game.shotNormalized.x * game.shotPower * SCALE_CONSTANT, game.shotStart.y + game.shotNormalized.y * game.shotPower * SCALE_CONSTANT);
        
    fill(0, min(game.shotPower * 400, 200));
    noStroke();
    circle(endPos.x, endPos.y, 10);

    fill(0);
    noStroke();
    textSize(24);
    textStyle(BOLD);
    textAlign(RIGHT, TOP);
    text(game.strokes, width / 2 - 8, 8);

    textSize(12);
    text('avg ' + nf(game.strokes / max(currentLevel.number, 1), 1, 2), width / 2 - 8, 36);

    if (game.currentStrokes > 0) {
        textStyle(NORMAL);
        textSize(24);
        textAlign(LEFT, TOP);
        text('+' + game.currentStrokes, width / 2 + 8, 8);
    }

}

// https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    let l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    // Check if none of the lines are of length 0
      if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
          return false;
      }
  
      denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  
    // Lines are parallel
      if (denominator === 0) {
          return false;
      }
  
      let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
      let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  
    // is the intersection along the segments
      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
          return false;
      }
  
    // Return a object with the x and y coordinates of the intersection
      let x = x1 + ua * (x2 - x1);
      let y = y1 + ua * (y2 - y1);
  
      return createVec(x, y);
  }