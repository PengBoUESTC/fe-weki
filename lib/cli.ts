import { cac } from 'cac'
import prompts from 'prompts'
import { execaCommandSync } from 'execa'
import type { PromptObject } from 'prompts'

const cli = cac('fe-weki')

const frameWorkChoices = [
  {
    title: 'vue',
    value: ' npm init vue@latest',
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
    message: '请选择需要使用的框架！',
    choices: frameWorkChoices,
  },
]

// 收集 前端框架 自动化创建项目

cli.option('[appName]', 'the target app name')

cli
  .command('[appName]', 'init')
  .alias('init')
  .action(async (appName: string) => {
    const answers = await prompts(FRAMEWORK)
    const { init } = answers
    execaCommandSync(`${init} ${appName || ''}`, {
      stdio: 'inherit',
    })
  })

cli.help()
cli.version('0.0.1')

cli.parse()
