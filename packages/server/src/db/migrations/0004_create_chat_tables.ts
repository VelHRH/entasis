import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE TABLE room_members (
        room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        PRIMARY KEY (room_id, user_id)
    );

    CREATE TABLE chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE TABLE chat_members (
        chat_id UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        PRIMARY KEY (chat_id, user_id)
    );

    CREATE INDEX chat_members_user_id_idx ON chat_members (user_id);

    CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE INDEX messages_chat_id_created_at_idx ON messages (chat_id, created_at);
  `,
);
