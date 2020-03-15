let myLayeredCanvas = document.querySelector("#layered-canvas");
let myForm = document.querySelector("form");
let boxRight = document.querySelector(".box-right");
let sizeInput = document.querySelector("#size");
let lifeInput = document.querySelector("#life");
let speedInput = document.querySelector("#speed");
let playBtn = document.querySelector("#play-button")
let accText = document.querySelector("#accuracy")
let blipAudio = document.querySelector("audio");

let rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
let defaultColor = "#FF9034";
let hoverColor = "#34FFFF";
let clickColor = "#34FF8C";
let decayColor = "#FF5E34";

let size = localStorage.getItem("size") ? parseFloat(localStorage.getItem("size")) : 3;
let life = localStorage.getItem("life") ? parseFloat(localStorage.getItem("life")) : 0.75;
let speed = localStorage.getItem("speed") ? parseFloat(localStorage.getItem("speed")) : 1.5;

sizeInput.value = size;
lifeInput.value = life;
speedInput.value = speed;

let totalCircles = 0;
let clickedCircles = 0;
accText.textContent = "0.00%";
function updateAccText() {
    accText.textContent = (clickedCircles / totalCircles * 100).toFixed(2) + "%";
}

class Circle {
    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.r = size * rem;
        this.mouseOver = false;
        this.isDead = false;
        this.disappearInterval;
        this.ctx = document.createElement("canvas").getContext("2d");
        this.ctx.canvas.setAttribute("width", this.r * 2);
        this.ctx.canvas.setAttribute("height", this.r * 2);
        this.ctx.canvas.setAttribute("style", `left: ${this.x}px; top: ${this.y}px;`);
        this.ctx.canvas.addEventListener("mousemove", this.collisionHandler);
        this.ctx.canvas.addEventListener("mouseleave", this.mouseLeave);
        this.ctx.canvas.addEventListener("click", this.kill);

        myLayeredCanvas.appendChild(this.ctx.canvas);
        this.draw(defaultColor);
        setTimeout(this.decay, 1000 * life);
    }
    draw = (color) => {
        this.ctx.clearRect(0, 0, this.r * 2, this.r * 2);
        this.ctx.moveTo(this.r * 2, this.r);
        this.ctx.beginPath();
        this.ctx.arc(this.r, this.r, this.r, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    distanceFromCenter = (x, y) => {
        return Math.sqrt(Math.pow(Math.abs(this.x + this.r - x), 2) + Math.pow(Math.abs(this.y + this.r - y), 2));
    }
    mouseLeave = () => {
        this.mouseOver = false;
        if (!this.isDead) {
            this.draw(defaultColor);
        }
    }
    collisionHandler = (event) => {
        if (!this.isDead) {
            if (this.distanceFromCenter(event.pageX, event.pageY) < this.r) {
                this.mouseOver = true;
                this.draw(hoverColor);
            } else {
                this.mouseOver = false;
                this.draw(defaultColor);
            }
        }
    }
    fade = (timer, factor, color) => {
        if (!this.isDead) {
            let self = this; // for the anonymous function
            //only fade if not already dead
            this.isDead = true;
            updateAccText();
            this.disappearInterval = setInterval(function () {
                timer--;
                if (timer === 0) {
                    // delete circle once timer runs out
                    self.ctx.canvas.remove();
                    clearInterval(self.disappearInterval);
                } else {
                    // create a dynamic gradient to fill the circle area with
                    let grdR0 = self.r - self.r / (timer / factor) > 0 ? self.r - self.r / (timer / factor) : 0;
                    let grd = self.ctx.createRadialGradient(self.r, self.r, grdR0, self.r, self.r, self.r);
                    grd.addColorStop(0, color);
                    grd.addColorStop(1, "transparent");
                    self.draw(grd);
                }  
            }, 1);
        }
    }
    //default fade settings
    kill = () => {
        if (!this.isDead) {
            clickedCircles++;
            blipAudio.play();
            this.fade(50, 1, clickColor);
        }
    }
    decay = () => {
        this.fade(150, 3, decayColor);
    }
}

function createCircle() {
    //random position
    let x = Math.floor(Math.random() * (innerWidth - size * rem * 2));
    let y = Math.floor(Math.random() * (innerHeight - size * rem * 2));
    // prevent the circle from being inside the header boxes...
    let boxLeftBoundaryX = myForm.offsetLeft + myForm.offsetWidth;
    let boxRightBoundaryX = boxRight.offsetLeft - size * rem * 2;
    let boxBoundaryY = myForm.offsetTop + myForm.offsetHeight;
    while ((x < boxLeftBoundaryX || x > boxRightBoundaryX) && y < boxBoundaryY) {
        x = Math.floor(Math.random() * (innerWidth - size * rem * 2));
        y = Math.floor(Math.random() * (innerHeight - size * rem * 2));
    }
    new Circle(x, y);
    totalCircles++;
}

let circleInterval;

myForm.addEventListener("keyup", function(event) {
    event.preventDefault();
    // update and start demo when the user presses enter on the form
    if (event.keyCode === 13) {
        size = parseFloat(sizeInput.value);
        life = parseFloat(lifeInput.value);
        speed = parseFloat(speedInput.value);
        localStorage.setItem("size", size);
        localStorage.setItem("life", life);
        localStorage.setItem("speed", speed);
        if (circleInterval) {
            clearInterval(circleInterval);
            circleInterval = null;
        }
        createCircle();
        circleInterval = setInterval(createCircle, 1000 / speed);
        playBtn.textContent = "Stop";
    }
});

playBtn.addEventListener("click", function(event) {
    event.stopPropagation();
    if (!circleInterval) {
        //start demo
        totalCircles = 0;
        clickedCircles = 0;
        accText.textContent = "0.00%";
        createCircle();
        circleInterval = setInterval(createCircle, 1000 / speed);
        playBtn.textContent = "Stop"; // toggle button text
    } else {
        //stop demo
        while (myLayeredCanvas.childElementCount > 0) {
            myLayeredCanvas.firstChild.remove();
        }
        clearInterval(circleInterval);
        circleInterval = null;
        playBtn.textContent = "Start";
    }
});