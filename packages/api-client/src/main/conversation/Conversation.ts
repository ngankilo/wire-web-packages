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

import {ConversationMembers} from '../conversation';

enum CONVERSATION_TYPE {
  REGULAR = 0,
  SELF = 1,
  ONE_TO_ONE = 2,
  CONNECT = 3,
}

enum CONVERSATION_ACCESS_ROLE {
  ACTIVATED = 'activated',
  NON_ACTIVATED = 'non_activated',
  PRIVATE = 'private',
  TEAM = 'team',
}

enum CONVERSATION_ACCESS {
  CODE = 'code',
  INVITE = 'invite',
  LINK = 'link',
  PRIVATE = 'private',
}

interface Conversation {
  access:
    | CONVERSATION_ACCESS.PRIVATE
    | CONVERSATION_ACCESS.INVITE
    | CONVERSATION_ACCESS.LINK
    | CONVERSATION_ACCESS.CODE;
  access_role:
    | CONVERSATION_ACCESS_ROLE.ACTIVATED
    | CONVERSATION_ACCESS_ROLE.PRIVATE
    | CONVERSATION_ACCESS_ROLE.TEAM
    | CONVERSATION_ACCESS_ROLE.NON_ACTIVATED;
  creator: string;
  id: string;
  members: ConversationMembers;
  message_timer: number | null;
  name: string;
  team?: string;
  type: CONVERSATION_TYPE.REGULAR | CONVERSATION_TYPE.SELF | CONVERSATION_TYPE.ONE_TO_ONE | CONVERSATION_TYPE.CONNECT;
}

export {CONVERSATION_ACCESS_ROLE, CONVERSATION_ACCESS, CONVERSATION_TYPE, Conversation};
