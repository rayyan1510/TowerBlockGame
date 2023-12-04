"use strict";
console.clear();
// Set event listener for start button
document.getElementById("start-button").addEventListener("click", function () {
  game.startGame();
});

document.getElementById("start-tutor").addEventListener("click", function () {
  document.getElementById("tutorial-modal").style.display = "block";
});

// Set event listener to close tutorial modal
document.getElementById("tutorial-modal").addEventListener("click", function (event) {
  if (event.target === this || event.target.closest("#tutorial-modal")) {
    this.style.display = "none";
  }
});

// Set event listener for button in tutorial
document.getElementById("tutorial-button").addEventListener("click", function () {
  document.getElementById("tutorial-modal").style.display = "none";
});

document.getElementById("start-button").addEventListener("click", function () {
  document.getElementById("tutorial-modal").style.display = "flex";
});

document.getElementById("tutorial-button").addEventListener("click", function () {
  document.getElementById("tutorial-modal").style.display = "none";
});

document.getElementById("reset-high-score").addEventListener("click", function () {
  game.resetHighScore();
});

function ShowResetScore() {
  document.getElementById("container").classList.add("ended");
  document.getElementById("reset-high-score").style.display = "block";
}

function hideResetScore() {
  document.getElementById("container").classList.remove("ended");
  document.getElementById("reset-high-score").style.display = "none";
}

class Stage {
  constructor() {
    // container
    this.render = function () {
      this.renderer.render(this.scene, this.camera);
    };
    this.add = function (elem) {
      this.scene.add(elem);
    };
    this.remove = function (elem) {
      this.scene.remove(elem);
    };
    this.container = document.getElementById("game");
    this.container.style.background =
      "linear-gradient(to bottom, #E8A5D7, #B1E1FF)";

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // scene
    this.scene = new THREE.Scene();
    // camera
    let aspect = window.innerWidth / window.innerHeight;
    let d = 20;
    this.camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      -100,
      1000
    );
    this.camera.position.x = 2;
    this.camera.position.y = 2;
    this.camera.position.z = 2;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    //light
    this.light = new THREE.DirectionalLight(0xffffff, 0.5);
    this.light.position.set(0, 499, 0);
    this.scene.add(this.light);
    this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.softLight);
    window.addEventListener("resize", () => this.onResize());
    this.onResize();
  }
  setCamera(y, speed = 0.3) {
    TweenLite.to(this.camera.position, speed, {
      y: y + 4,
      ease: Power1.easeInOut,
    });
    TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
  }
  onResize() {
    let viewSize = 30;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;
    this.camera.updateProjectionMatrix();
  }
}
class Block {
  constructor(block) {
    // set size and position
    this.STATES = { ACTIVE: "active", STOPPED: "stopped", MISSED: "missed" };
    this.MOVE_AMOUNT = 12;
    this.dimension = { width: 0, height: 0, depth: 0 };
    this.position = { x: 0, y: 0, z: 0 };
    this.targetBlock = block;
    this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
    this.workingPlane = this.index % 2 ? "x" : "z";
    this.workingDimension = this.index % 2 ? "width" : "depth";
    // set the dimensions from the target block, or defaults.
    this.dimension.width = this.targetBlock
      ? this.targetBlock.dimension.width
      : 10;
    this.dimension.height = this.targetBlock
      ? this.targetBlock.dimension.height
      : 2;
    this.dimension.depth = this.targetBlock
      ? this.targetBlock.dimension.depth
      : 10;
    this.position.x = this.targetBlock ? this.targetBlock.position.x : 0;
    this.position.y = this.dimension.height * this.index;
    this.position.z = this.targetBlock ? this.targetBlock.position.z : 0;
    this.colorOffset = this.targetBlock
      ? this.targetBlock.colorOffset
      : Math.round(Math.random() * 100);
    // set color
    if (!this.targetBlock) {
      this.color = 0x333344;
    } else {
      let offset = this.index + this.colorOffset;
      var r = Math.sin(0.3 * offset) * 55 + 200;
      var g = Math.sin(0.3 * offset + 2) * 55 + 200;
      var b = Math.sin(0.3 * offset + 4) * 55 + 200;
      this.color = new THREE.Color(r / 255, g / 255, b / 255);
    }
    // state
    this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
    // set direction
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4;
    this.direction = this.speed;
    // create block
    let geometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );
    geometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(
        this.dimension.width / 2,
        this.dimension.height / 2,
        this.dimension.depth / 2
      )
    );
    this.material = new THREE.MeshToonMaterial({
      color: this.color,
      shading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(
      this.position.x,
      this.position.y + (this.state == this.STATES.ACTIVE ? 0 : 0),
      this.position.z
    );
    if (this.state == this.STATES.ACTIVE) {
      this.position[this.workingPlane] =
        Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
    }
  }
  reverseDirection() {
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
  }
  place() {
    this.state = this.STATES.STOPPED;
    let overlap =
      this.targetBlock.dimension[this.workingDimension] -
      Math.abs(
        this.position[this.workingPlane] -
          this.targetBlock.position[this.workingPlane]
      );
    let blocksToReturn = {
      plane: this.workingPlane,
      direction: this.direction,
    };
    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      overlap = this.dimension[this.workingDimension];
      blocksToReturn.bonus = true;
      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;
      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }
    if (overlap > 0) {
      let choppedDimensions = {
        width: this.dimension.width,
        height: this.dimension.height,
        depth: this.dimension.depth,
      };
      choppedDimensions[this.workingDimension] -= overlap;
      this.dimension[this.workingDimension] = overlap;
      let placedGeometry = new THREE.BoxGeometry(
        this.dimension.width,
        this.dimension.height,
        this.dimension.depth
      );
      placedGeometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          this.dimension.width / 2,
          this.dimension.height / 2,
          this.dimension.depth / 2
        )
      );
      let placedMesh = new THREE.Mesh(placedGeometry, this.material);
      let choppedGeometry = new THREE.BoxGeometry(
        choppedDimensions.width,
        choppedDimensions.height,
        choppedDimensions.depth
      );
      choppedGeometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(
          choppedDimensions.width / 2,
          choppedDimensions.height / 2,
          choppedDimensions.depth / 2
        )
      );
      let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
      let choppedPosition = {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      };
      if (
        this.position[this.workingPlane] <
        this.targetBlock.position[this.workingPlane]
      ) {
        this.position[this.workingPlane] =
          this.targetBlock.position[this.workingPlane];
      } else {
        choppedPosition[this.workingPlane] += overlap;
      }
      placedMesh.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );
      choppedMesh.position.set(
        choppedPosition.x,
        choppedPosition.y,
        choppedPosition.z
      );
      blocksToReturn.placed = placedMesh;
      if (!blocksToReturn.bonus) blocksToReturn.chopped = choppedMesh;
    } else {
      this.state = this.STATES.MISSED;
    }
    this.dimension[this.workingDimension] = overlap;
    return blocksToReturn;
  }
  tick() {
    if (this.state == this.STATES.ACTIVE) {
      let value = this.position[this.workingPlane];
      if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
        this.reverseDirection();
      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  }
}

