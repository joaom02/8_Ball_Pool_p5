let poolWidth = 1280,
    poolHeight = 720;
let margin = 50;
let ballRadius = 20;
let friction = 0.04; // já não usado
let rollingFriction = 0.02;
let dragCoefficient = 0.001;
let gravity = 0.5;
let balls = [];
let pockets = [];
let solidScore = 0;
let stripedScore = 0;
let pocketedSolids = [];
let pocketedStripes = [];
let cueBall;
let currentDragVector = null;
let cueForce = 0;
let startingClickPoint;
let solids = [1, 2, 3, 4, 5, 6, 7];
let stripes = [9, 10, 11, 12, 13, 14, 15];
let objectBallData = new Array(15).fill(null);
objectBallData[4] = { number: 8, type: "black" };
let gameOver = false;
let gameOverTime = 0;
const gameOverDelay = 3000;

function setup() {
  createCanvas(poolWidth, poolHeight);
  frameRate(60);
  initGame();
}

function initGame() {
  balls = [];
  pockets = [];
  solidScore = 0;
  stripedScore = 0;
  pocketedSolids = [];
  pocketedStripes = [];
  gameOver = false;

  pockets.push(createVector(margin + 20, margin + 20));
  pockets.push(createVector(poolWidth / 2, margin));
  pockets.push(createVector(poolWidth - margin - 20, margin + 20));
  pockets.push(createVector(margin + 20, poolHeight - margin - 20));
  pockets.push(createVector(poolWidth / 2, poolHeight - margin));
  pockets.push(createVector(poolWidth - margin - 20, poolHeight - margin - 20));

  let cueX = poolWidth * 0.25;
  let cueY = poolHeight / 2;
  cueBall = new Ball(cueX, cueY, 0, 6, "cue");
  balls.push(cueBall);

  let numCols = 5;
  let spacing = 5;
  let pyramidX = poolWidth * 0.65; 
  let positions = [];
  
  for (let col = 0; col < numCols; col++) {
    let numBallsInCol = col + 1;
    let colX = pyramidX + col * (ballRadius * 2 + spacing);
    let colHeight = (numBallsInCol - 1) * (ballRadius * 2 + spacing);
    let startY = poolHeight / 2 - colHeight / 2;
    for (let row = 0; row < numBallsInCol; row++) {
      let posY = startY + row * (ballRadius * 2 + spacing);
      positions.push(createVector(colX, posY));
    }
  }

  let remainingData = [];
  for (let n of solids) {
    remainingData.push({ number: n, type: "solid" });
  }
  for (let n of stripes) {
    remainingData.push({ number: n, type: "striped" });
  }
  shuffleArray(remainingData);
  
  let dataIndex = 0;
  for (let i = 0; i < positions.length; i++) {
    if (objectBallData[i] === null) {
      objectBallData[i] = remainingData[dataIndex];
      dataIndex++;
    }
  }
  
  for (let i = 0; i < positions.length; i++) {
    let pos = positions[i];
    let data = objectBallData[i];
    let mass = 5.5;
    let newBall = new Ball(pos.x, pos.y, data.number, mass, data.type);
    if (data.type === "solid" || data.type === "striped") {
      newBall.col = color(random(50, 255), random(50, 255), random(50, 255));
    }
    balls.push(newBall);
  }
}

