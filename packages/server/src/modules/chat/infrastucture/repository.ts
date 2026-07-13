import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { PgLive } from "src/db/pg-client.js";
import { RoomId } from "src/modules/room/domain/schema.js";
import { UserId } from "src/modules/user/domain/schema.js";
import { ChatsRepo, CreateMessageInput, FindDirectChatInput, MessagesRepo } from "../domain/repo.js";
import { Chat, ChatId, Message } from "../domain/schema.js";

export const ChatsRepoLive = Layer.effect(
  ChatsRepo,
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;

    // Direct chats always have exactly two members, so matching both
    // participants is enough to identify the chat.
    const findDirect = SqlSchema.findOne({
      Result: Chat,
      Request: FindDirectChatInput,
      execute: (request) =>
        sql`
        SELECT
          chats.*
        FROM
          chats
          INNER JOIN chat_members a ON a.chat_id = chats.id
          AND a.user_id = ${request.userA}
          INNER JOIN chat_members b ON b.chat_id = chats.id
          AND b.user_id = ${request.userB}
        WHERE
          chats.room_id = ${request.roomId}
        LIMIT
          1
      `,
    });

    const insertChat = SqlSchema.single({
      Result: Chat,
      Request: RoomId,
      execute: (roomId) =>
        sql`
        INSERT INTO
          chats (room_id)
        VALUES
          (${roomId})
        RETURNING
          *
      `,
    });

    const membersOf = SqlSchema.findAll({
      Result: Schema.Struct({ userId: UserId }),
      Request: ChatId,
      execute: (chatId) =>
        sql`
        SELECT
          user_id
        FROM
          chat_members
        WHERE
          chat_id = ${chatId}
      `,
    });

    return {
      findDirect: flow(findDirect, Effect.orDie),
      create: (roomId: RoomId, members: ReadonlyArray<UserId>) =>
        Effect.gen(function*() {
          const chat = yield* insertChat(roomId);
          yield* sql`
            INSERT INTO
              chat_members ${
            sql.insert(
              members.map((userId) => ({ chatId: chat.id, userId })),
            )
          }
          `;
          return chat;
        }).pipe(sql.withTransaction, Effect.orDie),
      membersOf: flow(
        membersOf,
        Effect.map((rows) => rows.map((row) => row.userId)),
        Effect.orDie,
      ),
    };
  }),
).pipe(Layer.provide(PgLive));

export const MessagesRepoLive = Layer.effect(
  MessagesRepo,
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient;

    const create = SqlSchema.single({
      Result: Message,
      Request: CreateMessageInput,
      execute: (request) =>
        sql`
        INSERT INTO
          messages ${sql.insert(request)}
        RETURNING
          *
      `,
    });

    const listByChat = SqlSchema.findAll({
      Result: Message,
      Request: ChatId,
      execute: (chatId) =>
        sql`
        SELECT
          *
        FROM
          (
            SELECT
              *
            FROM
              messages
            WHERE
              chat_id = ${chatId}
            ORDER BY
              created_at DESC
            LIMIT
              100
          ) latest
        ORDER BY
          created_at ASC
      `,
    });

    return {
      create: flow(create, Effect.orDie),
      listByChat: flow(listByChat, Effect.orDie),
    };
  }),
).pipe(Layer.provide(PgLive));
