import knexLib from 'knex';

const client = process.env.DB_CLIENT === 'mysql2' ? 'mysql2' : 'pg';
const defaultPort = client === 'mysql2' ? 3306 : 5432;

export const USERS_TABLE = 'michel_palareff_users';
export const COMMENTS_TABLE = 'michel_palareff_comments';

export const db = knexLib({
  client,
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || defaultPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: { min: 0, max: 5 },
});

export async function ensureSchema() {
  const hasUsersTable = await db.schema.hasTable(USERS_TABLE);
  if (!hasUsersTable) {
    await db.schema.createTable(USERS_TABLE, (table) => {
      table.increments('id').primary();
      table.string('username', 64).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log(`[api] table "${USERS_TABLE}" créée.`);
  }

  const hasCommentsTable = await db.schema.hasTable(COMMENTS_TABLE);
  if (!hasCommentsTable) {
    await db.schema.createTable(COMMENTS_TABLE, (table) => {
      table.increments('id').primary();
      table.string('ref_id', 255).notNullable().index();
      table.string('author', 64).notNullable();
      table.text('text').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log(`[api] table "${COMMENTS_TABLE}" créée.`);
  }
}
