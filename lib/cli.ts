import { cac } from 'cac'

const cli = cac('fe-weki')

// 收集 前端框架 自动化创建项目

cli.option('test', 'test')

cli
  .command('[root]', 'start') // default command
  .alias('start')
  .action(async (root, options) => {
    console.log(root, options)
  })

cli.help()
cli.version('0.0.1')

cli.parse()