class Game {
  constructor() {
    this.STATES = {
      LOADING: "loading",
      PLAYING: "playing",
      READY: "ready",
      ENDED: "ended",
      RESETTING: "resetting",
    };
    this.blocks = [];
    this.state = this.STATES.LOADING;
    this.stage = new Stage();
    this.lives = 3;
    this.mainContainer = document.getElementById("container");
    this.scoreContainer = document.getElementById("score");
    this.startButton = document.getElementById("start-button");
    this.btnTutor = document.getElementById("start-tutor");
    this.instructions = document.getElementById("instructions");
    this.modal = document.getElementById("tutorial-modal");
    this.tutorial = document.getElementById("tutorial");
    this.scoreText = document.getElementById("high-score-container");
    this.highScoreContainer = document.getElementById("high-score");
    this.resetScoreButton = document.getElementById("reset-high-score");
    this.placeSound = new Audio("./dist/sfx/blockstacking.mp3")
    // this.victorySound = new Audio(".dist/sfx/super-mario-coin-sound.mp3");
    this.defeatSound = new Audio("./dist/sfx/game-over.mp3");
    this.isVictorySoundPlayed = false;
    this.isDefeatSoundPlayed = false;
    this.loadHighScore();
    this.scoreContainer.innerHTML = "0";
    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();
    this.stage.add(this.newBlocks);
    this.stage.add(this.placedBlocks);
    this.stage.add(this.choppedBlocks);
    this.addBlock();
    this.tick();
    this.updateState(this.STATES.READY);
    // document.addEventListener("keydown", (e) => {
    //   if (e.keyCode == 32) this.onAction();
    // });
    document.addEventListener("click", (e) => {
      this.onAction();
    });
    document.addEventListener("touchstart", (e) => {
      e.preventDefault();
      // this.onAction();
      // ☝ this triggers after click on android so you
      // insta-lose, will figure it out later.
    });

    this.originalBackgroundColor = this.stage.container.style.background; // Store the original background color
    this.score = 0; // Initialize score
    this.updateBackground();
  }