function draw() {
  if (gameOver) {
    background(30, 100, 30);
    fill(255);
    textSize(72);
    textAlign(CENTER, CENTER);
    text("Fim de Jogo!", poolWidth / 2, poolHeight / 4);
    
    textSize(36);
    text("Bolas Sólidas:", poolWidth / 2, poolHeight / 2 - 100);
    let startX = poolWidth / 2 - (pocketedSolids.length * (ballRadius * 2 + 10)) / 2;
    let y = poolHeight / 2 - 50;
    for (let i = 0; i < pocketedSolids.length; i++) {
      fill(pocketedSolids[i].col);
      ellipse(startX + i * (ballRadius * 2 + 10), y, ballRadius * 2);
      fill(0);
      textSize(24);
      textAlign(CENTER, CENTER);
      text(pocketedSolids[i].number, startX + i * (ballRadius * 2 + 10), y);
    }
    
    textSize(36);
    text("Bolas Listradas:", poolWidth / 2, poolHeight / 2 + 50);
    startX = poolWidth / 2 - (pocketedStripes.length * (ballRadius * 2 + 10)) / 2;
    y = poolHeight / 2 + 100;
    for (let i = 0; i < pocketedStripes.length; i++) {
      fill(pocketedStripes[i].col);
      ellipse(startX + i * (ballRadius * 2 + 10), y, ballRadius * 2);
      fill(255);
      rectMode(CENTER);
      rect(startX + i * (ballRadius * 2 + 10), y, ballRadius, ballRadius / 2);
      fill(0);
      textSize(24);
      textAlign(CENTER, CENTER);
      text(pocketedStripes[i].number, startX + i * (ballRadius * 2 + 10), y);
    }
    
    return;
  }

    noStroke();
    fill(139, 69, 19);
    rect(0, 0, poolWidth, poolHeight);

    fill(30, 100, 30);
    rect(margin, margin, poolWidth - 2 * margin, poolHeight - 2 * margin);

    let shadowOffset = 8;
    let shadowBorder = 90;
    noStroke();
    fill(0, 0, 0, shadowBorder);
    rect(margin, margin, shadowOffset* 2, poolHeight - margin * 2);

    noStroke();
    fill(0, 0, 0, shadowBorder);
    rect(margin, margin, poolWidth - margin * 2, shadowOffset*2);

    noStroke();
    fill(0, 0, 0, shadowBorder);
    rect(margin, poolHeight - margin - shadowOffset, poolWidth - margin * 2, shadowOffset);

    noStroke();
    fill(0, 0, 0, shadowBorder);
    rect(poolWidth - margin - shadowOffset, margin, shadowOffset, poolHeight - margin * 2);

    stroke(255);
    strokeWeight(3);
    for (let p of pockets) {
        let dia = 60;
        if (abs(p.x - (margin + 20)) < 1 || abs(p.x - (poolWidth - margin - 20)) < 1) {
        dia = 80;
        }
        fill(0);
        ellipse(p.x, p.y, dia);
    }
    noStroke();

    for (let b of balls) {
        b.update();
        b.show();
    }

  checkBallCollisions();

  for (let i = balls.length - 1; i >= 0; i--) {
    if (balls[i].pocketed) {
      balls.splice(i, 1);
    }
  }

  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Sólidas: " + solidScore, margin + 70, margin + 20);
  text("Listradas: " + stripedScore, margin + 70, margin + 50);

  if (cueBall.vel.mag() === 0 && currentDragVector) {
    let cueDir = currentDragVector.copy().normalize();
    stroke(255);
    strokeWeight(4);
    let startLine = p5.Vector.sub(cueBall.pos, cueDir.copy().mult(30));
    let endLine = p5.Vector.sub(cueBall.pos, cueDir.copy().mult(cueForce + 30));
    line(startLine.x, startLine.y, endLine.x, endLine.y);
  }
}

class Ball {
  constructor(x, y, number, mass, type) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.number = number;
    this.mass = mass;
    this.type = type;
    this.pocketed = false;
    this.z = 0;
    this.vz = 0;
    
