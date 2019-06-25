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
const {dialogflow, ImmersiveResponse} = require('actions-on-google');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
const app = dialogflow({debug: true});

const INSTRUCTIONS = `After 4 incorrect guesses, a snowman is built and the ` +
  `game is over. If you know the word, you can say, for instance, ` +
  `“The word is penguin.” You can try another word, or ask for help.`;

const PLAY_AGAIN_INSTRUCTIONS = `You can play another or quit the game.`;

const WELCOME_RESPONSES = [`Hey, you're back to Snowman! ` +
  `Try guessing a letter in the word, or guess the entire word ` +
  `if you think you know what it is.`, `Welcome back to Snowman! ` +
  `Try guessing a letter in the word, or guess the entire word if ` +
  `you're feeling confident!`, `I'm glad you're back to play! ` +
  `Try guessing a letter in the word or guessing the word.`, `Hey there, ` +
  `you made it! Let's play Snowman. Try guessing a letter in the word or ` +
  `guessing the word.`];

const RIGHT_RESPONSES = ['Right on! Good guess.', 'Splendid!',
  'Wonderful! Keep going!', 'Easy peasy lemon squeezy!', 'Easy as pie!'];

const WRONG_RESPONSES = [`Whoops, that letter isn’t in the word. Try again!`,
  'Try again!', 'You can do this!', 'Incorrect. Keep on trying!'];

const REVEAL_WORD_RESPONSES = [`Better luck next time!`, `Don't give up, keep on trying!`];

const WIN_RESPONSES = ['Congratulations and BRAVO!', 'You did it! So proud of you!',
  'Well done!', 'I’m happy for you!',
  'This is awesome! You’re awesome! Way to go!'];
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

app.intent('Welcome', (conv) => {
  if (conv.user.last.seen) {
    conv.ask(randomArrayItem(WELCOME_RESPONSES));
  } else {
    conv.ask(`Welcome to Snowman! Try to figure out the word by ` +
      `guessing letters that you think are in the word. ${INSTRUCTIONS}`);
  }
  conv.ask(new ImmersiveResponse({
    url: `https://${firebaseConfig.projectId}.firebaseapp.com`,
  }));
});

app.intent('Fallback', (conv) => {
  conv.ask(`I don’t understand. Try guessing a letter!`);
  conv.ask(new ImmersiveResponse());
});

/**
 * Guess a letter or word from Snowman.
 *
 * @param  {conv} standard Actions on Google conversation object.
 * @param  {string} letterOrWord from A-Z.
 */
app.intent('Guess Letter or Word', (conv, {letterOrWord}) => {
  conv.ask(`Let's see if ${letterOrWord} is there...`);
  conv.ask(new ImmersiveResponse({
    state: {
      command: 'GUESS',
      letterOrWord,
    },
  }));
});

/**
 * Hide or show upper-left corner captions used for testing and debugging.
 * It can be triggered by saying `toggle captions`.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Toggle Captions', (conv) => {
  conv.ask(`Ok`);
  conv.ask(new ImmersiveResponse({
    state: {
      command: 'TOGGLE_CAPTIONS',
    },
  }));
});

/**
 * Trigger to re-play the game again at anytime.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Play Again', (conv) => {
  conv.ask(`Okay, here’s another game!`);
  conv.ask(new ImmersiveResponse({
    state: {
      command: 'PLAY_AGAIN',
    },
  }));
});

/**
 * Send a random right response back to Google Assistant.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Right Guess', (conv, {letterOrWord}) => {
  conv.ask(`${letterOrWord} is right. ${randomArrayItem(RIGHT_RESPONSES)}`);
  conv.ask(new ImmersiveResponse());
});

/**
 * Send a random wrong response back to Google Assistant.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Wrong Guess', (conv, {letterOrWord}) => {
  conv.ask(`${letterOrWord} is wrong. ${randomArrayItem(WRONG_RESPONSES)}`);
  conv.ask(new ImmersiveResponse());
});

/**
 * Provide standard instructions about the game.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Instructions', (conv) => {
  conv.ask(`Welcome! Try guessing a letter that's in the word or guessing ` +
  `the word itself. Figure out the word before the snowman is built to win ` +
  `the game! ${INSTRUCTIONS}`);
  conv.ask(new ImmersiveResponse());
});

/**
 * Provide a subset of instructions for the game after game is over.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Play Again Instructions', (conv) => {
  conv.ask(PLAY_AGAIN_INSTRUCTIONS);
  conv.ask(new ImmersiveResponse());
});

/**
 * Reveal the word when player loses the game.
 *
 * @param {conv} standard Actions on Google conversation object.
 * @param {word} set by the client.
 */
app.intent('Game Over Reveal Word', (conv, {word}) => {
  conv.ask(`Sorry, you lost. The word is ${word}. ` +
    `${randomArrayItem(REVEAL_WORD_RESPONSES)}`);
  conv.ask(new ImmersiveResponse());
});

/**
 * Reveal the word when player wins the game.
 *
 * @param {conv} standard Actions on Google conversation object.
 */
app.intent('Game Won', (conv, {word}) => {
  conv.ask(`${word} word is right! ${randomArrayItem(WIN_RESPONSES)}`);
  conv.ask(new ImmersiveResponse());
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