  /* high score logic */
  loadHighScore() {
    // Mengambil high score dari penyimpanan lokal, jika ada
    const storedHighScore = localStorage.getItem("highScore");
    if (storedHighScore) {
      this.highScore = parseInt(storedHighScore);
      this.updateHighScore();
    }
  }

  saveHighScore() {
    // Simpan high score ke penyimpanan lokal
    localStorage.setItem("highScore", this.highScore.toString());
  }

  updateHighScore() {
    // Memperbarui tampilan high score
    this.highScoreContainer.innerHTML = this.highScore;
  }
  /* end high score logic */

  /* sfx block di letakan */
  playPlaceSound() {
    this.placeSound.currentTime = 0;
    this.placeSound.play();
  }

  /* sfx game over  */
  playGameOverSound() {
    this.defeatSound.currentTime = 0;
    this.defeatSound.play();
  }

  updateState(newState) {
    for (let key in this.STATES)
    this.mainContainer.classList.remove(this.STATES[key]);
    this.mainContainer.classList.add(newState);
    this.state = newState;
  }
  onAction() {
    switch (this.state) {
      case this.STATES.READY:
        this.startGame();
        break;
      case this.STATES.PLAYING:
        this.placeBlock();
        break;
      case this.STATES.ENDED:
        this.restartGame();
        break;
    }
  }
  startGame() {
    if (this.state != this.STATES.PLAYING) {
      this.scoreContainer.innerHTML = "0";
      this.updateState(this.STATES.PLAYING);
      this.addBlock();
      hideResetScore(); // fungsi untuk menghiden btn reset Highscore
    }
  }

  resetHighScore() {
    this.highScore = 0; // Atur high score ke 0
    this.saveHighScore(); // Simpan high score
    this.updateHighScore(); // Perbarui tampilan high score
  }

