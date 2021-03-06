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
import {AxiosResponse} from 'axios';
import {AssetAPI} from './asset/';
import {AccessTokenData, AuthAPI, Context, LoginData, RegisterData} from './auth';
import {AccessTokenStore} from './auth/';
import {ClientAPI, ClientType} from './client/';
import {Config} from './Config';
import {ConnectionAPI} from './connection/';
import {ConversationAPI} from './conversation/';
import {Backend} from './env';
import {GiphyAPI} from './giphy/';
import {HttpClient} from './http/';
import {InvitationAPI} from './invitation/';
import {NotificationAPI} from './notification/';
import {SelfAPI} from './self/';
import {retrieveCookie} from './shims/node/cookie';
import {WebSocketClient} from './tcp/';
import {MemberAPI, PaymentAPI, TeamAPI, TeamInvitationAPI} from './team/';
import {User} from './user';
import {UserAPI} from './user/';

const VERSION = require('../../package.json').version;

class Client {
  private readonly logger: any = logdown('@wireapp/api-client/Client', {
    logger: console,
    markdown: false,
  });

  private readonly STORE_NAME_PREFIX: string = 'wire';
  // APIs
  public asset: {api: AssetAPI};
  public auth: {api: AuthAPI};
  public client: {api: ClientAPI};
  public connection: {api: ConnectionAPI};
  public conversation: {api: ConversationAPI};
  public giphy: {api: GiphyAPI};
  public invitation: {api: InvitationAPI};
  public notification: {api: NotificationAPI};
  public self: {api: SelfAPI};
  public teams: {
    invitation: {api?: TeamInvitationAPI};
    member: {api?: MemberAPI};
    payment: {api?: PaymentAPI};
    team: {api?: TeamAPI};
  } = {
    invitation: {api: undefined},
    member: {api: undefined},
    payment: {api: undefined},
    team: {api: undefined},
  };
  public user: {api: UserAPI};

  // Configuration
  private readonly accessTokenStore: AccessTokenStore;
  public context?: Context;
  public transport: {http: HttpClient; ws: WebSocketClient};

  public static BACKEND = Backend;
  public static VERSION: string = VERSION;

  constructor(public config: Config = new Config()) {
    this.config = new Config(config.store, config.urls, config.schemaCallback);
    this.accessTokenStore = new AccessTokenStore();

    const httpClient = new HttpClient(this.config.urls.rest, this.accessTokenStore, this.config.store);

    this.transport = {
      http: httpClient,
      ws: new WebSocketClient(this.config.urls.ws, httpClient),
    };

    this.asset = {
      api: new AssetAPI(this.transport.http),
    };
    this.auth = {
      api: new AuthAPI(this.transport.http, this.config.store),
    };
    this.client = {
      api: new ClientAPI(this.transport.http),
    };
    this.connection = {
      api: new ConnectionAPI(this.transport.http),
    };
    this.conversation = {
      api: new ConversationAPI(this.transport.http),
    };
    this.giphy = {
      api: new GiphyAPI(this.transport.http),
    };
    this.invitation = {
      api: new InvitationAPI(this.transport.http),
    };
    this.notification = {
      api: new NotificationAPI(this.transport.http),
    };
    this.self = {
      api: new SelfAPI(this.transport.http),
    };

    this.teams = {
      invitation: {
        api: new TeamInvitationAPI(this.transport.http),
      },
      member: {
        api: new MemberAPI(this.transport.http),
      },
      payment: {
        api: new PaymentAPI(this.transport.http),
      },
      team: {
        api: new TeamAPI(this.transport.http),
      },
    };

    this.user = {
      api: new UserAPI(this.transport.http),
    };
  }

  public init(clientType: ClientType = ClientType.NONE): Promise<Context> {
    let context: Context;
    let accessToken: AccessTokenData;
    return this.transport.http
      .postAccess()
      .then((createdAccessToken: AccessTokenData) => {
        context = this.createContext(createdAccessToken.user, clientType);
        accessToken = createdAccessToken;
      })
      .then(() => this.initEngine(context))
      .then(() => this.accessTokenStore.updateToken(accessToken))
      .then(() => context);
  }

  public login(loginData: LoginData): Promise<Context> {
    let context: Context;
    let accessToken: AccessTokenData;
    let cookieResponse: AxiosResponse;

    return Promise.resolve()
      .then(() => this.context && this.logout({ignoreError: true}))
      .then(() => this.auth.api.postLogin(loginData))
      .then((response: AxiosResponse<any>) => {
        cookieResponse = response;
        accessToken = response.data;
        context = this.createContext(accessToken.user, loginData.clientType);
      })
      .then(() => this.initEngine(context))
      .then(() => retrieveCookie(cookieResponse, this.config.store))
      .then(() => this.accessTokenStore.updateToken(accessToken))
      .then(() => context);
  }

  public register(userAccount: RegisterData, clientType: ClientType = ClientType.PERMANENT): Promise<Context> {
    return (
      Promise.resolve()
        .then(() => this.context && this.logout({ignoreError: true}))
        .then(() => this.auth.api.postRegister(userAccount))
        /**
         * Note:
         * It's necessary to initialize the context (Client.createContext()) and the store (Client.initEngine())
         * for saving the retrieved cookie from POST /access (Client.init()) in a Node environment.
         */
        .then((user: User) => this.createContext(user.id, clientType))
        .then((context: Context) => this.initEngine(context))
        .then(() => this.init(clientType))
    );
  }

  public logout(options = {ignoreError: false}): Promise<void> {
    return this.auth.api
      .postLogout()
      .catch(error => {
        if (options.ignoreError) {
          this.logger.error(error);
        } else {
          throw error;
        }
      })
      .then(() => this.disconnect('Closed by client logout'))
      .then(() => this.accessTokenStore.delete())
      .then(() => {
        delete this.context;
      });
  }

  public connect(): Promise<WebSocketClient> {
    if (this.context && this.context.clientId) {
      return this.transport.ws.connect(this.context.clientId);
    } else {
      return this.transport.ws.connect();
    }
  }

  private createContext(userId: string, clientType: ClientType, clientId?: string): Context {
    this.context = this.context ? {...this.context, clientId, clientType} : new Context(userId, clientType, clientId);
    return this.context;
  }

  public disconnect(reason?: string): void {
    this.transport.ws.disconnect(reason);
  }

  private async initEngine(context: Context) {
    const clientType = context.clientType === ClientType.NONE ? '' : `@${context.clientType}`;
    const dbName = `${this.STORE_NAME_PREFIX}@${this.config.urls.name}@${context.userId}${clientType}`;
    this.logger.info(`Initialising store with name "${dbName}"`);
    try {
      const db = await this.config.store.init(dbName);
      const isDexieStore = db && db.constructor.name === 'Dexie';
      if (isDexieStore) {
        if (this.config.schemaCallback) {
          this.config.schemaCallback(db);
        } else {
          throw new Error('Could not initialize database - missing schema definition');
        }
        // In case the database got purged, db.close() is called automatically and we have to reopen it.
        await db.open();
      }
    } catch (error) {
      throw new Error(`Could not initialize database: "${error.message}`);
    }
    return this.config.store;
  }
}

export = Client;
