import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Client } = pg
const client = new Client({ connectionString: process.env.KUN_DATABASE_URL })

const SEED_USER_PREFIX = 'seed_test_'
const SEED_COMMENT_PREFIX = 'seed test comment #'

const run = async () => {
  await client.connect()

  try {
    await client.query('BEGIN')

    const comments = await client.query(
      'DELETE FROM patch_comment WHERE content LIKE $1',
      [`${SEED_COMMENT_PREFIX}%`]
    )
    const users = await client.query(
      'DELETE FROM "user" WHERE name LIKE $1',
      [`${SEED_USER_PREFIX}%`]
    )

    await client.query('COMMIT')

    console.log(`deleted seed comments: ${comments.rowCount}`)
    console.log(`deleted seed users: ${users.rowCount}`)
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