  restartGame() {
    this.updateState(this.STATES.RESETTING);
    let oldBlocks = this.placedBlocks.children;
    let removeSpeed = 0.2;
    let delayAmount = 0.02;
    for (let i = 0; i < oldBlocks.length; i++) {
      TweenLite.to(oldBlocks[i].scale, removeSpeed, {
        x: 0,
        y: 0,
        z: 0,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn,
        onComplete: () => this.placedBlocks.remove(oldBlocks[i]),
      });
      TweenLite.to(oldBlocks[i].rotation, removeSpeed, {
        y: 0.5,
        delay: (oldBlocks.length - i) * delayAmount,
        ease: Power1.easeIn,
      });
    }
    let cameraMoveSpeed = removeSpeed * 2 + oldBlocks.length * delayAmount;
    this.stage.setCamera(2, cameraMoveSpeed);
    let countdown = { value: this.blocks.length - 1 };
    TweenLite.to(countdown, cameraMoveSpeed, {
      value: 0,
      onUpdate: () => {
        this.scoreContainer.innerHTML = String(Math.round(countdown.value));
      },
    });
    this.blocks = this.blocks.slice(0, 1);
    setTimeout(() => {
      this.startGame();
    }, cameraMoveSpeed * 1000);
    this.score = 0; // Initialize score
    this.updateBackground();
    hideResetScore(); // untuk menghide reset highschore
  }
  /* function untuk meletakan blok */
  placeBlock() {
    let currentBlock = this.blocks[this.blocks.length - 1];
    let newBlocks = currentBlock.place();
    this.newBlocks.remove(currentBlock.mesh);
    if (newBlocks.placed) {
      this.placedBlocks.add(newBlocks.placed)
      this.playPlaceSound();
    };
    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped);
      let positionParams = {
        y: "-=30",
        ease: Power1.easeIn,
        onComplete: () => this.choppedBlocks.remove(newBlocks.chopped),
      };
      let rotateRandomness = 10;
      let rotationParams = {
        delay: 0.05,
        x:
          newBlocks.plane == "z"
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        z:
          newBlocks.plane == "x"
            ? Math.random() * rotateRandomness - rotateRandomness / 2
            : 0.1,
        y: Math.random() * 0.1,
      };
      if (
        newBlocks.chopped.position[newBlocks.plane] >
        newBlocks.placed.position[newBlocks.plane]
      ) {
        positionParams[newBlocks.plane] =
          "+=" + 40 * Math.abs(newBlocks.direction);
      } else {
        positionParams[newBlocks.plane] =
          "-=" + 40 * Math.abs(newBlocks.direction);
      }
      TweenLite.to(newBlocks.chopped.position, 1, positionParams);
      TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
    }
    
    this.score++;
    this.updateBackground();
    this.addBlock();
  }

  addBlock() {
    let lastBlock = this.blocks[this.blocks.length - 1];
    if (lastBlock && lastBlock.state == lastBlock.STATES.MISSED) {
      return this.endGame();
    }
    this.scoreContainer.innerHTML = String(this.blocks.length - 1);
    let newKidOnTheBlock = new Block(lastBlock);
    this.newBlocks.add(newKidOnTheBlock.mesh);
    this.blocks.push(newKidOnTheBlock);
    this.stage.setCamera(this.blocks.length * 2);
    if (this.blocks.length >= 5) this.instructions.classList.add("hide");
  }
  endGame() {
    this.updateState(this.STATES.ENDED);
    if (
      this.highScore === undefined ||
      this.blocks.length - 2 > this.highScore
    ) {
      // Jika pemain mendapatkan skor tertinggi baru
      this.highScore = this.blocks.length - 2;
      this.updateHighScore();
      this.saveHighScore(); // Simpan skor tertinggi
    }
    this.playGameOverSound();
    ShowResetScore();
  }
  tick() {
    this.blocks[this.blocks.length - 1].tick();
    this.stage.render();
    requestAnimationFrame(() => {
      this.tick();
    });
  }
  updateBackground() {
    const backgroundThresholds = {
      0: {
        background: "linear-gradient(to bottom, #E8A5D7, #B1E1FF)",
        fontColor: "#333344",
      },
      10: {
        background: "linear-gradient(to bottom, #864879, #E8A5D7)",
        fontColor: "#333344",
      },
      20: {
        background: "linear-gradient(to bottom, #3F3351, #864879)",
        fontColor: "#CFCFDB",
      },
      30: {
        background: "linear-gradient(to bottom, #1F1D36, #3F3351)",
        fontColor: "#DFDFE7",
      },
      40: {
        background: "linear-gradient(to bottom, #080613, #1F1D36)",
        fontColor: "#DFDFE7",
      },
    };

    const closestThreshold = Object.keys(backgroundThresholds).reduce(
      (prev, threshold) =>
        this.score >= parseInt(threshold) ? parseInt(threshold) : prev,
      0
    );

    const targetBackgroundColor =
      backgroundThresholds[closestThreshold].background;
    const currentBackgroundColor = this.stage.container.style.background;

    if (targetBackgroundColor !== currentBackgroundColor) {
      TweenLite.to(this.stage.container.style, 2, {
        background: targetBackgroundColor,
        ease: Power1.easeInOut,
      });
    }

    this.resetScoreButton.style.color =
      backgroundThresholds[closestThreshold].fontColor;
    this.scoreContainer.style.color =
      backgroundThresholds[closestThreshold].fontColor;
    this.scoreText.style.color =
      backgroundThresholds[closestThreshold].fontColor;
    const gameoverText = document.querySelector(".game-over h2");
    gameoverText.style.color = backgroundThresholds[closestThreshold].fontColor;
    const gameoverTextsml = document.querySelector(".game-over p");
    gameoverTextsml.style.color =
      backgroundThresholds[closestThreshold].fontColor;
    const gameoverSubTextsml = document.querySelector(".game-over .informasi");
    gameoverSubTextsml.style.color =
      backgroundThresholds[closestThreshold].fontColor;
  }
}
let game = new Game();
