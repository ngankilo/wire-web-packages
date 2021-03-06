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

import {CRUDEngine, MemoryEngine} from '@wireapp/store-engine/dist/commonjs/engine';
import {Dexie} from 'dexie';
import {Backend} from './env';

type SchemaCallbackFunction = (db: Dexie) => void;

class Config {
  constructor(
    public store: CRUDEngine = new MemoryEngine(),
    public urls: {
      name: string;
      rest: string;
      ws: string;
    } = Backend.PRODUCTION,
    public schemaCallback?: SchemaCallbackFunction
  ) {}
}

export {Config, SchemaCallbackFunction};
