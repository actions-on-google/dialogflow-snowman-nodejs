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

const functions = require('firebase-functions');
const {dialogflow, HtmlResponse} = require('actions-on-google');
const Dictionary = require('./util/dictionary.js');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
const app = dialogflow({debug: true});

const MAX_INCORRECT_GUESSES = 5;

const INSTRUCTIONS =
`Try to figure out the word by guessing letters that you think are in the word. ` +
`Figure out the word before Snow Pal melts to win the game! After 5 ` +
`incorrect guesses, Snow Pal melts and the game is over. ` +
`If you know the word, you can say, for instance, “The word is penguin.” ` +
`You can try another word, or ask for help.`;

const PLAY_AGAIN_INSTRUCTIONS = `Would you like to  play again or quit?`;

const WELCOME_BACK_GREETINGS = [
  `Hey, you're back to Snow Pal!`,
  `Welcome back to Snow Pal!`,
  `I'm glad you're back to play!`,
  `Hey there, you made it! Let's play Snow Pal.`
];

const START_GAME_RESPONSES = [
  `Try guessing a letter in the word, or guess the entire word if you think you know what it is.`,
  `Try guessing a letter in the word, or guess the entire word if you're feeling confident!`,
  `Try guessing a letter in the word or guessing the word.`,
  `Try guessing a letter in the word or guessing the word.`
];

const RIGHT_RESPONSES = ['Right on! Good guess.', 'Splendid!',
  'Wonderful! Keep going!', 'Easy peasy lemon squeezy!', 'Easy as pie!'];

const WRONG_RESPONSES = [`Whoops, that letter isn’t in the word. Try again!`,
  'Try again!', 'You can do this!', 'Incorrect. Keep on trying!'];

const WIN_RESPONSES = ['Congratulations and BRAVO!',
  'You did it! So proud of you!',
  'Well done!', 'I’m happy for you!',
  'This is awesome! You’re awesome! Way to go!'];

const DICTIONARY = new Dictionary();

/**
 * Pick a random item from an array. This is to make
 * responses more conversational.
 *
 * @param  {array} array representing a list of elements.
 * @return  {string} item from an array.
 */
const randomArrayItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Updates the string to display to the user with the guessed
 * letter or word.
 *
 * @param  {string} letterOrWord the letter or word used to update the display string.
 */
const updateWordToDisplay = (conv, letterOrWord) => {
  if(letterOrWord === conv.data.correctWord) {
    conv.data.wordToDisplay = conv.data.correctWord;
  } else {
    conv.data.correctWord.split('').forEach((character, index) => {
      if (letterOrWord === character) {
        conv.data.wordToDisplay = conv.data.wordToDisplay.substr(0, index) +
        letterOrWord + conv.data.wordToDisplay.substr(index + letterOrWord.length)
      }
    });
  }
}

app.intent('Welcome', (conv) => {
  if (conv.user.last.seen) {
    conv.ask(`${randomArrayItem(WELCOME_BACK_GREETINGS)} Would you like to start playing the game?`);
  } else {
    conv.ask(`Welcome to Snow Pal! Would you like to start playing the game?`);
  }
  conv.ask(new HtmlResponse({
    url: `https://${firebaseConfig.projectId}.firebaseapp.com`,
  }));
});

app.intent('Start Game', (conv) => {
  if (conv.user.last.seen) {
    conv.ask(randomArrayItem(START_GAME_RESPONSES));
  } else {
    conv.ask(`${INSTRUCTIONS}`);
  }
  conv.data.incorrectGuesses = 0;
  // Generate new word to guess
  conv.data.correctWord = DICTIONARY.getWord().toLocaleUpperCase();
  conv.data.wordToDisplay = '_'.repeat(conv.data.correctWord.length);
  conv.ask(new HtmlResponse({
    data: {
      state: 'NEW_GAME',
      wordToDisplay: conv.data.wordToDisplay
    },
  }));
});

app.intent('Fallback', (conv) => {
  conv.ask(`I don’t understand. Try guessing a letter!`);
  conv.ask(new HtmlResponse());
});

/**
 * Guess a letter or word from Snow Pal.
 *
 * @param  {conv} standard Actions on Google conversation object.
 * @param  {string} letterOrWord from A-Z.
 */
app.intent('Guess Letter or Word', (conv, {letterOrWord}) => {
  conv.ask(`<speak>Let's see if ${letterOrWord} is there...<break time="2500ms"/></speak>`);
  letterOrWord = letterOrWord.toLocaleUpperCase();
  // Check if the letter guessed is part of the correct word.
  let correctGuess = conv.data.correctWord.indexOf(letterOrWord) > -1;
  if (correctGuess) {
    // Update the word to be displayed to the user with the newly guessed letter.
    updateWordToDisplay(conv, letterOrWord);
    // Check if the correct guess will result in the user winning the game.
    const userHasWon = conv.data.wordToDisplay === conv.data.correctWord;
    if (userHasWon) {
      conv.ask(`<speak>${letterOrWord} is right. That spells ${conv.data.correctWord}! ${randomArrayItem(WIN_RESPONSES)} ` +
      `${PLAY_AGAIN_INSTRUCTIONS}</speak>`);
      // User has won the game. Update game to WIN state, and pass the
      // updated word to display to the front-end.
      conv.ask(new HtmlResponse({
        data: {
          state: 'WIN',
          wordToDisplay: conv.data.wordToDisplay
        },
      }));
    } else {
      conv.ask(`${letterOrWord} is right. ${randomArrayItem(RIGHT_RESPONSES)}`);
      // User made a correct guess. Update game to CORRECT state, and pass the
      // updated word to display to the front-end.
      conv.ask(new HtmlResponse({
        data: {
          state: 'CORRECT',
          wordToDisplay: conv.data.wordToDisplay
        },
      }));
    }
  }
  else {
    conv.data.incorrectGuesses++;
    // Check if the user has exceeded the maximum amount of max guesses allowed.
    const userHasLost = conv.data.incorrectGuesses >= MAX_INCORRECT_GUESSES
    if (userHasLost) {
      conv.ask(`<speak>Sorry, you lost. The word is ${conv.data.correctWord}.` +
        `${PLAY_AGAIN_INSTRUCTIONS}</speak>`);
      // User has lost the game. Update game to LOSE state.
      conv.ask(new HtmlResponse({
        data: {
          state: 'LOSE',
        },
      }));
    } else {
      conv.ask(`${letterOrWord} is wrong. ${randomArrayItem(WRONG_RESPONSES)}`);
      // User made an incorrect guess. Update game to INCORRECT state.
      conv.ask(new HtmlResponse({
        data: {
          state: 'INCORRECT',
        },
      }));
    }
  }
});

/**
 * Provide standard instructions about the game.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Instructions', (conv) => {
  conv.ask(`${INSTRUCTIONS}`);
  conv.ask(new HtmlResponse());
});

/**
 * Trigger to re-play the game again at anytime.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Play Again', (conv) => {
  conv.ask(`Okay, here’s another game!`);
  conv.data.incorrectGuesses = 0;
  conv.data.correctWord = DICTIONARY.getWord().toLocaleUpperCase();
  conv.data.wordToDisplay = '_'.repeat(conv.data.correctWord.length);
  conv.ask(new HtmlResponse({
    data: {
      state: 'NEW_GAME',
      wordToDisplay: conv.data.wordToDisplay
    },
  }));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
