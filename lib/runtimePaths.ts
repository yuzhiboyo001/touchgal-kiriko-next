import path from 'path'

/**
 * Runtime files must be resolved from the standalone application root.
 *
 * In development/build this is the project root; in production it is
 * .next/standalone. `postbuild` copies `posts` and `config/redirect.json`
 * into that root, so no project-wide filesystem scanning is needed here.
 */
const PROJECT_ROOT = process.cwd()
const POSTS_DIRECTORY = path.join(PROJECT_ROOT, 'posts')
const REDIRECT_CONFIG_FILE = path.join(PROJECT_ROOT, 'config', 'redirect.json')

export const resolveRuntimeFile = (relativePath: 'config/redirect.json') => {
  if (relativePath !== 'config/redirect.json') {
    throw new Error(`Unsupported runtime file: ${relativePath}`)
  }

  return REDIRECT_CONFIG_FILE
}

export const resolveRuntimeDirectory = (relativePath: 'posts') => {
  if (relativePath !== 'posts') {
    throw new Error(`Unsupported runtime directory: ${relativePath}`)
  }

  return POSTS_DIRECTORY
}
