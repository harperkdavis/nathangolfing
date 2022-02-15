let game = {

}

function setup() {
    createCanvas(innerWidth, innerHeight);
    noiseSeed(42069024);
    randomSeed(42069024);
}

function windowResized() {
    resizeCanvas(innerWidth, innerHeight);
}

function update() {

}

function draw() {
    update();
    background(250);

    for (let i = 0; i < 20; i++) {

        line(i * 40, height / 2, i * 40 + 40, height / 2);
    }
}