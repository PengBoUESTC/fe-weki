import { cac } from 'cac'
import prompts from 'prompts'
import colors from 'picocolors'
import { execaCommandSync } from 'execa'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PromptObject, Choice } from 'prompts'

const cfgPath = join(__dirname, './cfg.json')

const getCfg = async () => {
  const initCmdMap: Record<string, string> = JSON.parse(
    readFileSync(cfgPath).toString(),
  )
  return initCmdMap
}

const setCfg = async (
  initCmdMap: Record<string, string>,
  newItem: Record<string, string>,
) => {
  const newMap = { ...initCmdMap, ...newItem }
  writeFileSync(cfgPath, JSON.stringify(newMap, null, 2), {})
}

const cli = cac('fe-weki')

cli
  .command('[appName]', 'init')
  .alias('init')
  .action(async (appName: string, options) => {
    const initCmdMap = await getCfg()

    const choices: Choice[] = Object.entries(initCmdMap).map(
      ([title, value]) => {
        return { title, value }
      },
    )
    const FRAMEWORK: PromptObject[] = [
      {
        type: 'select',
        name: 'init',
        message: 'select your framework',
        choices,
      },
    ]
    const answers = await prompts(FRAMEWORK)
    const { init } = answers
    execaCommandSync(`${init} ${appName || ''}`, {
      stdio: 'inherit',
    })
  })

cli
  .command('add [framework]', 'add a new framework')
  .option('--init [init]', 'the init cmd')
  .action(async (framework: string, options) => {
    const { init } = options
    if (!framework) {
      console.log(`\n${colors.red('[framework] is necessary!')}`)
    }
    const initCmdMap = await getCfg()

    const curPkg = initCmdMap[framework]
    if (curPkg) {
      // 确认逻辑
      const { yes } = await prompts([
        {
          type: 'confirm',
          name: 'yes',
          message: `replace ${colors.green(
            framework,
          )}'s init command from ${colors.yellow(curPkg)} to ${colors.green(
            init,
          )}`,
        },
      ])
      if (!yes) return
    }
    setCfg(initCmdMap, { [framework]: init })
  })

cli.help()
cli.version('0.0.1')

cli.parse()