    if (type === "cue") {
      this.col = color(255);
    } else if (type === "black") {
      this.col = color(0);
    }
  }
  
  update() {
    if (this.vel.mag() > 0) {
      let frictionForce = this.vel.copy().normalize().mult(rollingFriction);
      if (this.vel.mag() > frictionForce.mag()) {
        this.vel.sub(frictionForce);
      } else {
        this.vel.set(0, 0);
      }
    }
    let speedSq = this.vel.magSq();
    if (this.vel.mag() > 0) {
      let dragForce = this.vel.copy().normalize().mult(-dragCoefficient * speedSq);
      this.vel.add(dragForce);
    }

    this.pos.add(this.vel);
    this.vz += gravity;
    this.z += this.vz;
    if (this.z > 0) {
      this.z = 0;
      this.vz = 0;
    }
    
    this.checkWallCollision();
    this.checkPockets();
  }
  
  checkWallCollision() {
    let left = margin, right = poolWidth - margin, top = margin, bottom = poolHeight - margin;
    if (this.pos.x - ballRadius < left || this.pos.x + ballRadius > right) {
      this.vel.x *= -1;
      this.pos.x = constrain(this.pos.x, left + ballRadius, right - ballRadius);
    }
    if (this.pos.y - ballRadius < top || this.pos.y + ballRadius > bottom) {
      this.vel.y *= -1;
      this.pos.y = constrain(this.pos.y, top + ballRadius, bottom - ballRadius);
    }
  }
  
  checkPockets() {
    for (let p of pockets) {
      if (dist(this.pos.x, this.pos.y, p.x, p.y) < 30) {
        if (this.type === "cue") {
          this.pos = createVector(margin + 100, poolHeight / 2);
          this.vel.set(0, 0);
        } else if (this.type === "black") {
          gameOver = true;
          gameOverTime = millis();
          this.pocketed = true;
        } else {
          if (this.type === "solid") {
            solidScore++;
            pocketedSolids.push({ number: this.number, col: this.col });
          } else if (this.type === "striped") {
            stripedScore++;
            pocketedStripes.push({ number: this.number, col: this.col });
          }
          this.pocketed = true;
        }
      }
    }
  }
  
  show() {
    if (this.pocketed) return;
    let shadowAlpha = 150;
    let shadowScale = 1;
    if (this.z < 0) {
      shadowAlpha = map(this.z, -20, 0, 50, 150, true);
      shadowScale = map(this.z, -20, 0, 0.8, 1, true);
    }
    noStroke();
    fill(0, 0, 0, shadowAlpha);
    ellipse(this.pos.x + 5, this.pos.y + 5, ballRadius * 2 * shadowScale);

    fill(this.col);
    ellipse(this.pos.x, this.pos.y + this.z, ballRadius * 2 * shadowScale);

    if (this.type === "striped") {
      fill(255);
      rect(this.pos.x - ballRadius / 2, this.pos.y + this.z - ballRadius / 4, ballRadius, ballRadius / 2);
    }

    if (this.type === "black") {
      fill(255);
    } else {
      fill(0);
    }
    textSize(24);
    textAlign(CENTER, CENTER);
    text(this.number, this.pos.x, this.pos.y + this.z);
  }
}

function checkBallCollisions() {
  let restitution = 0.9;
  let frictionCoefficient = 0.1;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      let ballA = balls[i];
      let ballB = balls[j];
      if (ballA.pocketed || ballB.pocketed) continue;
      
      let collisionVec = p5.Vector.sub(ballB.pos, ballA.pos);
      let distance = collisionVec.mag();
      let minDist = ballRadius * 2;
      
      if (distance < minDist && distance > 0) {
        let overlap = minDist - distance;
        let correction = collisionVec.copy().normalize().mult(overlap / 2);
        ballA.pos.sub(correction);
        ballB.pos.add(correction);
        
        let normal = collisionVec.copy().normalize();
        let relativeVel = p5.Vector.sub(ballB.vel, ballA.vel);
        let velAlongNormal = relativeVel.dot(normal);
        if (velAlongNormal > 0) continue;
        
        let impulseScalar = -(1 + restitution) * velAlongNormal / (1/ballA.mass + 1/ballB.mass);
        let impulse = normal.copy().mult(impulseScalar);
        
        ballA.vel.sub(impulse.copy().div(ballA.mass));
        ballB.vel.add(impulse.copy().div(ballB.mass));

        if (abs(impulseScalar) > 5) {
          ballA.vz = -abs(impulseScalar) / 20;
          ballB.vz = -abs(impulseScalar) / 20;
        }

        let tangent = createVector(-normal.y, normal.x);
        let relativeTangentialVel = relativeVel.dot(tangent);
        let frictionImpulseScalar = frictionCoefficient * abs(impulseScalar);
        let frictionImpulse = tangent.copy().mult(frictionImpulseScalar * (relativeTangentialVel < 0 ? 1 : -1));
        ballA.vel.sub(frictionImpulse.copy().div(ballA.mass));
        ballB.vel.add(frictionImpulse.copy().div(ballB.mass));
      }
    }
  }
}

function mousePressed() {
  if (cueBall.vel.mag() === 0) {
    startingClickPoint = createVector(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (cueBall.vel.mag() === 0) {
    currentDragVector = createVector(mouseX, mouseY).sub(cueBall.pos);
    cueForce = constrain(currentDragVector.mag(), 0, 300);
  }
}

function mouseReleased() {
  if (cueBall.vel.mag() === 0 && currentDragVector) {
    let forceVec = currentDragVector.copy().normalize().mult(-cueForce * 0.2);
    cueBall.vel.add(forceVec);
    cueForce = 0;
    currentDragVector = null;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
