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

'use strict';

/**
 * This class is used as a wrapper for Google Canvas Assistant Action class along
 * with its callbacks.
 */
class Action {
  /**
   * @param  {phaser} game which serves as a container of all visual
   * and audio elements.
   */
  constructor(game) {
    this.canvas = window.interactiveCanvas;
    this.game = game;
    const that = this;
    this.commands = {
      GUESS: function(data) {
        that.guess(data.letterOrWord.toUpperCase());
      },
      PLAY_AGAIN: function() {
        that.game.startSnowman();
      },
      TOGGLE_CAPTIONS: function() {
        that.game.toggleCaptions(that.game.wordText, that.game.commandText,
            that.game.letterText, that.game.statusText);
      },
      DEFAULT: function() {
        // do nothing, when no command is found
      },
    };
  }

  /**
   * Register all callbacks used by Google Assistant Action
   * executed during game creation time.
   *
   */
  setCallbacks() {
    const that = this;
    // declare assistant canvas action callbacks
    const callbacks = {
      onUpdate(data) {
        that.commands[data.command ? data.command.toUpperCase() :
          'DEFAULT'](data);
      },
    };
    // called by the Interactive Canvas web app once web app has loaded to
    // register callbacks
    this.canvas.ready(callbacks);
  }

  /**
   * Check for every user guess.
   *
   * Orchestrate instructions to change visual element and trigger sounds.
   * Trigger other instructions to Actions on Google to trigger intents
   * that present options to users.
   * @param {string} letterOrWord guess to be checked against the actual word.
   */
  guess(letterOrWord) {
    const foundLetter = this.game.wordPlaceholder.isInWord(letterOrWord);
    const rightWord = this.game.wordPlaceholder.word.text;
    const displayWinOrLoseScreen = () => {
      this.game.finishGame(this.game.wordPlaceholder.userWins());
      this.canvas.sendTextQuery('Play again or quit?');
    };

    this.game.setCaptions.bind(this.game)('Guess letter', letterOrWord,
        rightWord,
      foundLetter ? 'Correct' : 'Incorrect');
    if (!this.game.wordPlaceholder.isGameOver()) {
      if (foundLetter) { // trigger right guess random response
        this.game.correctSound.play('up');
        this.canvas.sendTextQuery(`Right Guess ${letterOrWord}`);
      } else { // trigger wrong guess intent from Actions on Google
        this.game.wrongSound.play();
        this.canvas.sendTextQuery(`Wrong Guess ${letterOrWord}`);
      }
    } else { // when game is over, present different options, and present
      // you win or lose image
      setTimeout(displayWinOrLoseScreen, 8000);
      if (this.game.wordPlaceholder.userWins()) {
        this.game.winSound.play();
        this.canvas.sendTextQuery(`${rightWord.toUpperCase()} word is right`);
      } else {
        this.game.loseSound.play();
        this.canvas.sendTextQuery(`The word to guess is ${rightWord.toUpperCase()}`);
        // Reveal the word in placeholder
        this.game.wordPlaceholder.isInWord(rightWord.toUpperCase());
      }
    }
  }
}
