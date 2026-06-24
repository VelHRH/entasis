import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER rooms_set_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `,
);
