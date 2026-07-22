import { PgLive } from "#db/pg-client.js";
import { ChatsRepo, CreateMessageInput, FindDirectChatInput, MessagesRepo } from "#modules/chat/domain/repo.js";
import * as SqlClient from "@effect/sql/SqlClient";
import * as SqlSchema from "@effect/sql/SqlSchema";
import { Chat, ChatId, ChatSummary, Message } from "@landline/domain/chat/schema";
import { RoomId } from "@landline/domain/room/schema";
import { User, UserId } from "@landline/domain/user/schema";
import * as Effect from "effect/Effect";
import { flow } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";

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

    // Flat projection of a chat + its partner; reassembled into the nested
    // ChatSummary below (SqlSchema decodes columns, not nested objects).
    const ChatSummaryRow = Schema.Struct({
      id: ChatId,
      roomId: RoomId,
      createdAt: Schema.DateTimeUtc,
      partnerId: UserId,
      partnerEmail: Schema.String,
      partnerCreatedAt: Schema.DateTimeUtc,
      partnerUpdatedAt: Schema.DateTimeUtc,
    });

    const listSummariesByUser = SqlSchema.findAll({
      Result: ChatSummaryRow,
      Request: UserId,
      // The "me" join pins the chats the user belongs to; "partner" is the
      // other member of each (direct chats have exactly two).
      execute: (userId) =>
        sql`
        SELECT
          chats.id,
          chats.room_id,
          chats.created_at,
          partner.id AS partner_id,
          partner.email AS partner_email,
          partner.created_at AS partner_created_at,
          partner.updated_at AS partner_updated_at
        FROM
          chats
          INNER JOIN chat_members me ON me.chat_id = chats.id
          AND me.user_id = ${userId}
          INNER JOIN chat_members other ON other.chat_id = chats.id
          AND other.user_id <> ${userId}
          INNER JOIN users partner ON partner.id = other.user_id
        ORDER BY
          chats.created_at DESC
      `,
    });

    return {
      findDirect: flow(findDirect, Effect.orDie),
      listSummariesByUser: flow(
        listSummariesByUser,
        Effect.map((rows) =>
          rows.map((row) =>
            new ChatSummary({
              id: row.id,
              roomId: row.roomId,
              createdAt: row.createdAt,
              partner: new User({
                id: row.partnerId,
                email: row.partnerEmail,
                createdAt: row.partnerCreatedAt,
                updatedAt: row.partnerUpdatedAt,
              }),
            })
          )
        ),
        Effect.orDie,
      ),
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
