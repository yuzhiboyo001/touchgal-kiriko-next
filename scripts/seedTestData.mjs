import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Client } = pg
const client = new Client({ connectionString: process.env.KUN_DATABASE_URL })

const SEED_USER_PREFIX = 'seed_test_'
const SEED_COMMENT_PREFIX = 'seed test comment #'
const USER_COUNT = 35
const COMMENT_COUNT = 35
const PATCH_ID = 3

const run = async () => {
  await client.connect()

  try {
    await client.query('BEGIN')

    const patch = await client.query('SELECT id FROM patch WHERE id = $1', [
      PATCH_ID
    ])
    if (patch.rowCount === 0) {
      throw new Error(`Patch ${PATCH_ID} not found`)
    }

    const admin = await client.query(
      'SELECT id, password FROM "user" WHERE id = 1'
    )
    if (admin.rowCount === 0) {
      throw new Error('Admin user 1 not found')
    }

    const adminId = admin.rows[0].id
    const passwordHash = admin.rows[0].password

    for (let i = 1; i <= USER_COUNT; i++) {
      const suffix = String(i).padStart(2, '0')
      const name = `${SEED_USER_PREFIX}${suffix}`
      const email = `${name}@example.test`

      await client.query(
        `INSERT INTO "user" (name, email, password, role, bio, created, updated)
         VALUES ($1, $2, $3, 1, $4, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        [name, email, passwordHash, 'local seed user']
      )
    }

    for (let i = 1; i <= COMMENT_COUNT; i++) {
      const suffix = String(i).padStart(3, '0')
      const content = `${SEED_COMMENT_PREFIX}${suffix}`

      await client.query(
        `INSERT INTO patch_comment
          (content, content_html, content_html_version, user_id, patch_id, created, updated)
         SELECT $1::varchar, $2::text, 2, $3, $4, NOW(), NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM patch_comment WHERE content = $5::varchar
         )`,
        [content, `<p>${content}</p>`, adminId, PATCH_ID, content]
      )
    }

    await client.query('COMMIT')

    const users = await client.query(
      'SELECT count(*)::int AS count FROM "user" WHERE name LIKE $1',
      [`${SEED_USER_PREFIX}%`]
    )
    const comments = await client.query(
      'SELECT count(*)::int AS count FROM patch_comment WHERE content LIKE $1',
      [`${SEED_COMMENT_PREFIX}%`]
    )

    console.log(`seed users: ${users.rows[0].count}`)
    console.log(`seed comments: ${comments.rows[0].count}`)
    console.log(`patch for comments: ${PATCH_ID}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
