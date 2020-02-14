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

const words = ['Sombrero', 'Google', 'Mountain', 'California',
  'Kubernetes', 'Tensorflow', 'Rhythmic', 'Numbskull', 'Haphazard',
  'Memento', 'Ostracize', 'Mystify', 'Squawk', 'Wildebeest', 'Zombie',
  'Zealous', 'Colombia'];

const clone = (obj) => JSON.parse(JSON.stringify(obj));
/**
 * Dictionary of words to be used by Snow Pal.
 */
module.exports = class Dictionary {
  /**
   * Build all entries in the dictionary.
   * This dictionary can then be replaced by a payload from an API
   * on a less trivial implementation.
   */
  constructor() {
    this.entries = this.shuffle(clone(words));
  }

  /**
   * Retrieve words from the dictionary.
   *
   * @return {string} an unused word to be used by Snow Pal placeholder.
   */
  getWord() {
    if (this.entries.length === 0) {
      this.entries = this.shuffle(clone(words));
    }
    return this.entries.pop();
  }

  /**
   * Shuffles array in place.
   * @param {Array} a items An array containing the items.
   * @return {Array} shuffled
   */
  shuffle(a) {
    let j; let x; let i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }
}
