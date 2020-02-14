/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

window.onload = () => {
  const config = {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      width: window.innerWidth * window.devicePixelRatio,
      height: window.innerHeight * window.devicePixelRatio,
    },
    parent: 'phaser-example',
    scene: [Main],
    backgroundColor: 0xffffff,
    audio: {
      disableWebAudio: false,
    },
    physics: {
      default: 'arcade',
      arcade: {
          debug: false
      }
    },
  };
  const game = new Phaser.Game(config);
  window.focus();
};

/**
 * Represent Snow Pal game scene.
 */
export default class Main extends Phaser.Scene {
  /**
   * Constructor to initialize game including the Interactive Canvas object.
   * Assistant Canvas Action object registers all callbacks triggered by voice.
   *
   * "PlayGame" scene.
   */
  constructor() {
      super('Main');
  }
  /**
   * Preload assets (sprites, sounds, or text) to be used by the game.
   */
  preload() {
      // Images
      this.load.bitmapFont('googleSans',
          '/assets/fonts/bitmap/google-sans-font.png',
          '/assets/fonts/bitmap/google-sans-font.xml');
      this.load.image('background', '/assets/background.png');
      this.load.path = '/assets/';
      this.load.multiatlas('snow-pal', ['./snow-pal.json']);
      this.load.multiatlas('win_lose', ['./win-lose.json']);

      // Sounds
      this.wrongSound = new Howl({
          src: ['https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'],
          autoplay: false,
          loop: false,
          volume: 1,
      });
      this.correctSound = new Howl({
          src: ['https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg'],
          autoplay: false,
          loop: false,
          volume: 1,
          sprite: {
              up: [0, 3300],
          }
      });
      this.winSound = new Howl({
          src: ['https://actions.google.com/sounds/v1/cartoon/crazy_dinner_bell.ogg'],
          autoplay: false,
          loop: false,
          volume: 1,
      });
      this.loseSound = new Howl({
          src: ['https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg'],
          autoplay: false,
          loop: false,
          volume: 1,
      });
  }

  /**
   * Called once to create the game along with other objects required
   * to produce the initial state of the game.
   */
  create() {
      this.visibleObjects = [];
      this.youWinImage = this.add.image(this.scale.width / 2,
          (this.scale.height / 2) + 20, 'win_lose', 'you-win.png', this)
          .setVisible(false);
      this.youLoseImage = this.add.image(this.scale.width / 2,
          (this.scale.height / 2) + 20, 'win_lose', 'you-lose.png', this)
          .setVisible(false);

      // Background
      this.background = this.add.image(0, 0, 'background')
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
      const that = this;
      window.interactiveCanvas.getHeaderHeightPx()
        .then((headerHeight) => {
          that.background
            .setY(headerHeight)
            .setDisplaySize(that.scale.width, that.scale.height - headerHeight);
        });

      // Start Button
      this.startButton = new Phaser.GameObjects.Text(this, 0, this.scale.height / 2, 'Start Game', {fontSize: 75, fill: '#000'});
      this.startButton.x = (this.scale.width / 2) - (this.startButton.width / 2);
      this.startButton
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.startButton.setStyle({fill: '#ff0'}))
        .on('pointerout', () => this.startButton.setStyle({fill: '#000'}))
        .on('pointerdown', () => this.startButton.setStyle({fill: '#0ff'}))
        .on('pointerup', () => {
            this.startButton.setStyle({fill: '#ff0'});
            window.interactiveCanvas.sendTextQuery('Yes');
        });

