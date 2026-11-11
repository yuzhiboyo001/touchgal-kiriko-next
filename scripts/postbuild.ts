import { execSync } from 'child_process'
import { mkdir, readdir, copyFile, rm, stat } from 'fs/promises'
import path from 'path'

const copyDirectory = async (src: string, dest: string): Promise<void> => {
  try {
    await mkdir(dest, { recursive: true })
    const entries = await readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath)
      } else {
        await copyFile(srcPath, destPath)
      }
    }
  } catch (error) {
    console.error(`Error copying directory from ${src} to ${dest}:`, error)
    throw error
  }
}

const copyOptionalDirectory = async (
  src: string,
  dest: string
): Promise<void> => {
  try {
    await stat(src)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return
    }
    throw error
  }

  await copyDirectory(src, dest)
}

const copyRuntimeFile = async (src: string, dest: string): Promise<void> => {
  try {
    await mkdir(path.dirname(dest), { recursive: true })
    await copyFile(src, dest)
  } catch (error) {
    console.error(`Error copying file from ${src} to ${dest}:`, error)
    throw error
  }
}

const assertExists = async (targetPath: string) => {
  await stat(targetPath)
}

const waitForAllCopies = async (copyTasks: Promise<void>[]) => {
  const results = await Promise.allSettled(copyTasks)
  const rejectedResult = results.find((result) => result.status === 'rejected')

  if (rejectedResult?.status === 'rejected') {
    throw rejectedResult.reason
  }
}

const copyFiles = async () => {
  try {
    execSync('pnpm build:sitemap', { stdio: 'inherit' })

    await waitForAllCopies([
      copyDirectory('public', '.next/standalone/public'),
      copyDirectory('.next/static', '.next/standalone/.next/static'),
      copyOptionalDirectory('server/image', '.next/standalone/server/image'),
      copyDirectory('posts', '.next/standalone/posts'),
      copyRuntimeFile(
        'config/redirect.json',
        '.next/standalone/config/redirect.json'
      )
    ])

    await assertExists('.next/standalone/public/favicon.webp')
    await assertExists('.next/standalone/public/sooner/こじかひわ.webp')
    await assertExists('.next/standalone/posts')
    await assertExists('.next/standalone/config/redirect.json')

    // Next copies the root .env into standalone. Secrets must be injected by
    // PM2/systemd instead, never shipped inside the deployment artifact.
    for (const envFile of [
      '.env',
      '.env.local',
      '.env.production',
      '.env.production.local'
    ]) {
      await rm(path.join('.next/standalone', envFile), { force: true })
    }

    execSync('node scripts/checkStandalone.mjs', { stdio: 'inherit' })

    console.log('Files copied successfully.')
  } catch (error) {
    console.error('Error during postbuild:', error)
    process.exit(1)
  }
}

copyFiles()
