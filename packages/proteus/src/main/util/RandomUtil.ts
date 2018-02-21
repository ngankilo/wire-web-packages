/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

const random_bytes = (length: number) => {
  if (typeof window !== 'undefined' && window.crypto) {
    // browser
    const buffer = new ArrayBuffer(length);
    const buffer_view = new Uint8Array(buffer);
    return window.crypto.getRandomValues(buffer_view);
  } else {
    // node
    const crypto = require('crypto');
    return new Uint8Array(crypto.randomBytes(length));
  }
};

export default {random_bytes};