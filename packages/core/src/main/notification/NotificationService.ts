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

const logdown = require('logdown');
import APIClient = require('@wireapp/api-client');
import {Notification, NotificationEvent} from '@wireapp/api-client/dist/commonjs/notification/index';
import {RecordNotFoundError} from '@wireapp/store-engine/dist/commonjs/engine/error/index';
import {CRUDEngine} from '@wireapp/store-engine/dist/commonjs/engine/index';
import NotificationBackendRepository from './NotificationBackendRepository';
import NotificationDatabaseRepository from './NotificationDatabaseRepository';

export default class NotificationService {
  private readonly logger: any = logdown('@wireapp/core/notification/NotificationService', {
    logger: console,
    markdown: false,
  });

  private readonly backend: NotificationBackendRepository;
  private readonly database: NotificationDatabaseRepository;

  constructor(private readonly apiClient: APIClient, private readonly storeEngine: CRUDEngine) {
    this.backend = new NotificationBackendRepository(this.apiClient);
    this.database = new NotificationDatabaseRepository(this.storeEngine);
  }

  public initializeNotificationStream(clientId: string): Promise<string> {
    this.logger.info('initializeNotificationStream');
    return this.setLastEventDate(new Date(0))
      .then(() => this.backend.getLastNotification(clientId))
      .then(notification => this.setLastNotificationId(notification));
  }

  public hasHistory(): Promise<boolean> {
    this.logger.info('hasHistory');
    return this.getNotificationEventList().then(notificationEvents => !!notificationEvents.length);
  }

  private getNotificationEventList(): Promise<NotificationEvent[]> {
    this.logger.info('getNotificationEventList');
    return this.database.getNotificationEventList();
  }

  private setLastEventDate(eventDate: Date): Promise<Date> {
    this.logger.info('setLastEventDate');
    return this.database
      .getLastEventDate()
      .then(databaseLastEventDate => {
        if (eventDate > databaseLastEventDate) {
          return this.database.updateLastEventDate(eventDate);
        }
        return databaseLastEventDate;
      })
      .catch(error => {
        if (error instanceof RecordNotFoundError || error.constructor.name === 'RecordNotFoundError') {
          return this.database.createLastEventDate(eventDate);
        }
        throw error;
      });
  }

  private setLastNotificationId(lastNotification: Notification): Promise<string> {
    this.logger.info('setLastNotificationId');
    return this.database
      .getLastNotificationId()
      .then(() => this.database.updateLastNotificationId(lastNotification))
      .catch(error => this.database.createLastNotificationId(lastNotification));
  }
}
