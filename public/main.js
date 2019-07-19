/**
 * Copyright 2019 Google Inc. All Rights Reserved.
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
    scene: PlayGame,
    backgroundColor: 0xffffff,
    audio: {
      disableWebAudio: false,
    },
  };
  game = new Phaser.Game(config);
  window.focus();
};
/**
 * Represent Snowman game.
 */
class PlayGame extends Phaser.Scene {
  /**
   * Constructor to initialize game including Google Assitant Canvas object.
   * Assistant Canvas object registers all callbacks triggered by voice.
   *
   * "PlayGame" scene.
   */
  constructor() {
    super('PlayGame');
  }

  /**
   * Preload assets (sprites, sounds, or text) to be used by the game.
   */
  preload() {
    // Images
    this.load.bitmapFont('googleSans',
        'assets/fonts/bitmap/google-sans-font.png',
        'assets/fonts/bitmap/google-sans-font.xml');
    this.load.image('background', 'assets/background-large.png');
    this.load.path = 'assets/';
    this.load.multiatlas('snowman', ['./snowman3.json']);
    this.load.multiatlas('win_lose', ['./win-lose.json']);

    // Word dictionary
    this.dictionary = new Dictionary();

    // Sounds
    this.wrongSound = new Howl({
      src: ['./assets/sounds/cartoon-boing.ogg'],
      autoplay: false,
      loop: false,
      volume: 1,
    });
    this.correctSound = new Howl({
      src: ['./assets/sounds/hit.mp3'],
      autoplay: false,
      loop: false,
      volume: 1,
    });
    this.winSound = new Howl({
      src: ['./assets/sounds/crazy-dinner-bell.ogg'],
      autoplay: false,
      loop: false,
      volume: 1,
    });
    this.loseSound = new Howl({
      src: ['./assets/sounds/concussive-hit-guitar-boing.ogg'],
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
    const posText = 200;
    this.youWinImage = this.add.image(this.scale.width / 2,
        (this.scale.height / 2) + 20, 'win_lose', 'you-win.png', this)
        .setVisible(false);
    this.youLoseImage = this.add.image(this.scale.width / 2,
        (this.scale.height / 2) + 20, 'win_lose', 'you-lose.png', this)
        .setVisible(false);
    this.background = this.add.image(0, 0, 'background').setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
    this.wordText = this.add.text(50, posText, '',
        {fontSize: 25, color: '#00ff00'})
        .setOrigin(0, 0).setVisible(false);
    this.commandText = this.add.text(50, posText + 30, '',
        {fontSize: 25, color: '#00ff00'}).setOrigin(0, 0).setVisible(false);
    this.letterText = this.add.text(50, posText + 60, '',
        {fontSize: 25, color: '#00ff00'}).setOrigin(0, 0).setVisible(false);
    this.statusText = this.add.text(50, posText + 90, '',
        {fontSize: 25, color: '#00ff00'}).setOrigin(0, 0).setVisible(false);
    this.visibleObjects.push(this.wordText, this.commandText, this.letterText,
        this.statusText, this.background);

    // Wordplaceholder orchestrates snowman and word placeholders
    this.wordPlaceholder = new WordPlaceholder(this, this.dictionary.getWord());

    // Set assistant at game level.
    this.assistant = new Assistant(this);
    // Call setCallbacks to register assistant callbacks.
    this.assistant.setCallbacks(this);

    this.gameOver = false;
    this.setCaptions('___', '____', this.wordPlaceholder.word.text,
        '____', '____');

    this.setKeyboardBindings();
  }

  /**
   * Keyboard bindings for testing purposes as a standalone web app.
   */
  setKeyboardBindings() {
    const that = this; // Needed for closure
    const re = /^[A-Za-z.,\/[]+$/;
    this.input.keyboard.on('keydown', function(eventName, event) {
      if (!that.wordPlaceholder.isGameOver()) {
        if (!re.test(eventName.key)) {
          console.log('Invalid char. Must use alphabet letters.');
          return;
        }
        const res = that.wordPlaceholder.isInWord(eventName.key);
        if (!res) {
          that.wrongSound.play();
        } else {
          that.correctSound.play();
        }
      }
      if (that.wordPlaceholder.isGameOver()) {
        console.log('Restart game by using forward slash key');
      }
      if (eventName.key === '/') {
        that.startSnowman.bind(that)();
      }
      if (eventName.key === '.') {
        that.toggleCaptions(that.wordText, that.commandText, that.letterText,
            that.statusText);
      }
      if (eventName.key === ',') {
        if (that.wordPlaceholder.isGameOver()) {
          that.finishGame.bind(that)(that.wordPlaceholder.userWins());
        }
      }
      if (eventName.key === '[') {
        console.log(JSON.stringify(that.wordPlaceholder.word));
      }
    });
  }

  /**
   * Update text debugging fields for every guess. Used for debugging purposes.
   *
   * @param  {Text} command Google Assistant command text field.
   * @param  {Text} letter Guessed letter text field.
   * @param  {Text} word to be guessed text field.
   * @param  {Text} status to display when guess is correct or incorrect.
   */
  setCaptions(command, letter, word, status) {
    this.commandText.text = `Command: ${command}`;
    this.letterText.text = `Letter/Word: ${letter}`;
    this.wordText.text = `Word: ${word}`;
    this.statusText.text = `Status: ${status}`;
  }

  /**
   * Toggles text fields from visible to non-visible for `toggle captions`
   * user utterance.
   * @param  {Text_array} to be visible or invisible.
   */
  toggleCaptions(...captions) {
    captions.forEach((caption) => caption.setVisible(!caption.visible));
  }


  /**
   * Call to start snowman and reset images from initial state.
   */
  startSnowman() {
    this.wordPlaceholder.reset(this, this.dictionary.getWord());
    this.setCaptions('___', '____', this.wordPlaceholder.word.text,
        '____', '____');
    this.gameOver = false;
    this.setVisible(true);
    this.youWinImage.setVisible(false);
    this.youLoseImage.setVisible(false);
  }

  /**
   * Set visibility to images. Since images use Alpha, then 0 is false and
   * 1 is true.
   * @param  {boolean} visible to set visibility to true or false on a object.
   */
  setVisible(visible) {
    this.visibleObjects.forEach((vo) => vo.setAlpha(visible ? 1 : 0));
  }


  /**
   * Finish game by setting invisible main stage (sky, word placeholder,
   * and snowman) and displaying images of win or lose.
   * @param  {boolean} win true to display win image or false to display
   * false one.
   */
  finishGame(win) {
    const that = this;
    // fade duration and RGB to fade out and fade in main camera
    that.cameras.main.fade(1000, 255, 255, 255, true, (cam, complete) => {
      if (complete === 1) {
        that.setVisible(0);
        if (win) this.youWinImage.setVisible(true);
        else this.youLoseImage.setVisible(true);
        that.cameras.main.fadeIn(2000, 255, 255, 255);
      }
    });
  }
}