      // Play Again Button
      this.playAgainButton = new Phaser.GameObjects.Text(this, 0, this.scale.height / 1.5, 'Play Again', {fontSize: 75, fill: '#000'});
      this.playAgainButton.x = (this.scale.width / 2) - (this.playAgainButton.width / 2);
      this.playAgainButton
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.playAgainButton.setStyle({fill: '#ff0'}))
        .on('pointerout', () => this.playAgainButton.setStyle({fill: '#000'}))
        .on('pointerdown', () => this.playAgainButton.setStyle({fill: '#0ff'}))
        .on('pointerup', () => {
            this.playAgainButton.setStyle({fill: '#ff0'});
            window.interactiveCanvas.sendTextQuery('Play again');
        });

      this.visibleObjects.push(this.background);
      this.add.existing(this.startButton);
      this.add.existing(this.playAgainButton);

      this.word = new Word(this);
      this.snowPal = new SnowPal(this);

      // Set assistant at game level.
      this.assistant = new Assistant(this);
      // Call setCallbacks to register assistant action callbacks.
      this.assistant.setCallbacks();
  }

  /**
   * Call to start Snow Pal and reset images from initial state.
   */
  start(wordToDisplay) {
      this.setVisible(true);
      this.youWinImage.setVisible(false);
      this.youLoseImage.setVisible(false);
      this.playAgainButton.setVisible(false);
      this.startButton.setVisible(false);
      this.snowPal.reset();
      this.word.updateText(wordToDisplay);
  }

  correctGuess(wordToDisplay) {
      this.correctSound.play('up');
      this.word.updateText(wordToDisplay);
  }

  incorrectGuess() {
      this.wrongSound.play();
      this.snowPal.meltNextPart();
  }

  win(wordToDisplay) {
      this.winSound.play();
      this.word.updateText(wordToDisplay);
      this.displayGameOverScreen(true);
  }

  lose() {
      this.loseSound.play();
      this.snowPal.meltNextPart();
      this.displayGameOverScreen(false);
  }

  /**
   * Finish game by setting invisible main stage and displaying images of win or lose.
   * @param  {boolean} userWins true to display win image or false to display
   * false one.
   */
  displayGameOverScreen(userWins) {
      const that = this;
      // fade duration and RGB to fade out and fade in main camera
      that.cameras.main.fade(3000, 255, 255, 255, true, (cam, complete) => {
          if (complete === 1) {
              this.setVisible(0);
              if (userWins) {
                that.youWinImage.setVisible(true);
              } else {
                that.youLoseImage.setVisible(true);
              }
              that.playAgainButton.setVisible(true);
              that.cameras.main.fadeIn(3000, 255, 255, 255);
          }
      });
  }

  /**
   * Set visibility to images. Since images use Alpha, then 0 is false and
   * 1 is true.
   * @param  {boolean} visible to set visibility to true or false on a object.
   */
  setVisible(visible) {
    this.visibleObjects.forEach((vo) => vo.setAlpha(visible ? 1 : 0));
  }
}

/**
* A Snow Pal class represented on the screen.
*/
class SnowPal {
  /**
   * SnowPal constructor.
   * @constructor
   * @param  {Phaser.Scene} scene instance with access to all objects.
   */
  constructor(scene) {
    const xPosition = scene.scale.width / 2;
    const yPosition = (scene.scale.height / 2) + 20;
    this.leftArm = scene.physics.add.sprite(-150, 100, 'snow-pal', 'Left_Arm.png').setVisible(false);
    this.rightArm = scene.physics.add.sprite(150, 100, 'snow-pal', 'Right_Arm.png').setVisible(false);
    this.bottom = scene.physics.add.sprite(0, 225, 'snow-pal', 'Bottom.png').setVisible(false);
    this.torso = scene.physics.add.sprite(0, 125, 'snow-pal', 'Torso.png').setVisible(false);
    this.head = scene.physics.add.sprite(0, 0, 'snow-pal', 'Head.png').setVisible(false);
    this.snowPalParts = [this.leftArm, this.rightArm, this.bottom, this.torso, this.head];
    this.snowPal = scene.add.container(xPosition, yPosition, this.snowPalParts);
    this.snowPal.scale = .75;

    this.visibleIndex = 0;
    scene.visibleObjects = scene.visibleObjects.concat(this.snowPalParts);
  }

  /**
   * Melt the next part of Snow Pal.
   */
  meltNextPart() {
    if (this.visibleIndex === (this.snowPalParts.length)) {
      return;
    }
    this.snowPalParts[this.visibleIndex++].setVisible(false);
  }

  reset() {
    this.visibleIndex = 0;
    this.snowPalParts.forEach((part) => part.setVisible(true));
  }
}

/**
* Represent the word to be guessed and helper functions to verify guesses.
*/
class Word {
  /**
   * Sets placeholders to be displayed. They must be equal to the word.
   * @param  {Phaser.Scene} scene instance representing the game scene.
   */
  constructor(scene) {
    this.scene = scene;
    this.word = scene.add.bitmapText(0, 0, 'googleSans', '', 100, 1);
    this.word.size = 12;
    this.word.setLetterSpacing(20);
    this.word.x = scene.scale.width / 2 - (this.word.width / 2);
    this.word.y = scene.scale.height - 150;
    this.scene.visibleObjects.push(this.word);
  }

  updateText(wordToDisplay) {
    this.word.text = wordToDisplay;
    this.word.size = (this.scene.scale.width - 80) / wordToDisplay.length;
    this.word.x = this.scene.scale.width / 2 - (this.word.width / 2);
  }
}