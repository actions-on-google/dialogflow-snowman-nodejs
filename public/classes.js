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
 * A snowman class represented on the screen.
 */
class Snowman {
  /**
   * Snowman constructor.
   * @constructor
   * @param  {Phaser} game instance with access to all objects.
   */
  constructor(game) {
    const xPosition = game.scale.width / 2;
    const yPosition = (game.scale.height / 2) + 20;
    this.head = game.add.image(xPosition, yPosition, 'snowman',
        'Head.png', game).setVisible(false);
    this.headAndTorso = game.add.image(xPosition, yPosition,
        'snowman', 'Head with Torso.png', game).setVisible(false);
    this.headTorsoArms = game.add.image(xPosition, yPosition, 'snowman',
        'Head with Torso and Arms.png', game).setVisible(false);
    this.headTorsoArmsLower = game.add.image(xPosition, yPosition,
        'snowman', 'Head with Torso, Arms, and Lower.png', game)
        .setVisible(false);
    this.parts = [this.head, this.headAndTorso, this.headTorsoArms,
      this.headTorsoArmsLower];
    this.visibleIndex = -1;
    game.visibleObjects = game.visibleObjects.concat(this.parts);
  }

  /**
   * Show the next part of the snowman.
   */
  showNext() {
    if (this.visibleIndex === (this.parts.length - 1)) {
      return;
    }
    this.parts[++this.visibleIndex].setVisible(true);
  }

  /**
   * Indicate if snowman has more parts.
   * @return  {boolean} whether or not snowman has more parts visible.
   */
  hasMoreParts() {
    return this.parts.some((part) => !part.visible);
  }
  /**
   * Reset all snowman parts to invisible(false).
   */
  reset() {
    this.parts.forEach((part) => part.setVisible(false));
    this.visibleIndex = -1;
  }
}

/**
 * This class represents the placeholder for the word on the screen.
 *
 * This class is used to simplify calling individual operations on multiple
 * objects represented on the screen. In this case, Snowman and Word
 * placeholder mainly. So, when the user makes a guess, the game only
 * needs to use this class.
 */
class WordPlaceholder {
  /**
   * @constructor
   * @param  {Phaser} game instance representing the game.
   * @param  {string} word to be matched by the user.
   */
  constructor(game, word) {
    this.scoreText = game.add.bitmapText(0, 0, 'googleSans', '', 100, 1);
    this.setWord(game, word);
    this.snowman = new Snowman(game);
    game.visibleObjects.push(this.scoreText);
  }

  /**
   * Set the word to be guessed, style, and position on the screen.
   * @param  {game} game instance representing the game.
   * @param  {string} word to be matched by the user.
   */
  setWord(game, word) {
    this.word = new Word(word);
    this.word.setBitmapText(this.scoreText);
    this.scoreText.text = this.word.display;
    this.scoreText.size = (game.scale.width - 80) / word.length;
    this.scoreText.setLetterSpacing(20);
    this.scoreText.x = game.scale.width / 2 - (this.scoreText.width / 2);
    // Give enough space (pixels) to display word at the end of screen
    this.scoreText.y = game.scale.height - 150;
  }

  /**
   * Reset the word to be guessed. Usually required when starting a new word.
   * @param  {game} game instance representing the game.
   * @param  {string} word to be matched by the user.
   */
  reset(game, word) {
    this.snowman.reset();
    this.setWord(game, word);
  }

  /**
   * Check if guessed letter or word matches the right word.
   * @param {string} letterOrWord guessed letter or word.
   * @return {boolean} if letter or word is a match, return true, otherwise
   * return false.
   */
  isInWord(letterOrWord) {
    const foundLetter = this.word.isInWord(letterOrWord);
    if (!foundLetter) this.snowman.showNext();
    this.scoreText.x = game.scale.width / 2 - (this.scoreText.width / 2);
    return foundLetter;
  }
  /**
   * Used to stop accepting guessing words.
   * @return  {boolean} if either there are no more parts in snowman
   * or word is complete.
   */
  isGameOver() {
    if (!this.snowman.hasMoreParts() || this.word.isWordComplete()) {
      return true;
    }
    return false;
  }

  /**
   * Determine whether or not the user won.
   * @return  {boolean} When all word placeholders are complete and snowman
   * has more parts, return true, otherwise return false.
   */
  userWins() {
    if (this.word.isWordComplete() && this.snowman.hasMoreParts()) {
      return true;
    }
    return false;
  }
}

/**
 * Represent the word to be guessed and helper functions to verify guesses.
 */
class Word {
  /**
   * Sets placeholders to be displayed. They must be equal to the word.
   * @param  {string} text or word to be guessed.
   */
  constructor(text) {
    this.text = text.toUpperCase();
    this.display = '_'.repeat(this.text.length);
  }
  /**
   * @param  {bitMapText} bitMapText Represents the actual image on the screen
   * displaying the word placeholder.
   */
  setBitmapText(bitMapText) {
    this.bitMapText = bitMapText;
  }
  /**
   * Check the guessed letter or word against the actual word.
   * @param  {string} letterOrWord user guess. It can be a single letter
   * or a word.
   * @return {boolean} true when it finds a match against the actual word.
   */
  isInWord(letterOrWord) {
    letterOrWord = letterOrWord.toLocaleUpperCase();
    // if word, compare guess and word, exist if there's no match
    if (letterOrWord.length > 1 &&
      letterOrWord.toLocaleUpperCase() != this.text.toLocaleUpperCase()) {
      return false;
    }
    for (let i = 0; i < letterOrWord.length; i++) {
      const letterIndexes = this.findLetter(letterOrWord[i]);
      if (letterIndexes.length == 0) {
        return false;
      }
      this.replaceLetterPlaceholders(letterOrWord[i], letterIndexes);
    }
    this.bitMapText.text = this.display;
    return true;
  }
  /**
   * Validate if actual word is contains the guessed letter.
   * @param  {string} guessLetter
   * @return {Array} indices that have the letter.
   */
  findLetter(guessLetter) {
    const indices = [];
    this.text.split('').forEach((letter, index) => {
      if (guessLetter.toUpperCase() === letter.toUpperCase()) {
        indices.push(index);
      }
    });
    return indices;
  }

  /**
   * Replace a placeholder(underscores) with a guessed letter.
   * @param  {string} letter to replace a placeholder.
   * @param  {array} indices or positions to be replaced by a letter.
   */
  replaceLetterPlaceholders(letter, indices) {
    indices.forEach((indice) => {
      this.display = this.replaceAt(indice, letter);
    });
  }

  /**
   * Validate that the user completes the word successfully or not.
   * @return {boolean} true when the guessed word is the same as the
   * actual word.
   */
  isWordComplete() {
    return this.text.toUpperCase() === this.display.toUpperCase();
  }

  /**
  * Replace an letter within the placeholder word using word indexes.
  *
  * @param  {integer} index to replace placeholder with replacement letter.
  * @param  {string} replacement letter.
  * @return  {string} When user guess is rightm replace one placeholder with
  * a correct letter.
  */
  replaceAt(index, replacement) {
    return this.display.substr(0, index) + replacement +
      this.display.substr(index + replacement.length);
  };
}
