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

/**
 * This class is used as a wrapper for Interactive Canvas Assistant Action class along
 * with its callbacks.
 */
class Assistant {
  /**
   * @param  {Phaser.Scene} scene which serves as a container of all visual
   * and audio elements.
   */
  constructor(scene) {
    this.canvas = window.interactiveCanvas;
    this.gameScene = scene;
    const that = this;
    this.commands = {
      CORRECT: function(data) {
        that.gameScene.correctGuess(data.wordToDisplay);
      },
      INCORRECT: function(data) {
        that.gameScene.incorrectGuess();
      },
      WIN: function(data) {
        that.gameScene.win(data.wordToDisplay);
      },
      LOSE: function(data) {
        that.gameScene.lose();
      },
      NEW_GAME: function(data) {
        that.gameScene.start(data.wordToDisplay);
      },
      DEFAULT: function() {
        // do nothing, when no command is found
      },
    };
  }

  /**
   * Register all callbacks used by the Interactive Canvas Action
   * executed during game creation time.
   */
  setCallbacks() {
    const that = this;
    // Declare the Interactive Canvas action callbacks.
    const callbacks = {
      onUpdate(data) {
        that.commands[data.state ? data.state.toUpperCase() : 'DEFAULT'](data);
      },
    };
    // Called by the Interactive Canvas web app once web app has loaded to
    // register callbacks.
    this.canvas.ready(callbacks);
  }
}