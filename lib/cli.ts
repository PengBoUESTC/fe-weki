import { cac } from 'cac'
import prompts from 'prompts'
import { execaCommandSync } from 'execa'
import type { PromptObject } from 'prompts'

const cli = cac('fe-weki')

const frameWorkChoices = [
  {
    title: 'vue',
    value: 'npm init vue@latest',
  },
  {
    title: 'react',
    value: 'npx create-react-app',
  },
  {
    title: 'svelte',
    value: 'npx degit sveltejs/template',
  },
  {
    title: 'nextjs',
    value: 'npx create-next-app@latest',
  },
  {
    title: 'nuxtjs',
    value: 'npx create-nuxt-app',
  },
  {
    title: 'taro',
    value: 'npx @tarojs/cli init',
  },
]

const FRAMEWORK: PromptObject[] = [
  {
    type: 'select',
    name: 'init',
    message: 'select your framework',
    choices: frameWorkChoices,
  },
]

cli
  .command('[appName]', 'init')
  .alias('init')
  .action(async (appName: string, options) => {
    const answers = await prompts(FRAMEWORK)
    const { init } = answers
    execaCommandSync(`${init} ${appName || ''}`, {
      stdio: 'inherit',
    })
  })

cli.help()
cli.version('0.0.1')

cli.parse()
