'use strict'

var require$$2 = require('events')
var require$$0 = require('readline')
var require$$0$1 = require('tty')
var node_buffer = require('node:buffer')
var path$3 = require('node:path')
var childProcess = require('node:child_process')
var process$2 = require('node:process')
var require$$0$4 = require('child_process')
var require$$0$3 = require('path')
var require$$0$2 = require('fs')
var url = require('node:url')
var os = require('node:os')
var require$$0$5 = require('assert')
var require$$0$7 = require('buffer')
var require$$0$6 = require('stream')
var require$$2$1 = require('util')
var node_fs = require('node:fs')

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value)
        })
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value))
      } catch (e) {
        reject(e)
      }
    }
    function rejected(value) {
      try {
        step(generator['throw'](value))
      } catch (e) {
        reject(e)
      }
    }
    function step(result) {
      result.done
        ? resolve(result.value)
        : adopt(result.value).then(fulfilled, rejected)
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}

function toArr(any) {
  return any == null ? [] : Array.isArray(any) ? any : [any]
}

function toVal(out, key, val, opts) {
  var x,
    old = out[key],
    nxt = !!~opts.string.indexOf(key)
      ? val == null || val === true
        ? ''
        : String(val)
      : typeof val === 'boolean'
      ? val
      : !!~opts.boolean.indexOf(key)
      ? val === 'false'
        ? false
        : val === 'true' ||
          (out._.push(((x = +val), x * 0 === 0) ? x : val), !!val)
      : ((x = +val), x * 0 === 0)
      ? x
      : val
  out[key] =
    old == null ? nxt : Array.isArray(old) ? old.concat(nxt) : [old, nxt]
}

function mri2(args, opts) {
  args = args || []
  opts = opts || {}

  var k,
    arr,
    arg,
    name,
    val,
    out = { _: [] }
  var i = 0,
    j = 0,
    idx = 0,
    len = args.length

  const alibi = opts.alias !== void 0
  const strict = opts.unknown !== void 0
  const defaults = opts.default !== void 0

  opts.alias = opts.alias || {}
  opts.string = toArr(opts.string)
  opts.boolean = toArr(opts.boolean)

  if (alibi) {
    for (k in opts.alias) {
      arr = opts.alias[k] = toArr(opts.alias[k])
      for (i = 0; i < arr.length; i++) {
        ;(opts.alias[arr[i]] = arr.concat(k)).splice(i, 1)
      }
    }
  }

  for (i = opts.boolean.length; i-- > 0; ) {
    arr = opts.alias[opts.boolean[i]] || []
    for (j = arr.length; j-- > 0; ) opts.boolean.push(arr[j])
  }

  for (i = opts.string.length; i-- > 0; ) {
    arr = opts.alias[opts.string[i]] || []
    for (j = arr.length; j-- > 0; ) opts.string.push(arr[j])
  }

  if (defaults) {
    for (k in opts.default) {
      name = typeof opts.default[k]
      arr = opts.alias[k] = opts.alias[k] || []
      if (opts[name] !== void 0) {
        opts[name].push(k)
        for (i = 0; i < arr.length; i++) {
          opts[name].push(arr[i])
        }
      }
    }
  }

  const keys = strict ? Object.keys(opts.alias) : []

  for (i = 0; i < len; i++) {
    arg = args[i]

    if (arg === '--') {
      out._ = out._.concat(args.slice(++i))
      break
    }

    for (j = 0; j < arg.length; j++) {
      if (arg.charCodeAt(j) !== 45) break // "-"
    }

    if (j === 0) {
      out._.push(arg)
    } else if (arg.substring(j, j + 3) === 'no-') {
      name = arg.substring(j + 3)
      if (strict && !~keys.indexOf(name)) {
        return opts.unknown(arg)
      }
      out[name] = false
    } else {
      for (idx = j + 1; idx < arg.length; idx++) {
        if (arg.charCodeAt(idx) === 61) break // "="
      }

      name = arg.substring(j, idx)
      val =
        arg.substring(++idx) ||
        i + 1 === len ||
        ('' + args[i + 1]).charCodeAt(0) === 45 ||
        args[++i]
      arr = j === 2 ? [name] : name

      for (idx = 0; idx < arr.length; idx++) {
        name = arr[idx]
        if (strict && !~keys.indexOf(name))
          return opts.unknown('-'.repeat(j) + name)
        toVal(out, name, idx + 1 < arr.length || val, opts)
      }
    }
  }

  if (defaults) {
    for (k in opts.default) {
      if (out[k] === void 0) {
        out[k] = opts.default[k]
      }
    }
  }

  if (alibi) {
    for (k in out) {
      arr = opts.alias[k] || []
      while (arr.length > 0) {
        out[arr.shift()] = out[k]
      }
    }
  }

  return out
}

const removeBrackets = (v) => v.replace(/[<[].+/, '').trim()
const findAllBrackets = (v) => {
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g
  const res = []
  const parse = (match) => {
    let variadic = false
    let value = match[1]
    if (value.startsWith('...')) {
      value = value.slice(3)
      variadic = true
    }
    return {
      required: match[0].startsWith('<'),
      value,
      variadic,
    }
  }
  let angledMatch
  while ((angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v))) {
    res.push(parse(angledMatch))
  }
  let squareMatch
  while ((squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v))) {
    res.push(parse(squareMatch))
  }
  return res
}
const getMriOptions = (options) => {
  const result = { alias: {}, boolean: [] }
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1)
    }
    if (option.isBoolean) {
      if (option.negated) {
        const hasStringTypeOption = options.some((o, i) => {
          return (
            i !== index &&
            o.names.some((name) => option.names.includes(name)) &&
            typeof o.required === 'boolean'
          )
        })
        if (!hasStringTypeOption) {
          result.boolean.push(option.names[0])
        }
      } else {
        result.boolean.push(option.names[0])
      }
    }
  }
  return result
}
const findLongest = (arr) => {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1
  })[0]
}
const padRight = (str, length) => {
  return str.length >= length ? str : `${str}${' '.repeat(length - str.length)}`
}
const camelcase = (input) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase()
  })
}
const setDotProp = (obj, keys, val) => {
  let i = 0
  let length = keys.length
  let t = obj
  let x
  for (; i < length; ++i) {
    x = t[keys[i]]
    t = t[keys[i]] =
      i === length - 1
        ? val
        : x != null
        ? x
        : !!~keys[i + 1].indexOf('.') || !(+keys[i + 1] > -1)
        ? {}
        : []
  }
}
const setByType = (obj, transforms) => {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key]
    if (transform.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key])
      if (typeof transform.transformFunction === 'function') {
        obj[key] = obj[key].map(transform.transformFunction)
      }
    }
  }
}
const getFileName = (input) => {
  const m = /([^\\\/]+)$/.exec(input)
  return m ? m[1] : ''
}
const camelcaseOptionName = (name) => {
  return name
    .split('.')
    .map((v, i) => {
      return i === 0 ? camelcase(v) : v
    })
    .join('.')
}
class CACError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

class Option {
  constructor(rawName, description, config) {
    this.rawName = rawName
    this.description = description
    this.config = Object.assign({}, config)
    rawName = rawName.replace(/\.\*/g, '')
    this.negated = false
    this.names = removeBrackets(rawName)
      .split(',')
      .map((v) => {
        let name = v.trim().replace(/^-{1,2}/, '')
        if (name.startsWith('no-')) {
          this.negated = true
          name = name.replace(/^no-/, '')
        }
        return camelcaseOptionName(name)
      })
      .sort((a, b) => (a.length > b.length ? 1 : -1))
    this.name = this.names[this.names.length - 1]
    if (this.negated && this.config.default == null) {
      this.config.default = true
    }
    if (rawName.includes('<')) {
      this.required = true
    } else if (rawName.includes('[')) {
      this.required = false
    } else {
      this.isBoolean = true
    }
  }
}

const processArgs = process.argv
const platformInfo = `${process.platform}-${process.arch} node-${process.version}`

class Command {
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName
    this.description = description
    this.config = config
    this.cli = cli
    this.options = []
    this.aliasNames = []
    this.name = removeBrackets(rawName)
    this.args = findAllBrackets(rawName)
    this.examples = []
  }
  usage(text) {
    this.usageText = text
    return this
  }
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true
    return this
  }
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true
    return this
  }
  version(version, customFlags = '-v, --version') {
    this.versionNumber = version
    this.option(customFlags, 'Display version number')
    return this
  }
  example(example) {
    this.examples.push(example)
    return this
  }
  option(rawName, description, config) {
    const option = new Option(rawName, description, config)
    this.options.push(option)
    return this
  }
  alias(name) {
    this.aliasNames.push(name)
    return this
  }
  action(callback) {
    this.commandAction = callback
    return this
  }
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name)
  }
  get isDefaultCommand() {
    return this.name === '' || this.aliasNames.includes('!')
  }
  get isGlobalCommand() {
    return this instanceof GlobalCommand
  }
  hasOption(name) {
    name = name.split('.')[0]
    return this.options.find((option) => {
      return option.names.includes(name)
    })
  }
  outputHelp() {
    const { name, commands } = this.cli
    const {
      versionNumber,
      options: globalOptions,
      helpCallback,
    } = this.cli.globalCommand
    let sections = [
      {
        body: `${name}${versionNumber ? `/${versionNumber}` : ''}`,
      },
    ]
    sections.push({
      title: 'Usage',
      body: `  $ ${name} ${this.usageText || this.rawName}`,
    })
    const showCommands =
      (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0
    if (showCommands) {
      const longestCommandName = findLongest(
        commands.map((command) => command.rawName),
      )
      sections.push({
        title: 'Commands',
        body: commands
          .map((command) => {
            return `  ${padRight(
              command.rawName,
              longestCommandName.length,
            )}  ${command.description}`
          })
          .join('\n'),
      })
      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands
          .map(
            (command) =>
              `  $ ${name}${
                command.name === '' ? '' : ` ${command.name}`
              } --help`,
          )
          .join('\n'),
      })
    }
    let options = this.isGlobalCommand
      ? globalOptions
      : [...this.options, ...(globalOptions || [])]
    if (!this.isGlobalCommand && !this.isDefaultCommand) {
      options = options.filter((option) => option.name !== 'version')
    }
    if (options.length > 0) {
      const longestOptionName = findLongest(
        options.map((option) => option.rawName),
      )
      sections.push({
        title: 'Options',
        body: options
          .map((option) => {
            return `  ${padRight(option.rawName, longestOptionName.length)}  ${
              option.description
            } ${
              option.config.default === void 0
                ? ''
                : `(default: ${option.config.default})`
            }`
          })
          .join('\n'),
      })
    }
    if (this.examples.length > 0) {
      sections.push({
        title: 'Examples',
        body: this.examples
          .map((example) => {
            if (typeof example === 'function') {
              return example(name)
            }
            return example
          })
          .join('\n'),
      })
    }
    if (helpCallback) {
      sections = helpCallback(sections) || sections
    }
    console.log(
      sections
        .map((section) => {
          return section.title
            ? `${section.title}:
${section.body}`
            : section.body
        })
        .join('\n\n'),
    )
  }
  outputVersion() {
    const { name } = this.cli
    const { versionNumber } = this.cli.globalCommand
    if (versionNumber) {
      console.log(`${name}/${versionNumber} ${platformInfo}`)
    }
  }
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length
    if (this.cli.args.length < minimalArgsCount) {
      throw new CACError(
        `missing required args for command \`${this.rawName}\``,
      )
    }
  }
  checkUnknownOptions() {
    const { options, globalCommand } = this.cli
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) {
        if (
          name !== '--' &&
          !this.hasOption(name) &&
          !globalCommand.hasOption(name)
        ) {
          throw new CACError(
            `Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``,
          )
        }
      }
    }
  }
  checkOptionValue() {
    const { options: parsedOptions, globalCommand } = this.cli
    const options = [...globalCommand.options, ...this.options]
    for (const option of options) {
      const value = parsedOptions[option.name.split('.')[0]]
      if (option.required) {
        const hasNegated = options.some(
          (o) => o.negated && o.names.includes(option.name),
        )
        if (value === true || (value === false && !hasNegated)) {
          throw new CACError(`option \`${option.rawName}\` value is missing`)
        }
      }
    }
  }
}
class GlobalCommand extends Command {
  constructor(cli) {
    super('@@global@@', '', {}, cli)
  }
}

var __assign = Object.assign
class CAC extends require$$2.EventEmitter {
  constructor(name = '') {
    super()
    this.name = name
    this.commands = []
    this.rawArgs = []
    this.args = []
    this.options = {}
    this.globalCommand = new GlobalCommand(this)
    this.globalCommand.usage('<command> [options]')
  }
  usage(text) {
    this.globalCommand.usage(text)
    return this
  }
  command(rawName, description, config) {
    const command = new Command(rawName, description || '', config, this)
    command.globalCommand = this.globalCommand
    this.commands.push(command)
    return command
  }
  option(rawName, description, config) {
    this.globalCommand.option(rawName, description, config)
    return this
  }
  help(callback) {
    this.globalCommand.option('-h, --help', 'Display this message')
    this.globalCommand.helpCallback = callback
    this.showHelpOnExit = true
    return this
  }
  version(version, customFlags = '-v, --version') {
    this.globalCommand.version(version, customFlags)
    this.showVersionOnExit = true
    return this
  }
  example(example) {
    this.globalCommand.example(example)
    return this
  }
  outputHelp() {
    if (this.matchedCommand) {
      this.matchedCommand.outputHelp()
    } else {
      this.globalCommand.outputHelp()
    }
  }
  outputVersion() {
    this.globalCommand.outputVersion()
  }
  setParsedInfo({ args, options }, matchedCommand, matchedCommandName) {
    this.args = args
    this.options = options
    if (matchedCommand) {
      this.matchedCommand = matchedCommand
    }
    if (matchedCommandName) {
      this.matchedCommandName = matchedCommandName
    }
    return this
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0
    this.matchedCommandName = void 0
  }
  parse(argv = processArgs, { run = true } = {}) {
    this.rawArgs = argv
    if (!this.name) {
      this.name = argv[1] ? getFileName(argv[1]) : 'cli'
    }
    let shouldParse = true
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command)
      const commandName = parsed.args[0]
      if (command.isMatched(commandName)) {
        shouldParse = false
        const parsedInfo = __assign(__assign({}, parsed), {
          args: parsed.args.slice(1),
        })
        this.setParsedInfo(parsedInfo, command, commandName)
        this.emit(`command:${commandName}`, command)
      }
    }
    if (shouldParse) {
      for (const command of this.commands) {
        if (command.name === '') {
          shouldParse = false
          const parsed = this.mri(argv.slice(2), command)
          this.setParsedInfo(parsed, command)
          this.emit(`command:!`, command)
        }
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2))
      this.setParsedInfo(parsed)
    }
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp()
      run = false
      this.unsetMatchedCommand()
    }
    if (
      this.options.version &&
      this.showVersionOnExit &&
      this.matchedCommandName == null
    ) {
      this.outputVersion()
      run = false
      this.unsetMatchedCommand()
    }
    const parsedArgv = { args: this.args, options: this.options }
    if (run) {
      this.runMatchedCommand()
    }
    if (!this.matchedCommand && this.args[0]) {
      this.emit('command:*')
    }
    return parsedArgv
  }
  mri(argv, command) {
    const cliOptions = [
      ...this.globalCommand.options,
      ...(command ? command.options : []),
    ]
    const mriOptions = getMriOptions(cliOptions)
    let argsAfterDoubleDashes = []
    const doubleDashesIndex = argv.indexOf('--')
    if (doubleDashesIndex > -1) {
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1)
      argv = argv.slice(0, doubleDashesIndex)
    }
    let parsed = mri2(argv, mriOptions)
    parsed = Object.keys(parsed).reduce(
      (res, name) => {
        return __assign(__assign({}, res), {
          [camelcaseOptionName(name)]: parsed[name],
        })
      },
      { _: [] },
    )
    const args = parsed._
    const options = {
      '--': argsAfterDoubleDashes,
    }
    const ignoreDefault =
      command && command.config.ignoreOptionDefaultValue
        ? command.config.ignoreOptionDefaultValue
        : this.globalCommand.config.ignoreOptionDefaultValue
    let transforms = Object.create(null)
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options[name] = cliOption.config.default
        }
      }
      if (Array.isArray(cliOption.config.type)) {
        if (transforms[cliOption.name] === void 0) {
          transforms[cliOption.name] = Object.create(null)
          transforms[cliOption.name]['shouldTransform'] = true
          transforms[cliOption.name]['transformFunction'] =
            cliOption.config.type[0]
        }
      }
    }
    for (const key of Object.keys(parsed)) {
      if (key !== '_') {
        const keys = key.split('.')
        setDotProp(options, keys, parsed[key])
        setByType(options, transforms)
      }
    }
    return {
      args,
      options,
    }
  }
  runMatchedCommand() {
    const { args, options, matchedCommand: command } = this
    if (!command || !command.commandAction) return
    command.checkUnknownOptions()
    command.checkOptionValue()
    command.checkRequiredArgs()
    const actionArgs = []
    command.args.forEach((arg, index) => {
      if (arg.variadic) {
        actionArgs.push(args.slice(index))
      } else {
        actionArgs.push(args[index])
      }
    })
    actionArgs.push(options)
    return command.commandAction.apply(this, actionArgs)
  }
}

const cac = (name = '') => new CAC(name)

var commonjsGlobal =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : {}

var prompts$2 = {}

var kleur
var hasRequiredKleur

function requireKleur() {
  if (hasRequiredKleur) return kleur
  hasRequiredKleur = 1

  const { FORCE_COLOR, NODE_DISABLE_COLORS, TERM } = process.env

  const $ = {
    enabled: !NODE_DISABLE_COLORS && TERM !== 'dumb' && FORCE_COLOR !== '0',

    // modifiers
    reset: init(0, 0),
    bold: init(1, 22),
    dim: init(2, 22),
    italic: init(3, 23),
    underline: init(4, 24),
    inverse: init(7, 27),
    hidden: init(8, 28),
    strikethrough: init(9, 29),

    // colors
    black: init(30, 39),
    red: init(31, 39),
    green: init(32, 39),
    yellow: init(33, 39),
    blue: init(34, 39),
    magenta: init(35, 39),
    cyan: init(36, 39),
    white: init(37, 39),
    gray: init(90, 39),
    grey: init(90, 39),

    // background colors
    bgBlack: init(40, 49),
    bgRed: init(41, 49),
    bgGreen: init(42, 49),
    bgYellow: init(43, 49),
    bgBlue: init(44, 49),
    bgMagenta: init(45, 49),
    bgCyan: init(46, 49),
    bgWhite: init(47, 49),
  }

  function run(arr, str) {
    let i = 0,
      tmp,
      beg = '',
      end = ''
    for (; i < arr.length; i++) {
      tmp = arr[i]
      beg += tmp.open
      end += tmp.close
      if (str.includes(tmp.close)) {
        str = str.replace(tmp.rgx, tmp.close + tmp.open)
      }
    }
    return beg + str + end
  }

  function chain(has, keys) {
    let ctx = { has, keys }

    ctx.reset = $.reset.bind(ctx)
    ctx.bold = $.bold.bind(ctx)
    ctx.dim = $.dim.bind(ctx)
    ctx.italic = $.italic.bind(ctx)
    ctx.underline = $.underline.bind(ctx)
    ctx.inverse = $.inverse.bind(ctx)
    ctx.hidden = $.hidden.bind(ctx)
    ctx.strikethrough = $.strikethrough.bind(ctx)

    ctx.black = $.black.bind(ctx)
    ctx.red = $.red.bind(ctx)
    ctx.green = $.green.bind(ctx)
    ctx.yellow = $.yellow.bind(ctx)
    ctx.blue = $.blue.bind(ctx)
    ctx.magenta = $.magenta.bind(ctx)
    ctx.cyan = $.cyan.bind(ctx)
    ctx.white = $.white.bind(ctx)
    ctx.gray = $.gray.bind(ctx)
    ctx.grey = $.grey.bind(ctx)

    ctx.bgBlack = $.bgBlack.bind(ctx)
    ctx.bgRed = $.bgRed.bind(ctx)
    ctx.bgGreen = $.bgGreen.bind(ctx)
    ctx.bgYellow = $.bgYellow.bind(ctx)
    ctx.bgBlue = $.bgBlue.bind(ctx)
    ctx.bgMagenta = $.bgMagenta.bind(ctx)
    ctx.bgCyan = $.bgCyan.bind(ctx)
    ctx.bgWhite = $.bgWhite.bind(ctx)

    return ctx
  }

  function init(open, close) {
    let blk = {
      open: `\x1b[${open}m`,
      close: `\x1b[${close}m`,
      rgx: new RegExp(`\\x1b\\[${close}m`, 'g'),
    }
    return function (txt) {
      if (this !== void 0 && this.has !== void 0) {
        this.has.includes(open) || (this.has.push(open), this.keys.push(blk))
        return txt === void 0
          ? this
          : $.enabled
          ? run(this.keys, txt + '')
          : txt + ''
      }
      return txt === void 0
        ? chain([open], [blk])
        : $.enabled
        ? run([blk], txt + '')
        : txt + ''
    }
  }

  kleur = $
  return kleur
}

var action$1
var hasRequiredAction$1

function requireAction$1() {
  if (hasRequiredAction$1) return action$1
  hasRequiredAction$1 = 1

  action$1 = (key, isSelect) => {
    if (key.meta && key.name !== 'escape') return

    if (key.ctrl) {
      if (key.name === 'a') return 'first'
      if (key.name === 'c') return 'abort'
      if (key.name === 'd') return 'abort'
      if (key.name === 'e') return 'last'
      if (key.name === 'g') return 'reset'
    }

    if (isSelect) {
      if (key.name === 'j') return 'down'
      if (key.name === 'k') return 'up'
    }

    if (key.name === 'return') return 'submit'
    if (key.name === 'enter') return 'submit' // ctrl + J

    if (key.name === 'backspace') return 'delete'
    if (key.name === 'delete') return 'deleteForward'
    if (key.name === 'abort') return 'abort'
    if (key.name === 'escape') return 'exit'
    if (key.name === 'tab') return 'next'
    if (key.name === 'pagedown') return 'nextPage'
    if (key.name === 'pageup') return 'prevPage' // TODO create home() in prompt types (e.g. TextPrompt)

    if (key.name === 'home') return 'home' // TODO create end() in prompt types (e.g. TextPrompt)

    if (key.name === 'end') return 'end'
    if (key.name === 'up') return 'up'
    if (key.name === 'down') return 'down'
    if (key.name === 'right') return 'right'
    if (key.name === 'left') return 'left'
    return false
  }
  return action$1
}

var strip$1
var hasRequiredStrip$1

function requireStrip$1() {
  if (hasRequiredStrip$1) return strip$1
  hasRequiredStrip$1 = 1

  strip$1 = (str) => {
    const pattern = [
      '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
      '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
    ].join('|')
    const RGX = new RegExp(pattern, 'g')
    return typeof str === 'string' ? str.replace(RGX, '') : str
  }
  return strip$1
}

var src
var hasRequiredSrc

function requireSrc() {
  if (hasRequiredSrc) return src
  hasRequiredSrc = 1

  const ESC = '\x1B'
  const CSI = `${ESC}[`
  const beep = '\u0007'

  const cursor = {
    to(x, y) {
      if (!y) return `${CSI}${x + 1}G`
      return `${CSI}${y + 1};${x + 1}H`
    },
    move(x, y) {
      let ret = ''

      if (x < 0) ret += `${CSI}${-x}D`
      else if (x > 0) ret += `${CSI}${x}C`

      if (y < 0) ret += `${CSI}${-y}A`
      else if (y > 0) ret += `${CSI}${y}B`

      return ret
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`,
  }

  const scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count),
  }

  const erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = ''
      for (let i = 0; i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : '')
      if (count) clear += cursor.left
      return clear
    },
  }

  src = { cursor, scroll, erase, beep }
  return src
}

var clear$1
var hasRequiredClear$1

function requireClear$1() {
  if (hasRequiredClear$1) return clear$1
  hasRequiredClear$1 = 1

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it =
      (typeof Symbol !== 'undefined' && o[Symbol.iterator]) || o['@@iterator']
    if (!it) {
      if (
        Array.isArray(o) ||
        (it = _unsupportedIterableToArray(o)) ||
        (allowArrayLike && o && typeof o.length === 'number')
      ) {
        if (it) o = it
        var i = 0
        var F = function F() {}
        return {
          s: F,
          n: function n() {
            if (i >= o.length) return { done: true }
            return { done: false, value: o[i++] }
          },
          e: function e(_e) {
            throw _e
          },
          f: F,
        }
      }
      throw new TypeError(
        'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      )
    }
    var normalCompletion = true,
      didErr = false,
      err
    return {
      s: function s() {
        it = it.call(o)
      },
      n: function n() {
        var step = it.next()
        normalCompletion = step.done
        return step
      },
      e: function e(_e2) {
        didErr = true
        err = _e2
      },
      f: function f() {
        try {
          if (!normalCompletion && it.return != null) it.return()
        } finally {
          if (didErr) throw err
        }
      },
    }
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return
    if (typeof o === 'string') return _arrayLikeToArray(o, minLen)
    var n = Object.prototype.toString.call(o).slice(8, -1)
    if (n === 'Object' && o.constructor) n = o.constructor.name
    if (n === 'Map' || n === 'Set') return Array.from(o)
    if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
      return _arrayLikeToArray(o, minLen)
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]
    return arr2
  }

  const strip = requireStrip$1()

  const _require = requireSrc(),
    erase = _require.erase,
    cursor = _require.cursor

  const width = (str) => [...strip(str)].length
  /**
   * @param {string} prompt
   * @param {number} perLine
   */

  clear$1 = function (prompt, perLine) {
    if (!perLine) return erase.line + cursor.to(0)
    let rows = 0
    const lines = prompt.split(/\r?\n/)

    var _iterator = _createForOfIteratorHelper(lines),
      _step

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done; ) {
        let line = _step.value
        rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / perLine)
      }
    } catch (err) {
      _iterator.e(err)
    } finally {
      _iterator.f()
    }

    return erase.lines(rows)
  }
  return clear$1
}

var figures_1$1
var hasRequiredFigures$1

function requireFigures$1() {
  if (hasRequiredFigures$1) return figures_1$1
  hasRequiredFigures$1 = 1

  const main = {
    arrowUp: '↑',
    arrowDown: '↓',
    arrowLeft: '←',
    arrowRight: '→',
    radioOn: '◉',
    radioOff: '◯',
    tick: '✔',
    cross: '✖',
    ellipsis: '…',
    pointerSmall: '›',
    line: '─',
    pointer: '❯',
  }
  const win = {
    arrowUp: main.arrowUp,
    arrowDown: main.arrowDown,
    arrowLeft: main.arrowLeft,
    arrowRight: main.arrowRight,
    radioOn: '(*)',
    radioOff: '( )',
    tick: '√',
    cross: '×',
    ellipsis: '...',
    pointerSmall: '»',
    line: '─',
    pointer: '>',
  }
  const figures = process.platform === 'win32' ? win : main
  figures_1$1 = figures
  return figures_1$1
}

var style$1
var hasRequiredStyle$1

function requireStyle$1() {
  if (hasRequiredStyle$1) return style$1
  hasRequiredStyle$1 = 1

  const c = requireKleur()

  const figures = requireFigures$1() // rendering user input.

  const styles = Object.freeze({
    password: {
      scale: 1,
      render: (input) => '*'.repeat(input.length),
    },
    emoji: {
      scale: 2,
      render: (input) => '😃'.repeat(input.length),
    },
    invisible: {
      scale: 0,
      render: (input) => '',
    },
    default: {
      scale: 1,
      render: (input) => `${input}`,
    },
  })

  const render = (type) => styles[type] || styles.default // icon to signalize a prompt.

  const symbols = Object.freeze({
    aborted: c.red(figures.cross),
    done: c.green(figures.tick),
    exited: c.yellow(figures.cross),
    default: c.cyan('?'),
  })

  const symbol = (done, aborted, exited) =>
    aborted
      ? symbols.aborted
      : exited
      ? symbols.exited
      : done
      ? symbols.done
      : symbols.default // between the question and the user's input.

  const delimiter = (completing) =>
    c.gray(completing ? figures.ellipsis : figures.pointerSmall)

  const item = (expandable, expanded) =>
    c.gray(expandable ? (expanded ? figures.pointerSmall : '+') : figures.line)

  style$1 = {
    styles,
    render,
    symbols,
    symbol,
    delimiter,
    item,
  }
  return style$1
}

var lines$1
var hasRequiredLines$1

function requireLines$1() {
  if (hasRequiredLines$1) return lines$1
  hasRequiredLines$1 = 1

  const strip = requireStrip$1()
  /**
   * @param {string} msg
   * @param {number} perLine
   */

  lines$1 = function (msg, perLine) {
    let lines = String(strip(msg) || '').split(/\r?\n/)
    if (!perLine) return lines.length
    return lines
      .map((l) => Math.ceil(l.length / perLine))
      .reduce((a, b) => a + b)
  }
  return lines$1
}

var wrap$1
var hasRequiredWrap$1

function requireWrap$1() {
  if (hasRequiredWrap$1) return wrap$1
  hasRequiredWrap$1 = 1
  /**
   * @param {string} msg The message to wrap
   * @param {object} opts
   * @param {number|string} [opts.margin] Left margin
   * @param {number} opts.width Maximum characters per line including the margin
   */

  wrap$1 = (msg, opts = {}) => {
    const tab = Number.isSafeInteger(parseInt(opts.margin))
      ? new Array(parseInt(opts.margin)).fill(' ').join('')
      : opts.margin || ''
    const width = opts.width
    return (msg || '')
      .split(/\r?\n/g)
      .map((line) =>
        line
          .split(/\s+/g)
          .reduce(
            (arr, w) => {
              if (
                w.length + tab.length >= width ||
                arr[arr.length - 1].length + w.length + 1 < width
              )
                arr[arr.length - 1] += ` ${w}`
              else arr.push(`${tab}${w}`)
              return arr
            },
            [tab],
          )
          .join('\n'),
      )
      .join('\n')
  }
  return wrap$1
}

var entriesToDisplay$1
var hasRequiredEntriesToDisplay$1

function requireEntriesToDisplay$1() {
  if (hasRequiredEntriesToDisplay$1) return entriesToDisplay$1
  hasRequiredEntriesToDisplay$1 = 1
  /**
   * Determine what entries should be displayed on the screen, based on the
   * currently selected index and the maximum visible. Used in list-based
   * prompts like `select` and `multiselect`.
   *
   * @param {number} cursor the currently selected entry
   * @param {number} total the total entries available to display
   * @param {number} [maxVisible] the number of entries that can be displayed
   */

  entriesToDisplay$1 = (cursor, total, maxVisible) => {
    maxVisible = maxVisible || total
    let startIndex = Math.min(
      total - maxVisible,
      cursor - Math.floor(maxVisible / 2),
    )
    if (startIndex < 0) startIndex = 0
    let endIndex = Math.min(startIndex + maxVisible, total)
    return {
      startIndex,
      endIndex,
    }
  }
  return entriesToDisplay$1
}

var util$1
var hasRequiredUtil$1

function requireUtil$1() {
  if (hasRequiredUtil$1) return util$1
  hasRequiredUtil$1 = 1

  util$1 = {
    action: requireAction$1(),
    clear: requireClear$1(),
    style: requireStyle$1(),
    strip: requireStrip$1(),
    figures: requireFigures$1(),
    lines: requireLines$1(),
    wrap: requireWrap$1(),
    entriesToDisplay: requireEntriesToDisplay$1(),
  }
  return util$1
}

var prompt$1
var hasRequiredPrompt$1

function requirePrompt$1() {
  if (hasRequiredPrompt$1) return prompt$1
  hasRequiredPrompt$1 = 1

  const readline = require$$0

  const _require = requireUtil$1(),
    action = _require.action

  const EventEmitter = require$$2

  const _require2 = requireSrc(),
    beep = _require2.beep,
    cursor = _require2.cursor

  const color = requireKleur()
  /**
   * Base prompt skeleton
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */

  class Prompt extends EventEmitter {
    constructor(opts = {}) {
      super()
      this.firstRender = true
      this.in = opts.stdin || process.stdin
      this.out = opts.stdout || process.stdout

      this.onRender = (opts.onRender || (() => void 0)).bind(this)

      const rl = readline.createInterface({
        input: this.in,
        escapeCodeTimeout: 50,
      })
      readline.emitKeypressEvents(this.in, rl)
      if (this.in.isTTY) this.in.setRawMode(true)
      const isSelect =
        ['SelectPrompt', 'MultiselectPrompt'].indexOf(this.constructor.name) >
        -1

      const keypress = (str, key) => {
        let a = action(key, isSelect)

        if (a === false) {
          this._ && this._(str, key)
        } else if (typeof this[a] === 'function') {
          this[a](key)
        } else {
          this.bell()
        }
      }

      this.close = () => {
        this.out.write(cursor.show)
        this.in.removeListener('keypress', keypress)
        if (this.in.isTTY) this.in.setRawMode(false)
        rl.close()
        this.emit(
          this.aborted ? 'abort' : this.exited ? 'exit' : 'submit',
          this.value,
        )
        this.closed = true
      }

      this.in.on('keypress', keypress)
    }

    fire() {
      this.emit('state', {
        value: this.value,
        aborted: !!this.aborted,
        exited: !!this.exited,
      })
    }

    bell() {
      this.out.write(beep)
    }

    render() {
      this.onRender(color)
      if (this.firstRender) this.firstRender = false
    }
  }

  prompt$1 = Prompt
  return prompt$1
}

var text$1
var hasRequiredText$1

function requireText$1() {
  if (hasRequiredText$1) return text$1
  hasRequiredText$1 = 1

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
        }
        _next(undefined)
      })
    }
  }

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireSrc(),
    erase = _require.erase,
    cursor = _require.cursor

  const _require2 = requireUtil$1(),
    style = _require2.style,
    clear = _require2.clear,
    lines = _require2.lines,
    figures = _require2.figures
  /**
   * TextPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {String} [opts.style='default'] Render style
   * @param {String} [opts.initial] Default value
   * @param {Function} [opts.validate] Validate function
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.error] The invalid error label
   */

  class TextPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.transform = style.render(opts.style)
      this.scale = this.transform.scale
      this.msg = opts.message
      this.initial = opts.initial || ``

      this.validator = opts.validate || (() => true)

      this.value = ``
      this.errorMsg = opts.error || `Please Enter A Valid Value`
      this.cursor = Number(!!this.initial)
      this.cursorOffset = 0
      this.clear = clear(``, this.out.columns)
      this.render()
    }

    set value(v) {
      if (!v && this.initial) {
        this.placeholder = true
        this.rendered = color.gray(this.transform.render(this.initial))
      } else {
        this.placeholder = false
        this.rendered = this.transform.render(v)
      }

      this._value = v
      this.fire()
    }

    get value() {
      return this._value
    }

    reset() {
      this.value = ``
      this.cursor = Number(!!this.initial)
      this.cursorOffset = 0
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.value = this.value || this.initial
      this.done = this.aborted = true
      this.error = false
      this.red = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    validate() {
      var _this = this

      return _asyncToGenerator(function* () {
        let valid = yield _this.validator(_this.value)

        if (typeof valid === `string`) {
          _this.errorMsg = valid
          valid = false
        }

        _this.error = !valid
      })()
    }

    submit() {
      var _this2 = this

      return _asyncToGenerator(function* () {
        _this2.value = _this2.value || _this2.initial
        _this2.cursorOffset = 0
        _this2.cursor = _this2.rendered.length
        yield _this2.validate()

        if (_this2.error) {
          _this2.red = true

          _this2.fire()

          _this2.render()

          return
        }

        _this2.done = true
        _this2.aborted = false

        _this2.fire()

        _this2.render()

        _this2.out.write('\n')

        _this2.close()
      })()
    }

    next() {
      if (!this.placeholder) return this.bell()
      this.value = this.initial
      this.cursor = this.rendered.length
      this.fire()
      this.render()
    }

    moveCursor(n) {
      if (this.placeholder) return
      this.cursor = this.cursor + n
      this.cursorOffset += n
    }

    _(c, key) {
      let s1 = this.value.slice(0, this.cursor)
      let s2 = this.value.slice(this.cursor)
      this.value = `${s1}${c}${s2}`
      this.red = false
      this.cursor = this.placeholder ? 0 : s1.length + 1
      this.render()
    }

    delete() {
      if (this.isCursorAtStart()) return this.bell()
      let s1 = this.value.slice(0, this.cursor - 1)
      let s2 = this.value.slice(this.cursor)
      this.value = `${s1}${s2}`
      this.red = false

      if (this.isCursorAtStart()) {
        this.cursorOffset = 0
      } else {
        this.cursorOffset++
        this.moveCursor(-1)
      }

      this.render()
    }

    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
        return this.bell()
      let s1 = this.value.slice(0, this.cursor)
      let s2 = this.value.slice(this.cursor + 1)
      this.value = `${s1}${s2}`
      this.red = false

      if (this.isCursorAtEnd()) {
        this.cursorOffset = 0
      } else {
        this.cursorOffset++
      }

      this.render()
    }

    first() {
      this.cursor = 0
      this.render()
    }

    last() {
      this.cursor = this.value.length
      this.render()
    }

    left() {
      if (this.cursor <= 0 || this.placeholder) return this.bell()
      this.moveCursor(-1)
      this.render()
    }

    right() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
        return this.bell()
      this.moveCursor(1)
      this.render()
    }

    isCursorAtStart() {
      return this.cursor === 0 || (this.placeholder && this.cursor === 1)
    }

    isCursorAtEnd() {
      return (
        this.cursor === this.rendered.length ||
        (this.placeholder && this.cursor === this.rendered.length + 1)
      )
    }

    render() {
      if (this.closed) return

      if (!this.firstRender) {
        if (this.outputError)
          this.out.write(
            cursor.down(lines(this.outputError, this.out.columns) - 1) +
              clear(this.outputError, this.out.columns),
          )
        this.out.write(clear(this.outputText, this.out.columns))
      }

      super.render()
      this.outputError = ''
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.red ? color.red(this.rendered) : this.rendered,
      ].join(` `)

      if (this.error) {
        this.outputError += this.errorMsg
          .split(`\n`)
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ' ' : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(
        erase.line +
          cursor.to(0) +
          this.outputText +
          cursor.save +
          this.outputError +
          cursor.restore +
          cursor.move(this.cursorOffset, 0),
      )
    }
  }

  text$1 = TextPrompt
  return text$1
}

var select$1
var hasRequiredSelect$1

function requireSelect$1() {
  if (hasRequiredSelect$1) return select$1
  hasRequiredSelect$1 = 1

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireUtil$1(),
    style = _require.style,
    clear = _require.clear,
    figures = _require.figures,
    wrap = _require.wrap,
    entriesToDisplay = _require.entriesToDisplay

  const _require2 = requireSrc(),
    cursor = _require2.cursor
  /**
   * SelectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {Number} [opts.initial] Index of default value
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {Number} [opts.optionsPerPage=10] Max options to display at once
   */

  class SelectPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.hint = opts.hint || '- Use arrow-keys. Return to submit.'
      this.warn = opts.warn || '- This option is disabled'
      this.cursor = opts.initial || 0
      this.choices = opts.choices.map((ch, idx) => {
        if (typeof ch === 'string')
          ch = {
            title: ch,
            value: idx,
          }
        return {
          title: ch && (ch.title || ch.value || ch),
          value: ch && (ch.value === undefined ? idx : ch.value),
          description: ch && ch.description,
          selected: ch && ch.selected,
          disabled: ch && ch.disabled,
        }
      })
      this.optionsPerPage = opts.optionsPerPage || 10
      this.value = (this.choices[this.cursor] || {}).value
      this.clear = clear('', this.out.columns)
      this.render()
    }

    moveCursor(n) {
      this.cursor = n
      this.value = this.choices[n].value
      this.fire()
    }

    reset() {
      this.moveCursor(0)
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      if (!this.selection.disabled) {
        this.done = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      } else this.bell()
    }

    first() {
      this.moveCursor(0)
      this.render()
    }

    last() {
      this.moveCursor(this.choices.length - 1)
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.moveCursor(this.choices.length - 1)
      } else {
        this.moveCursor(this.cursor - 1)
      }

      this.render()
    }

    down() {
      if (this.cursor === this.choices.length - 1) {
        this.moveCursor(0)
      } else {
        this.moveCursor(this.cursor + 1)
      }

      this.render()
    }

    next() {
      this.moveCursor((this.cursor + 1) % this.choices.length)
      this.render()
    }

    _(c, key) {
      if (c === ' ') return this.submit()
    }

    get selection() {
      return this.choices[this.cursor]
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      let _entriesToDisplay = entriesToDisplay(
          this.cursor,
          this.choices.length,
          this.optionsPerPage,
        ),
        startIndex = _entriesToDisplay.startIndex,
        endIndex = _entriesToDisplay.endIndex // Print prompt

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.done
          ? this.selection.title
          : this.selection.disabled
          ? color.yellow(this.warn)
          : color.gray(this.hint),
      ].join(' ') // Print choices

      if (!this.done) {
        this.outputText += '\n'

        for (let i = startIndex; i < endIndex; i++) {
          let title,
            prefix,
            desc = '',
            v = this.choices[i] // Determine whether to display "more choices" indicators

          if (i === startIndex && startIndex > 0) {
            prefix = figures.arrowUp
          } else if (i === endIndex - 1 && endIndex < this.choices.length) {
            prefix = figures.arrowDown
          } else {
            prefix = ' '
          }

          if (v.disabled) {
            title =
              this.cursor === i
                ? color.gray().underline(v.title)
                : color.strikethrough().gray(v.title)
            prefix =
              (this.cursor === i
                ? color.bold().gray(figures.pointer) + ' '
                : '  ') + prefix
          } else {
            title =
              this.cursor === i ? color.cyan().underline(v.title) : v.title
            prefix =
              (this.cursor === i ? color.cyan(figures.pointer) + ' ' : '  ') +
              prefix

            if (v.description && this.cursor === i) {
              desc = ` - ${v.description}`

              if (
                prefix.length + title.length + desc.length >=
                  this.out.columns ||
                v.description.split(/\r?\n/).length > 1
              ) {
                desc =
                  '\n' +
                  wrap(v.description, {
                    margin: 3,
                    width: this.out.columns,
                  })
              }
            }
          }

          this.outputText += `${prefix} ${title}${color.gray(desc)}\n`
        }
      }

      this.out.write(this.outputText)
    }
  }

  select$1 = SelectPrompt
  return select$1
}

var toggle$1
var hasRequiredToggle$1

function requireToggle$1() {
  if (hasRequiredToggle$1) return toggle$1
  hasRequiredToggle$1 = 1

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireUtil$1(),
    style = _require.style,
    clear = _require.clear

  const _require2 = requireSrc(),
    cursor = _require2.cursor,
    erase = _require2.erase
  /**
   * TogglePrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Boolean} [opts.initial=false] Default value
   * @param {String} [opts.active='no'] Active label
   * @param {String} [opts.inactive='off'] Inactive label
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */

  class TogglePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.value = !!opts.initial
      this.active = opts.active || 'on'
      this.inactive = opts.inactive || 'off'
      this.initialValue = this.value
      this.render()
    }

    reset() {
      this.value = this.initialValue
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    deactivate() {
      if (this.value === false) return this.bell()
      this.value = false
      this.render()
    }

    activate() {
      if (this.value === true) return this.bell()
      this.value = true
      this.render()
    }

    delete() {
      this.deactivate()
    }

    left() {
      this.deactivate()
    }

    right() {
      this.activate()
    }

    down() {
      this.deactivate()
    }

    up() {
      this.activate()
    }

    next() {
      this.value = !this.value
      this.fire()
      this.render()
    }

    _(c, key) {
      if (c === ' ') {
        this.value = !this.value
      } else if (c === '1') {
        this.value = true
      } else if (c === '0') {
        this.value = false
      } else return this.bell()

      this.render()
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.value ? this.inactive : color.cyan().underline(this.inactive),
        color.gray('/'),
        this.value ? color.cyan().underline(this.active) : this.active,
      ].join(' ')
      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  toggle$1 = TogglePrompt
  return toggle$1
}

var datepart$1
var hasRequiredDatepart$1

function requireDatepart$1() {
  if (hasRequiredDatepart$1) return datepart$1
  hasRequiredDatepart$1 = 1

  class DatePart {
    constructor({ token, date, parts, locales }) {
      this.token = token
      this.date = date || new Date()
      this.parts = parts || [this]
      this.locales = locales || {}
    }

    up() {}

    down() {}

    next() {
      const currentIdx = this.parts.indexOf(this)
      return this.parts.find(
        (part, idx) => idx > currentIdx && part instanceof DatePart,
      )
    }

    setTo(val) {}

    prev() {
      let parts = [].concat(this.parts).reverse()
      const currentIdx = parts.indexOf(this)
      return parts.find(
        (part, idx) => idx > currentIdx && part instanceof DatePart,
      )
    }

    toString() {
      return String(this.date)
    }
  }

  datepart$1 = DatePart
  return datepart$1
}

var meridiem$1
var hasRequiredMeridiem$1

function requireMeridiem$1() {
  if (hasRequiredMeridiem$1) return meridiem$1
  hasRequiredMeridiem$1 = 1

  const DatePart = requireDatepart$1()

  class Meridiem extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setHours((this.date.getHours() + 12) % 24)
    }

    down() {
      this.up()
    }

    toString() {
      let meridiem = this.date.getHours() > 12 ? 'pm' : 'am'
      return /\A/.test(this.token) ? meridiem.toUpperCase() : meridiem
    }
  }

  meridiem$1 = Meridiem
  return meridiem$1
}

var day$1
var hasRequiredDay$1

function requireDay$1() {
  if (hasRequiredDay$1) return day$1
  hasRequiredDay$1 = 1

  const DatePart = requireDatepart$1()

  const pos = (n) => {
    n = n % 10
    return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  }

  class Day extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setDate(this.date.getDate() + 1)
    }

    down() {
      this.date.setDate(this.date.getDate() - 1)
    }

    setTo(val) {
      this.date.setDate(parseInt(val.substr(-2)))
    }

    toString() {
      let date = this.date.getDate()
      let day = this.date.getDay()
      return this.token === 'DD'
        ? String(date).padStart(2, '0')
        : this.token === 'Do'
        ? date + pos(date)
        : this.token === 'd'
        ? day + 1
        : this.token === 'ddd'
        ? this.locales.weekdaysShort[day]
        : this.token === 'dddd'
        ? this.locales.weekdays[day]
        : date
    }
  }

  day$1 = Day
  return day$1
}

var hours$1
var hasRequiredHours$1

function requireHours$1() {
  if (hasRequiredHours$1) return hours$1
  hasRequiredHours$1 = 1

  const DatePart = requireDatepart$1()

  class Hours extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setHours(this.date.getHours() + 1)
    }

    down() {
      this.date.setHours(this.date.getHours() - 1)
    }

    setTo(val) {
      this.date.setHours(parseInt(val.substr(-2)))
    }

    toString() {
      let hours = this.date.getHours()
      if (/h/.test(this.token)) hours = hours % 12 || 12
      return this.token.length > 1 ? String(hours).padStart(2, '0') : hours
    }
  }

  hours$1 = Hours
  return hours$1
}

var milliseconds$1
var hasRequiredMilliseconds$1

function requireMilliseconds$1() {
  if (hasRequiredMilliseconds$1) return milliseconds$1
  hasRequiredMilliseconds$1 = 1

  const DatePart = requireDatepart$1()

  class Milliseconds extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMilliseconds(this.date.getMilliseconds() + 1)
    }

    down() {
      this.date.setMilliseconds(this.date.getMilliseconds() - 1)
    }

    setTo(val) {
      this.date.setMilliseconds(parseInt(val.substr(-this.token.length)))
    }

    toString() {
      return String(this.date.getMilliseconds())
        .padStart(4, '0')
        .substr(0, this.token.length)
    }
  }

  milliseconds$1 = Milliseconds
  return milliseconds$1
}

var minutes$1
var hasRequiredMinutes$1

function requireMinutes$1() {
  if (hasRequiredMinutes$1) return minutes$1
  hasRequiredMinutes$1 = 1

  const DatePart = requireDatepart$1()

  class Minutes extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMinutes(this.date.getMinutes() + 1)
    }

    down() {
      this.date.setMinutes(this.date.getMinutes() - 1)
    }

    setTo(val) {
      this.date.setMinutes(parseInt(val.substr(-2)))
    }

    toString() {
      let m = this.date.getMinutes()
      return this.token.length > 1 ? String(m).padStart(2, '0') : m
    }
  }

  minutes$1 = Minutes
  return minutes$1
}

var month$1
var hasRequiredMonth$1

function requireMonth$1() {
  if (hasRequiredMonth$1) return month$1
  hasRequiredMonth$1 = 1

  const DatePart = requireDatepart$1()

  class Month extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMonth(this.date.getMonth() + 1)
    }

    down() {
      this.date.setMonth(this.date.getMonth() - 1)
    }

    setTo(val) {
      val = parseInt(val.substr(-2)) - 1
      this.date.setMonth(val < 0 ? 0 : val)
    }

    toString() {
      let month = this.date.getMonth()
      let tl = this.token.length
      return tl === 2
        ? String(month + 1).padStart(2, '0')
        : tl === 3
        ? this.locales.monthsShort[month]
        : tl === 4
        ? this.locales.months[month]
        : String(month + 1)
    }
  }

  month$1 = Month
  return month$1
}

var seconds$1
var hasRequiredSeconds$1

function requireSeconds$1() {
  if (hasRequiredSeconds$1) return seconds$1
  hasRequiredSeconds$1 = 1

  const DatePart = requireDatepart$1()

  class Seconds extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setSeconds(this.date.getSeconds() + 1)
    }

    down() {
      this.date.setSeconds(this.date.getSeconds() - 1)
    }

    setTo(val) {
      this.date.setSeconds(parseInt(val.substr(-2)))
    }

    toString() {
      let s = this.date.getSeconds()
      return this.token.length > 1 ? String(s).padStart(2, '0') : s
    }
  }

  seconds$1 = Seconds
  return seconds$1
}

var year$1
var hasRequiredYear$1

function requireYear$1() {
  if (hasRequiredYear$1) return year$1
  hasRequiredYear$1 = 1

  const DatePart = requireDatepart$1()

  class Year extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setFullYear(this.date.getFullYear() + 1)
    }

    down() {
      this.date.setFullYear(this.date.getFullYear() - 1)
    }

    setTo(val) {
      this.date.setFullYear(val.substr(-4))
    }

    toString() {
      let year = String(this.date.getFullYear()).padStart(4, '0')
      return this.token.length === 2 ? year.substr(-2) : year
    }
  }

  year$1 = Year
  return year$1
}

var dateparts$1
var hasRequiredDateparts$1

function requireDateparts$1() {
  if (hasRequiredDateparts$1) return dateparts$1
  hasRequiredDateparts$1 = 1

  dateparts$1 = {
    DatePart: requireDatepart$1(),
    Meridiem: requireMeridiem$1(),
    Day: requireDay$1(),
    Hours: requireHours$1(),
    Milliseconds: requireMilliseconds$1(),
    Minutes: requireMinutes$1(),
    Month: requireMonth$1(),
    Seconds: requireSeconds$1(),
    Year: requireYear$1(),
  }
  return dateparts$1
}

var date$1
var hasRequiredDate$1

function requireDate$1() {
  if (hasRequiredDate$1) return date$1
  hasRequiredDate$1 = 1

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
        }
        _next(undefined)
      })
    }
  }

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireUtil$1(),
    style = _require.style,
    clear = _require.clear,
    figures = _require.figures

  const _require2 = requireSrc(),
    erase = _require2.erase,
    cursor = _require2.cursor

  const _require3 = requireDateparts$1(),
    DatePart = _require3.DatePart,
    Meridiem = _require3.Meridiem,
    Day = _require3.Day,
    Hours = _require3.Hours,
    Milliseconds = _require3.Milliseconds,
    Minutes = _require3.Minutes,
    Month = _require3.Month,
    Seconds = _require3.Seconds,
    Year = _require3.Year

  const regex =
    /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g
  const regexGroups = {
    1: ({ token }) => token.replace(/\\(.)/g, '$1'),
    2: (opts) => new Day(opts),
    // Day // TODO
    3: (opts) => new Month(opts),
    // Month
    4: (opts) => new Year(opts),
    // Year
    5: (opts) => new Meridiem(opts),
    // AM/PM // TODO (special)
    6: (opts) => new Hours(opts),
    // Hours
    7: (opts) => new Minutes(opts),
    // Minutes
    8: (opts) => new Seconds(opts),
    // Seconds
    9: (opts) => new Milliseconds(opts), // Fractional seconds
  }
  const dfltLocales = {
    months:
      'January,February,March,April,May,June,July,August,September,October,November,December'.split(
        ',',
      ),
    monthsShort: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(
      ',',
    ),
    weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(','),
  }
  /**
   * DatePrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Number} [opts.initial] Index of default value
   * @param {String} [opts.mask] The format mask
   * @param {object} [opts.locales] The date locales
   * @param {String} [opts.error] The error message shown on invalid value
   * @param {Function} [opts.validate] Function to validate the submitted value
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */

  class DatePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.cursor = 0
      this.typed = ''
      this.locales = Object.assign(dfltLocales, opts.locales)
      this._date = opts.initial || new Date()
      this.errorMsg = opts.error || 'Please Enter A Valid Value'

      this.validator = opts.validate || (() => true)

      this.mask = opts.mask || 'YYYY-MM-DD HH:mm:ss'
      this.clear = clear('', this.out.columns)
      this.render()
    }

    get value() {
      return this.date
    }

    get date() {
      return this._date
    }

    set date(date) {
      if (date) this._date.setTime(date.getTime())
    }

    set mask(mask) {
      let result
      this.parts = []

      while ((result = regex.exec(mask))) {
        let match = result.shift()
        let idx = result.findIndex((gr) => gr != null)
        this.parts.push(
          idx in regexGroups
            ? regexGroups[idx]({
                token: result[idx] || match,
                date: this.date,
                parts: this.parts,
                locales: this.locales,
              })
            : result[idx] || match,
        )
      }

      let parts = this.parts.reduce((arr, i) => {
        if (typeof i === 'string' && typeof arr[arr.length - 1] === 'string')
          arr[arr.length - 1] += i
        else arr.push(i)
        return arr
      }, [])
      this.parts.splice(0)
      this.parts.push(...parts)
      this.reset()
    }

    moveCursor(n) {
      this.typed = ''
      this.cursor = n
      this.fire()
    }

    reset() {
      this.moveCursor(this.parts.findIndex((p) => p instanceof DatePart))
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.error = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    validate() {
      var _this = this

      return _asyncToGenerator(function* () {
        let valid = yield _this.validator(_this.value)

        if (typeof valid === 'string') {
          _this.errorMsg = valid
          valid = false
        }

        _this.error = !valid
      })()
    }

    submit() {
      var _this2 = this

      return _asyncToGenerator(function* () {
        yield _this2.validate()

        if (_this2.error) {
          _this2.color = 'red'

          _this2.fire()

          _this2.render()

          return
        }

        _this2.done = true
        _this2.aborted = false

        _this2.fire()

        _this2.render()

        _this2.out.write('\n')

        _this2.close()
      })()
    }

    up() {
      this.typed = ''
      this.parts[this.cursor].up()
      this.render()
    }

    down() {
      this.typed = ''
      this.parts[this.cursor].down()
      this.render()
    }

    left() {
      let prev = this.parts[this.cursor].prev()
      if (prev == null) return this.bell()
      this.moveCursor(this.parts.indexOf(prev))
      this.render()
    }

    right() {
      let next = this.parts[this.cursor].next()
      if (next == null) return this.bell()
      this.moveCursor(this.parts.indexOf(next))
      this.render()
    }

    next() {
      let next = this.parts[this.cursor].next()
      this.moveCursor(
        next
          ? this.parts.indexOf(next)
          : this.parts.findIndex((part) => part instanceof DatePart),
      )
      this.render()
    }

    _(c) {
      if (/\d/.test(c)) {
        this.typed += c
        this.parts[this.cursor].setTo(this.typed)
        this.render()
      }
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render() // Print prompt

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.parts
          .reduce(
            (arr, p, idx) =>
              arr.concat(
                idx === this.cursor && !this.done
                  ? color.cyan().underline(p.toString())
                  : p,
              ),
            [],
          )
          .join(''),
      ].join(' ') // Print error

      if (this.error) {
        this.outputText += this.errorMsg
          .split('\n')
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  date$1 = DatePrompt
  return date$1
}

var number$1
var hasRequiredNumber$1

function requireNumber$1() {
  if (hasRequiredNumber$1) return number$1
  hasRequiredNumber$1 = 1

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
        }
        _next(undefined)
      })
    }
  }

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireSrc(),
    cursor = _require.cursor,
    erase = _require.erase

  const _require2 = requireUtil$1(),
    style = _require2.style,
    figures = _require2.figures,
    clear = _require2.clear,
    lines = _require2.lines

  const isNumber = /[0-9]/

  const isDef = (any) => any !== undefined

  const round = (number, precision) => {
    let factor = Math.pow(10, precision)
    return Math.round(number * factor) / factor
  }
  /**
   * NumberPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {String} [opts.style='default'] Render style
   * @param {Number} [opts.initial] Default value
   * @param {Number} [opts.max=+Infinity] Max value
   * @param {Number} [opts.min=-Infinity] Min value
   * @param {Boolean} [opts.float=false] Parse input as floats
   * @param {Number} [opts.round=2] Round floats to x decimals
   * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
   * @param {Function} [opts.validate] Validate function
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.error] The invalid error label
   */

  class NumberPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.transform = style.render(opts.style)
      this.msg = opts.message
      this.initial = isDef(opts.initial) ? opts.initial : ''
      this.float = !!opts.float
      this.round = opts.round || 2
      this.inc = opts.increment || 1
      this.min = isDef(opts.min) ? opts.min : -Infinity
      this.max = isDef(opts.max) ? opts.max : Infinity
      this.errorMsg = opts.error || `Please Enter A Valid Value`

      this.validator = opts.validate || (() => true)

      this.color = `cyan`
      this.value = ``
      this.typed = ``
      this.lastHit = 0
      this.render()
    }

    set value(v) {
      if (!v && v !== 0) {
        this.placeholder = true
        this.rendered = color.gray(this.transform.render(`${this.initial}`))
        this._value = ``
      } else {
        this.placeholder = false
        this.rendered = this.transform.render(`${round(v, this.round)}`)
        this._value = round(v, this.round)
      }

      this.fire()
    }

    get value() {
      return this._value
    }

    parse(x) {
      return this.float ? parseFloat(x) : parseInt(x)
    }

    valid(c) {
      return c === `-` || (c === `.` && this.float) || isNumber.test(c)
    }

    reset() {
      this.typed = ``
      this.value = ``
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      let x = this.value
      this.value = x !== `` ? x : this.initial
      this.done = this.aborted = true
      this.error = false
      this.fire()
      this.render()
      this.out.write(`\n`)
      this.close()
    }

    validate() {
      var _this = this

      return _asyncToGenerator(function* () {
        let valid = yield _this.validator(_this.value)

        if (typeof valid === `string`) {
          _this.errorMsg = valid
          valid = false
        }

        _this.error = !valid
      })()
    }

    submit() {
      var _this2 = this

      return _asyncToGenerator(function* () {
        yield _this2.validate()

        if (_this2.error) {
          _this2.color = `red`

          _this2.fire()

          _this2.render()

          return
        }

        let x = _this2.value
        _this2.value = x !== `` ? x : _this2.initial
        _this2.done = true
        _this2.aborted = false
        _this2.error = false

        _this2.fire()

        _this2.render()

        _this2.out.write(`\n`)

        _this2.close()
      })()
    }

    up() {
      this.typed = ``

      if (this.value === '') {
        this.value = this.min - this.inc
      }

      if (this.value >= this.max) return this.bell()
      this.value += this.inc
      this.color = `cyan`
      this.fire()
      this.render()
    }

    down() {
      this.typed = ``

      if (this.value === '') {
        this.value = this.min + this.inc
      }

      if (this.value <= this.min) return this.bell()
      this.value -= this.inc
      this.color = `cyan`
      this.fire()
      this.render()
    }

    delete() {
      let val = this.value.toString()
      if (val.length === 0) return this.bell()
      this.value = this.parse((val = val.slice(0, -1))) || ``

      if (this.value !== '' && this.value < this.min) {
        this.value = this.min
      }

      this.color = `cyan`
      this.fire()
      this.render()
    }

    next() {
      this.value = this.initial
      this.fire()
      this.render()
    }

    _(c, key) {
      if (!this.valid(c)) return this.bell()
      const now = Date.now()
      if (now - this.lastHit > 1000) this.typed = `` // 1s elapsed

      this.typed += c
      this.lastHit = now
      this.color = `cyan`
      if (c === `.`) return this.fire()
      this.value = Math.min(this.parse(this.typed), this.max)
      if (this.value > this.max) this.value = this.max
      if (this.value < this.min) this.value = this.min
      this.fire()
      this.render()
    }

    render() {
      if (this.closed) return

      if (!this.firstRender) {
        if (this.outputError)
          this.out.write(
            cursor.down(lines(this.outputError, this.out.columns) - 1) +
              clear(this.outputError, this.out.columns),
          )
        this.out.write(clear(this.outputText, this.out.columns))
      }

      super.render()
      this.outputError = '' // Print prompt

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        !this.done || (!this.done && !this.placeholder)
          ? color[this.color]().underline(this.rendered)
          : this.rendered,
      ].join(` `) // Print error

      if (this.error) {
        this.outputError += this.errorMsg
          .split(`\n`)
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(
        erase.line +
          cursor.to(0) +
          this.outputText +
          cursor.save +
          this.outputError +
          cursor.restore,
      )
    }
  }

  number$1 = NumberPrompt
  return number$1
}

var multiselect$1
var hasRequiredMultiselect$1

function requireMultiselect$1() {
  if (hasRequiredMultiselect$1) return multiselect$1
  hasRequiredMultiselect$1 = 1

  const color = requireKleur()

  const _require = requireSrc(),
    cursor = _require.cursor

  const Prompt = requirePrompt$1()

  const _require2 = requireUtil$1(),
    clear = _require2.clear,
    figures = _require2.figures,
    style = _require2.style,
    wrap = _require2.wrap,
    entriesToDisplay = _require2.entriesToDisplay
  /**
   * MultiselectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {String} [opts.warn] Hint shown for disabled choices
   * @param {Number} [opts.max] Max choices
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {Number} [opts.optionsPerPage=10] Max options to display at once
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */

  class MultiselectPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.cursor = opts.cursor || 0
      this.scrollIndex = opts.cursor || 0
      this.hint = opts.hint || ''
      this.warn = opts.warn || '- This option is disabled -'
      this.minSelected = opts.min
      this.showMinError = false
      this.maxChoices = opts.max
      this.instructions = opts.instructions
      this.optionsPerPage = opts.optionsPerPage || 10
      this.value = opts.choices.map((ch, idx) => {
        if (typeof ch === 'string')
          ch = {
            title: ch,
            value: idx,
          }
        return {
          title: ch && (ch.title || ch.value || ch),
          description: ch && ch.description,
          value: ch && (ch.value === undefined ? idx : ch.value),
          selected: ch && ch.selected,
          disabled: ch && ch.disabled,
        }
      })
      this.clear = clear('', this.out.columns)

      if (!opts.overrideRender) {
        this.render()
      }
    }

    reset() {
      this.value.map((v) => !v.selected)
      this.cursor = 0
      this.fire()
      this.render()
    }

    selected() {
      return this.value.filter((v) => v.selected)
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      const selected = this.value.filter((e) => e.selected)

      if (this.minSelected && selected.length < this.minSelected) {
        this.showMinError = true
        this.render()
      } else {
        this.done = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      }
    }

    first() {
      this.cursor = 0
      this.render()
    }

    last() {
      this.cursor = this.value.length - 1
      this.render()
    }

    next() {
      this.cursor = (this.cursor + 1) % this.value.length
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.cursor = this.value.length - 1
      } else {
        this.cursor--
      }

      this.render()
    }

    down() {
      if (this.cursor === this.value.length - 1) {
        this.cursor = 0
      } else {
        this.cursor++
      }

      this.render()
    }

    left() {
      this.value[this.cursor].selected = false
      this.render()
    }

    right() {
      if (this.value.filter((e) => e.selected).length >= this.maxChoices)
        return this.bell()
      this.value[this.cursor].selected = true
      this.render()
    }

    handleSpaceToggle() {
      const v = this.value[this.cursor]

      if (v.selected) {
        v.selected = false
        this.render()
      } else if (
        v.disabled ||
        this.value.filter((e) => e.selected).length >= this.maxChoices
      ) {
        return this.bell()
      } else {
        v.selected = true
        this.render()
      }
    }

    toggleAll() {
      if (this.maxChoices !== undefined || this.value[this.cursor].disabled) {
        return this.bell()
      }

      const newSelected = !this.value[this.cursor].selected
      this.value
        .filter((v) => !v.disabled)
        .forEach((v) => (v.selected = newSelected))
      this.render()
    }

    _(c, key) {
      if (c === ' ') {
        this.handleSpaceToggle()
      } else if (c === 'a') {
        this.toggleAll()
      } else {
        return this.bell()
      }
    }

    renderInstructions() {
      if (this.instructions === undefined || this.instructions) {
        if (typeof this.instructions === 'string') {
          return this.instructions
        }

        return (
          '\nInstructions:\n' +
          `    ${figures.arrowUp}/${figures.arrowDown}: Highlight option\n` +
          `    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection\n` +
          (this.maxChoices === undefined ? `    a: Toggle all\n` : '') +
          `    enter/return: Complete answer`
        )
      }

      return ''
    }

    renderOption(cursor, v, i, arrowIndicator) {
      const prefix =
        (v.selected ? color.green(figures.radioOn) : figures.radioOff) +
        ' ' +
        arrowIndicator +
        ' '
      let title, desc

      if (v.disabled) {
        title =
          cursor === i
            ? color.gray().underline(v.title)
            : color.strikethrough().gray(v.title)
      } else {
        title = cursor === i ? color.cyan().underline(v.title) : v.title

        if (cursor === i && v.description) {
          desc = ` - ${v.description}`

          if (
            prefix.length + title.length + desc.length >= this.out.columns ||
            v.description.split(/\r?\n/).length > 1
          ) {
            desc =
              '\n' +
              wrap(v.description, {
                margin: prefix.length,
                width: this.out.columns,
              })
          }
        }
      }

      return prefix + title + color.gray(desc || '')
    } // shared with autocompleteMultiselect

    paginateOptions(options) {
      if (options.length === 0) {
        return color.red('No matches for this query.')
      }

      let _entriesToDisplay = entriesToDisplay(
          this.cursor,
          options.length,
          this.optionsPerPage,
        ),
        startIndex = _entriesToDisplay.startIndex,
        endIndex = _entriesToDisplay.endIndex

      let prefix,
        styledOptions = []

      for (let i = startIndex; i < endIndex; i++) {
        if (i === startIndex && startIndex > 0) {
          prefix = figures.arrowUp
        } else if (i === endIndex - 1 && endIndex < options.length) {
          prefix = figures.arrowDown
        } else {
          prefix = ' '
        }

        styledOptions.push(
          this.renderOption(this.cursor, options[i], i, prefix),
        )
      }

      return '\n' + styledOptions.join('\n')
    } // shared with autocomleteMultiselect

    renderOptions(options) {
      if (!this.done) {
        return this.paginateOptions(options)
      }

      return ''
    }

    renderDoneOrInstructions() {
      if (this.done) {
        return this.value
          .filter((e) => e.selected)
          .map((v) => v.title)
          .join(', ')
      }

      const output = [color.gray(this.hint), this.renderInstructions()]

      if (this.value[this.cursor].disabled) {
        output.push(color.yellow(this.warn))
      }

      return output.join(' ')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      super.render() // print prompt

      let prompt = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.renderDoneOrInstructions(),
      ].join(' ')

      if (this.showMinError) {
        prompt += color.red(
          `You must select a minimum of ${this.minSelected} choices.`,
        )
        this.showMinError = false
      }

      prompt += this.renderOptions(this.value)
      this.out.write(this.clear + prompt)
      this.clear = clear(prompt, this.out.columns)
    }
  }

  multiselect$1 = MultiselectPrompt
  return multiselect$1
}

var autocomplete$1
var hasRequiredAutocomplete$1

function requireAutocomplete$1() {
  if (hasRequiredAutocomplete$1) return autocomplete$1
  hasRequiredAutocomplete$1 = 1

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
        }
        _next(undefined)
      })
    }
  }

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireSrc(),
    erase = _require.erase,
    cursor = _require.cursor

  const _require2 = requireUtil$1(),
    style = _require2.style,
    clear = _require2.clear,
    figures = _require2.figures,
    wrap = _require2.wrap,
    entriesToDisplay = _require2.entriesToDisplay

  const getVal = (arr, i) => arr[i] && (arr[i].value || arr[i].title || arr[i])

  const getTitle = (arr, i) =>
    arr[i] && (arr[i].title || arr[i].value || arr[i])

  const getIndex = (arr, valOrTitle) => {
    const index = arr.findIndex(
      (el) => el.value === valOrTitle || el.title === valOrTitle,
    )
    return index > -1 ? index : undefined
  }
  /**
   * TextPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of auto-complete choices objects
   * @param {Function} [opts.suggest] Filter function. Defaults to sort by title
   * @param {Number} [opts.limit=10] Max number of results to show
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {String} [opts.style='default'] Render style
   * @param {String} [opts.fallback] Fallback message - initial to default value
   * @param {String} [opts.initial] Index of the default value
   * @param {Boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.noMatches] The no matches found label
   */

  class AutocompletePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.suggest = opts.suggest
      this.choices = opts.choices
      this.initial =
        typeof opts.initial === 'number'
          ? opts.initial
          : getIndex(opts.choices, opts.initial)
      this.select = this.initial || opts.cursor || 0
      this.i18n = {
        noMatches: opts.noMatches || 'no matches found',
      }
      this.fallback = opts.fallback || this.initial
      this.clearFirst = opts.clearFirst || false
      this.suggestions = []
      this.input = ''
      this.limit = opts.limit || 10
      this.cursor = 0
      this.transform = style.render(opts.style)
      this.scale = this.transform.scale
      this.render = this.render.bind(this)
      this.complete = this.complete.bind(this)
      this.clear = clear('', this.out.columns)
      this.complete(this.render)
      this.render()
    }

    set fallback(fb) {
      this._fb = Number.isSafeInteger(parseInt(fb)) ? parseInt(fb) : fb
    }

    get fallback() {
      let choice
      if (typeof this._fb === 'number') choice = this.choices[this._fb]
      else if (typeof this._fb === 'string')
        choice = {
          title: this._fb,
        }
      return (
        choice ||
        this._fb || {
          title: this.i18n.noMatches,
        }
      )
    }

    moveSelect(i) {
      this.select = i
      if (this.suggestions.length > 0) this.value = getVal(this.suggestions, i)
      else this.value = this.fallback.value
      this.fire()
    }

    complete(cb) {
      var _this = this

      return _asyncToGenerator(function* () {
        const p = (_this.completing = _this.suggest(_this.input, _this.choices))

        const suggestions = yield p
        if (_this.completing !== p) return
        _this.suggestions = suggestions.map((s, i, arr) => ({
          title: getTitle(arr, i),
          value: getVal(arr, i),
          description: s.description,
        }))
        _this.completing = false
        const l = Math.max(suggestions.length - 1, 0)

        _this.moveSelect(Math.min(l, _this.select))

        cb && cb()
      })()
    }

    reset() {
      this.input = ''
      this.complete(() => {
        this.moveSelect(this.initial !== void 0 ? this.initial : 0)
        this.render()
      })
      this.render()
    }

    exit() {
      if (this.clearFirst && this.input.length > 0) {
        this.reset()
      } else {
        this.done = this.exited = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      }
    }

    abort() {
      this.done = this.aborted = true
      this.exited = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.done = true
      this.aborted = this.exited = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    _(c, key) {
      let s1 = this.input.slice(0, this.cursor)
      let s2 = this.input.slice(this.cursor)
      this.input = `${s1}${c}${s2}`
      this.cursor = s1.length + 1
      this.complete(this.render)
      this.render()
    }

    delete() {
      if (this.cursor === 0) return this.bell()
      let s1 = this.input.slice(0, this.cursor - 1)
      let s2 = this.input.slice(this.cursor)
      this.input = `${s1}${s2}`
      this.complete(this.render)
      this.cursor = this.cursor - 1
      this.render()
    }

    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell()
      let s1 = this.input.slice(0, this.cursor)
      let s2 = this.input.slice(this.cursor + 1)
      this.input = `${s1}${s2}`
      this.complete(this.render)
      this.render()
    }

    first() {
      this.moveSelect(0)
      this.render()
    }

    last() {
      this.moveSelect(this.suggestions.length - 1)
      this.render()
    }

    up() {
      if (this.select === 0) {
        this.moveSelect(this.suggestions.length - 1)
      } else {
        this.moveSelect(this.select - 1)
      }

      this.render()
    }

    down() {
      if (this.select === this.suggestions.length - 1) {
        this.moveSelect(0)
      } else {
        this.moveSelect(this.select + 1)
      }

      this.render()
    }

    next() {
      if (this.select === this.suggestions.length - 1) {
        this.moveSelect(0)
      } else this.moveSelect(this.select + 1)

      this.render()
    }

    nextPage() {
      this.moveSelect(
        Math.min(this.select + this.limit, this.suggestions.length - 1),
      )
      this.render()
    }

    prevPage() {
      this.moveSelect(Math.max(this.select - this.limit, 0))
      this.render()
    }

    left() {
      if (this.cursor <= 0) return this.bell()
      this.cursor = this.cursor - 1
      this.render()
    }

    right() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell()
      this.cursor = this.cursor + 1
      this.render()
    }

    renderOption(v, hovered, isStart, isEnd) {
      let desc
      let prefix = isStart ? figures.arrowUp : isEnd ? figures.arrowDown : ' '
      let title = hovered ? color.cyan().underline(v.title) : v.title
      prefix = (hovered ? color.cyan(figures.pointer) + ' ' : '  ') + prefix

      if (v.description) {
        desc = ` - ${v.description}`

        if (
          prefix.length + title.length + desc.length >= this.out.columns ||
          v.description.split(/\r?\n/).length > 1
        ) {
          desc =
            '\n' +
            wrap(v.description, {
              margin: 3,
              width: this.out.columns,
            })
        }
      }

      return prefix + ' ' + title + color.gray(desc || '')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      let _entriesToDisplay = entriesToDisplay(
          this.select,
          this.choices.length,
          this.limit,
        ),
        startIndex = _entriesToDisplay.startIndex,
        endIndex = _entriesToDisplay.endIndex

      this.outputText = [
        style.symbol(this.done, this.aborted, this.exited),
        color.bold(this.msg),
        style.delimiter(this.completing),
        this.done && this.suggestions[this.select]
          ? this.suggestions[this.select].title
          : (this.rendered = this.transform.render(this.input)),
      ].join(' ')

      if (!this.done) {
        const suggestions = this.suggestions
          .slice(startIndex, endIndex)
          .map((item, i) =>
            this.renderOption(
              item,
              this.select === i + startIndex,
              i === 0 && startIndex > 0,
              i + startIndex === endIndex - 1 && endIndex < this.choices.length,
            ),
          )
          .join('\n')
        this.outputText +=
          `\n` + (suggestions || color.gray(this.fallback.title))
      }

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  autocomplete$1 = AutocompletePrompt
  return autocomplete$1
}

var autocompleteMultiselect$1
var hasRequiredAutocompleteMultiselect$1

function requireAutocompleteMultiselect$1() {
  if (hasRequiredAutocompleteMultiselect$1) return autocompleteMultiselect$1
  hasRequiredAutocompleteMultiselect$1 = 1

  const color = requireKleur()

  const _require = requireSrc(),
    cursor = _require.cursor

  const MultiselectPrompt = requireMultiselect$1()

  const _require2 = requireUtil$1(),
    clear = _require2.clear,
    style = _require2.style,
    figures = _require2.figures
  /**
   * MultiselectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {String} [opts.warn] Hint shown for disabled choices
   * @param {Number} [opts.max] Max choices
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */

  class AutocompleteMultiselectPrompt extends MultiselectPrompt {
    constructor(opts = {}) {
      opts.overrideRender = true
      super(opts)
      this.inputValue = ''
      this.clear = clear('', this.out.columns)
      this.filteredOptions = this.value
      this.render()
    }

    last() {
      this.cursor = this.filteredOptions.length - 1
      this.render()
    }

    next() {
      this.cursor = (this.cursor + 1) % this.filteredOptions.length
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.cursor = this.filteredOptions.length - 1
      } else {
        this.cursor--
      }

      this.render()
    }

    down() {
      if (this.cursor === this.filteredOptions.length - 1) {
        this.cursor = 0
      } else {
        this.cursor++
      }

      this.render()
    }

    left() {
      this.filteredOptions[this.cursor].selected = false
      this.render()
    }

    right() {
      if (this.value.filter((e) => e.selected).length >= this.maxChoices)
        return this.bell()
      this.filteredOptions[this.cursor].selected = true
      this.render()
    }

    delete() {
      if (this.inputValue.length) {
        this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1)
        this.updateFilteredOptions()
      }
    }

    updateFilteredOptions() {
      const currentHighlight = this.filteredOptions[this.cursor]
      this.filteredOptions = this.value.filter((v) => {
        if (this.inputValue) {
          if (typeof v.title === 'string') {
            if (v.title.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true
            }
          }

          if (typeof v.value === 'string') {
            if (v.value.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true
            }
          }

          return false
        }

        return true
      })
      const newHighlightIndex = this.filteredOptions.findIndex(
        (v) => v === currentHighlight,
      )
      this.cursor = newHighlightIndex < 0 ? 0 : newHighlightIndex
      this.render()
    }

    handleSpaceToggle() {
      const v = this.filteredOptions[this.cursor]

      if (v.selected) {
        v.selected = false
        this.render()
      } else if (
        v.disabled ||
        this.value.filter((e) => e.selected).length >= this.maxChoices
      ) {
        return this.bell()
      } else {
        v.selected = true
        this.render()
      }
    }

    handleInputChange(c) {
      this.inputValue = this.inputValue + c
      this.updateFilteredOptions()
    }

    _(c, key) {
      if (c === ' ') {
        this.handleSpaceToggle()
      } else {
        this.handleInputChange(c)
      }
    }

    renderInstructions() {
      if (this.instructions === undefined || this.instructions) {
        if (typeof this.instructions === 'string') {
          return this.instructions
        }

        return `
Instructions:
    ${figures.arrowUp}/${figures.arrowDown}: Highlight option
    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
`
      }

      return ''
    }

    renderCurrentInput() {
      return `
Filtered results for: ${
        this.inputValue
          ? this.inputValue
          : color.gray('Enter something to filter')
      }\n`
    }

    renderOption(cursor, v, i) {
      let title
      if (v.disabled)
        title =
          cursor === i
            ? color.gray().underline(v.title)
            : color.strikethrough().gray(v.title)
      else title = cursor === i ? color.cyan().underline(v.title) : v.title
      return (
        (v.selected ? color.green(figures.radioOn) : figures.radioOff) +
        '  ' +
        title
      )
    }

    renderDoneOrInstructions() {
      if (this.done) {
        return this.value
          .filter((e) => e.selected)
          .map((v) => v.title)
          .join(', ')
      }

      const output = [
        color.gray(this.hint),
        this.renderInstructions(),
        this.renderCurrentInput(),
      ]

      if (
        this.filteredOptions.length &&
        this.filteredOptions[this.cursor].disabled
      ) {
        output.push(color.yellow(this.warn))
      }

      return output.join(' ')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      super.render() // print prompt

      let prompt = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.renderDoneOrInstructions(),
      ].join(' ')

      if (this.showMinError) {
        prompt += color.red(
          `You must select a minimum of ${this.minSelected} choices.`,
        )
        this.showMinError = false
      }

      prompt += this.renderOptions(this.filteredOptions)
      this.out.write(this.clear + prompt)
      this.clear = clear(prompt, this.out.columns)
    }
  }

  autocompleteMultiselect$1 = AutocompleteMultiselectPrompt
  return autocompleteMultiselect$1
}

var confirm$1
var hasRequiredConfirm$1

function requireConfirm$1() {
  if (hasRequiredConfirm$1) return confirm$1
  hasRequiredConfirm$1 = 1

  const color = requireKleur()

  const Prompt = requirePrompt$1()

  const _require = requireUtil$1(),
    style = _require.style,
    clear = _require.clear

  const _require2 = requireSrc(),
    erase = _require2.erase,
    cursor = _require2.cursor
  /**
   * ConfirmPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Boolean} [opts.initial] Default value (true/false)
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.yes] The "Yes" label
   * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
   * @param {String} [opts.no] The "No" label
   * @param {String} [opts.noOption] The "No" option when choosing between yes/no
   */

  class ConfirmPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.value = opts.initial
      this.initialValue = !!opts.initial
      this.yesMsg = opts.yes || 'yes'
      this.yesOption = opts.yesOption || '(Y/n)'
      this.noMsg = opts.no || 'no'
      this.noOption = opts.noOption || '(y/N)'
      this.render()
    }

    reset() {
      this.value = this.initialValue
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.value = this.value || false
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    _(c, key) {
      if (c.toLowerCase() === 'y') {
        this.value = true
        return this.submit()
      }

      if (c.toLowerCase() === 'n') {
        this.value = false
        return this.submit()
      }

      return this.bell()
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.done
          ? this.value
            ? this.yesMsg
            : this.noMsg
          : color.gray(this.initialValue ? this.yesOption : this.noOption),
      ].join(' ')
      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  confirm$1 = ConfirmPrompt
  return confirm$1
}

var elements$1
var hasRequiredElements$1

function requireElements$1() {
  if (hasRequiredElements$1) return elements$1
  hasRequiredElements$1 = 1

  elements$1 = {
    TextPrompt: requireText$1(),
    SelectPrompt: requireSelect$1(),
    TogglePrompt: requireToggle$1(),
    DatePrompt: requireDate$1(),
    NumberPrompt: requireNumber$1(),
    MultiselectPrompt: requireMultiselect$1(),
    AutocompletePrompt: requireAutocomplete$1(),
    AutocompleteMultiselectPrompt: requireAutocompleteMultiselect$1(),
    ConfirmPrompt: requireConfirm$1(),
  }
  return elements$1
}

var hasRequiredPrompts$1

function requirePrompts$1() {
  if (hasRequiredPrompts$1) return prompts$2
  hasRequiredPrompts$1 = 1
  ;(function (exports) {
    const $ = exports

    const el = requireElements$1()

    const noop = (v) => v

    function toPrompt(type, args, opts = {}) {
      return new Promise((res, rej) => {
        const p = new el[type](args)
        const onAbort = opts.onAbort || noop
        const onSubmit = opts.onSubmit || noop
        const onExit = opts.onExit || noop
        p.on('state', args.onState || noop)
        p.on('submit', (x) => res(onSubmit(x)))
        p.on('exit', (x) => res(onExit(x)))
        p.on('abort', (x) => rej(onAbort(x)))
      })
    }
    /**
     * Text prompt
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.text = (args) => toPrompt('TextPrompt', args)
    /**
     * Password prompt with masked input
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.password = (args) => {
      args.style = 'password'
      return $.text(args)
    }
    /**
     * Prompt where input is invisible, like sudo
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.invisible = (args) => {
      args.style = 'invisible'
      return $.text(args)
    }
    /**
     * Number prompt
     * @param {string} args.message Prompt message to display
     * @param {number} args.initial Default number value
     * @param {function} [args.onState] On state change callback
     * @param {number} [args.max] Max value
     * @param {number} [args.min] Min value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {Boolean} [opts.float=false] Parse input as floats
     * @param {Number} [opts.round=2] Round floats to x decimals
     * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.number = (args) => toPrompt('NumberPrompt', args)
    /**
     * Date prompt
     * @param {string} args.message Prompt message to display
     * @param {number} args.initial Default number value
     * @param {function} [args.onState] On state change callback
     * @param {number} [args.max] Max value
     * @param {number} [args.min] Min value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {Boolean} [opts.float=false] Parse input as floats
     * @param {Number} [opts.round=2] Round floats to x decimals
     * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.date = (args) => toPrompt('DatePrompt', args)
    /**
     * Classic yes/no prompt
     * @param {string} args.message Prompt message to display
     * @param {boolean} [args.initial=false] Default value
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.confirm = (args) => toPrompt('ConfirmPrompt', args)
    /**
     * List prompt, split intput string by `seperator`
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {string} [args.separator] String separator
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input, in form of an `Array`
     */

    $.list = (args) => {
      const sep = args.separator || ','
      return toPrompt('TextPrompt', args, {
        onSubmit: (str) => str.split(sep).map((s) => s.trim()),
      })
    }
    /**
     * Toggle/switch prompt
     * @param {string} args.message Prompt message to display
     * @param {boolean} [args.initial=false] Default value
     * @param {string} [args.active="on"] Text for `active` state
     * @param {string} [args.inactive="off"] Text for `inactive` state
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.toggle = (args) => toPrompt('TogglePrompt', args)
    /**
     * Interactive select prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of choices objects `[{ title, value }, ...]`
     * @param {number} [args.initial] Index of default value
     * @param {String} [args.hint] Hint to display
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.select = (args) => toPrompt('SelectPrompt', args)
    /**
     * Interactive multi-select / autocompleteMultiselect prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of choices objects `[{ title, value, [selected] }, ...]`
     * @param {number} [args.max] Max select
     * @param {string} [args.hint] Hint to display user
     * @param {Number} [args.cursor=0] Cursor start position
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.multiselect = (args) => {
      args.choices = [].concat(args.choices || [])

      const toSelected = (items) =>
        items.filter((item) => item.selected).map((item) => item.value)

      return toPrompt('MultiselectPrompt', args, {
        onAbort: toSelected,
        onSubmit: toSelected,
      })
    }

    $.autocompleteMultiselect = (args) => {
      args.choices = [].concat(args.choices || [])

      const toSelected = (items) =>
        items.filter((item) => item.selected).map((item) => item.value)

      return toPrompt('AutocompleteMultiselectPrompt', args, {
        onAbort: toSelected,
        onSubmit: toSelected,
      })
    }

    const byTitle = (input, choices) =>
      Promise.resolve(
        choices.filter(
          (item) =>
            item.title.slice(0, input.length).toLowerCase() ===
            input.toLowerCase(),
        ),
      )
    /**
     * Interactive auto-complete prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of auto-complete choices objects `[{ title, value }, ...]`
     * @param {Function} [args.suggest] Function to filter results based on user input. Defaults to sort by `title`
     * @param {number} [args.limit=10] Max number of results to show
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {String} [args.initial] Index of the default value
     * @param {boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
     * @param {String} [args.fallback] Fallback message - defaults to initial value
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */

    $.autocomplete = (args) => {
      args.suggest = args.suggest || byTitle
      args.choices = [].concat(args.choices || [])
      return toPrompt('AutocompletePrompt', args)
    }
  })(prompts$2)
  return prompts$2
}

var dist
var hasRequiredDist

function requireDist() {
  if (hasRequiredDist) return dist
  hasRequiredDist = 1

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object)
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object)
      if (enumerableOnly) {
        symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable
        })
      }
      keys.push.apply(keys, symbols)
    }
    return keys
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {}
      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key])
        })
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(
          target,
          Object.getOwnPropertyDescriptors(source),
        )
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(
            target,
            key,
            Object.getOwnPropertyDescriptor(source, key),
          )
        })
      }
    }
    return target
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      obj[key] = value
    }
    return obj
  }

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it =
      (typeof Symbol !== 'undefined' && o[Symbol.iterator]) || o['@@iterator']
    if (!it) {
      if (
        Array.isArray(o) ||
        (it = _unsupportedIterableToArray(o)) ||
        (allowArrayLike && o && typeof o.length === 'number')
      ) {
        if (it) o = it
        var i = 0
        var F = function F() {}
        return {
          s: F,
          n: function n() {
            if (i >= o.length) return { done: true }
            return { done: false, value: o[i++] }
          },
          e: function e(_e) {
            throw _e
          },
          f: F,
        }
      }
      throw new TypeError(
        'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
      )
    }
    var normalCompletion = true,
      didErr = false,
      err
    return {
      s: function s() {
        it = it.call(o)
      },
      n: function n() {
        var step = it.next()
        normalCompletion = step.done
        return step
      },
      e: function e(_e2) {
        didErr = true
        err = _e2
      },
      f: function f() {
        try {
          if (!normalCompletion && it.return != null) it.return()
        } finally {
          if (didErr) throw err
        }
      },
    }
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return
    if (typeof o === 'string') return _arrayLikeToArray(o, minLen)
    var n = Object.prototype.toString.call(o).slice(8, -1)
    if (n === 'Object' && o.constructor) n = o.constructor.name
    if (n === 'Map' || n === 'Set') return Array.from(o)
    if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
      return _arrayLikeToArray(o, minLen)
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]
    return arr2
  }

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg)
      var value = info.value
    } catch (error) {
      reject(error)
      return
    }
    if (info.done) {
      resolve(value)
    } else {
      Promise.resolve(value).then(_next, _throw)
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args)
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
        }
        _next(undefined)
      })
    }
  }

  const prompts = requirePrompts$1()

  const passOn = [
    'suggest',
    'format',
    'onState',
    'validate',
    'onRender',
    'type',
  ]

  const noop = () => {}
  /**
   * Prompt for a series of questions
   * @param {Array|Object} questions Single question object or Array of question objects
   * @param {Function} [onSubmit] Callback function called on prompt submit
   * @param {Function} [onCancel] Callback function called on cancel/abort
   * @returns {Object} Object with values from user input
   */

  function prompt() {
    return _prompt.apply(this, arguments)
  }

  function _prompt() {
    _prompt = _asyncToGenerator(function* (
      questions = [],
      { onSubmit = noop, onCancel = noop } = {},
    ) {
      const answers = {}
      const override = prompt._override || {}
      questions = [].concat(questions)
      let answer, question, quit, name, type, lastPrompt

      const getFormattedAnswer = /*#__PURE__*/ (function () {
        var _ref = _asyncToGenerator(function* (
          question,
          answer,
          skipValidation = false,
        ) {
          if (
            !skipValidation &&
            question.validate &&
            question.validate(answer) !== true
          ) {
            return
          }

          return question.format
            ? yield question.format(answer, answers)
            : answer
        })

        return function getFormattedAnswer(_x, _x2) {
          return _ref.apply(this, arguments)
        }
      })()

      var _iterator = _createForOfIteratorHelper(questions),
        _step

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done; ) {
          question = _step.value
          var _question = question
          name = _question.name
          type = _question.type

          // evaluate type first and skip if type is a falsy value
          if (typeof type === 'function') {
            type = yield type(answer, _objectSpread({}, answers), question)
            question['type'] = type
          }

          if (!type) continue // if property is a function, invoke it unless it's a special function

          for (let key in question) {
            if (passOn.includes(key)) continue
            let value = question[key]
            question[key] =
              typeof value === 'function'
                ? yield value(answer, _objectSpread({}, answers), lastPrompt)
                : value
          }

          lastPrompt = question

          if (typeof question.message !== 'string') {
            throw new Error('prompt message is required')
          } // update vars in case they changed

          var _question2 = question
          name = _question2.name
          type = _question2.type

          if (prompts[type] === void 0) {
            throw new Error(`prompt type (${type}) is not defined`)
          }

          if (override[question.name] !== undefined) {
            answer = yield getFormattedAnswer(question, override[question.name])

            if (answer !== undefined) {
              answers[name] = answer
              continue
            }
          }

          try {
            // Get the injected answer if there is one or prompt the user
            answer = prompt._injected
              ? getInjectedAnswer(prompt._injected, question.initial)
              : yield prompts[type](question)
            answers[name] = answer = yield getFormattedAnswer(
              question,
              answer,
              true,
            )
            quit = yield onSubmit(question, answer, answers)
          } catch (err) {
            quit = !(yield onCancel(question, answers))
          }

          if (quit) return answers
        }
      } catch (err) {
        _iterator.e(err)
      } finally {
        _iterator.f()
      }

      return answers
    })
    return _prompt.apply(this, arguments)
  }

  function getInjectedAnswer(injected, deafultValue) {
    const answer = injected.shift()

    if (answer instanceof Error) {
      throw answer
    }

    return answer === undefined ? deafultValue : answer
  }

  function inject(answers) {
    prompt._injected = (prompt._injected || []).concat(answers)
  }

  function override(answers) {
    prompt._override = Object.assign({}, answers)
  }

  dist = Object.assign(prompt, {
    prompt,
    prompts,
    inject,
    override,
  })
  return dist
}

var prompts$1 = {}

var action
var hasRequiredAction

function requireAction() {
  if (hasRequiredAction) return action
  hasRequiredAction = 1

  action = (key, isSelect) => {
    if (key.meta && key.name !== 'escape') return

    if (key.ctrl) {
      if (key.name === 'a') return 'first'
      if (key.name === 'c') return 'abort'
      if (key.name === 'd') return 'abort'
      if (key.name === 'e') return 'last'
      if (key.name === 'g') return 'reset'
    }

    if (isSelect) {
      if (key.name === 'j') return 'down'
      if (key.name === 'k') return 'up'
    }

    if (key.name === 'return') return 'submit'
    if (key.name === 'enter') return 'submit' // ctrl + J
    if (key.name === 'backspace') return 'delete'
    if (key.name === 'delete') return 'deleteForward'
    if (key.name === 'abort') return 'abort'
    if (key.name === 'escape') return 'exit'
    if (key.name === 'tab') return 'next'
    if (key.name === 'pagedown') return 'nextPage'
    if (key.name === 'pageup') return 'prevPage'
    // TODO create home() in prompt types (e.g. TextPrompt)
    if (key.name === 'home') return 'home'
    // TODO create end() in prompt types (e.g. TextPrompt)
    if (key.name === 'end') return 'end'

    if (key.name === 'up') return 'up'
    if (key.name === 'down') return 'down'
    if (key.name === 'right') return 'right'
    if (key.name === 'left') return 'left'

    return false
  }
  return action
}

var strip
var hasRequiredStrip

function requireStrip() {
  if (hasRequiredStrip) return strip
  hasRequiredStrip = 1

  strip = (str) => {
    const pattern = [
      '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
      '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
    ].join('|')

    const RGX = new RegExp(pattern, 'g')
    return typeof str === 'string' ? str.replace(RGX, '') : str
  }
  return strip
}

var clear
var hasRequiredClear

function requireClear() {
  if (hasRequiredClear) return clear
  hasRequiredClear = 1

  const strip = requireStrip()
  const { erase, cursor } = requireSrc()

  const width = (str) => [...strip(str)].length

  /**
   * @param {string} prompt
   * @param {number} perLine
   */
  clear = function (prompt, perLine) {
    if (!perLine) return erase.line + cursor.to(0)

    let rows = 0
    const lines = prompt.split(/\r?\n/)
    for (let line of lines) {
      rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / perLine)
    }

    return erase.lines(rows)
  }
  return clear
}

var figures_1
var hasRequiredFigures

function requireFigures() {
  if (hasRequiredFigures) return figures_1
  hasRequiredFigures = 1

  const main = {
    arrowUp: '↑',
    arrowDown: '↓',
    arrowLeft: '←',
    arrowRight: '→',
    radioOn: '◉',
    radioOff: '◯',
    tick: '✔',
    cross: '✖',
    ellipsis: '…',
    pointerSmall: '›',
    line: '─',
    pointer: '❯',
  }
  const win = {
    arrowUp: main.arrowUp,
    arrowDown: main.arrowDown,
    arrowLeft: main.arrowLeft,
    arrowRight: main.arrowRight,
    radioOn: '(*)',
    radioOff: '( )',
    tick: '√',
    cross: '×',
    ellipsis: '...',
    pointerSmall: '»',
    line: '─',
    pointer: '>',
  }
  const figures = process.platform === 'win32' ? win : main

  figures_1 = figures
  return figures_1
}

var style
var hasRequiredStyle

function requireStyle() {
  if (hasRequiredStyle) return style
  hasRequiredStyle = 1

  const c = requireKleur()
  const figures = requireFigures()

  // rendering user input.
  const styles = Object.freeze({
    password: { scale: 1, render: (input) => '*'.repeat(input.length) },
    emoji: { scale: 2, render: (input) => '😃'.repeat(input.length) },
    invisible: { scale: 0, render: (input) => '' },
    default: { scale: 1, render: (input) => `${input}` },
  })
  const render = (type) => styles[type] || styles.default

  // icon to signalize a prompt.
  const symbols = Object.freeze({
    aborted: c.red(figures.cross),
    done: c.green(figures.tick),
    exited: c.yellow(figures.cross),
    default: c.cyan('?'),
  })

  const symbol = (done, aborted, exited) =>
    aborted
      ? symbols.aborted
      : exited
      ? symbols.exited
      : done
      ? symbols.done
      : symbols.default

  // between the question and the user's input.
  const delimiter = (completing) =>
    c.gray(completing ? figures.ellipsis : figures.pointerSmall)

  const item = (expandable, expanded) =>
    c.gray(expandable ? (expanded ? figures.pointerSmall : '+') : figures.line)

  style = {
    styles,
    render,
    symbols,
    symbol,
    delimiter,
    item,
  }
  return style
}

var lines
var hasRequiredLines

function requireLines() {
  if (hasRequiredLines) return lines
  hasRequiredLines = 1

  const strip = requireStrip()

  /**
   * @param {string} msg
   * @param {number} perLine
   */
  lines = function (msg, perLine) {
    let lines = String(strip(msg) || '').split(/\r?\n/)

    if (!perLine) return lines.length
    return lines
      .map((l) => Math.ceil(l.length / perLine))
      .reduce((a, b) => a + b)
  }
  return lines
}

var wrap
var hasRequiredWrap

function requireWrap() {
  if (hasRequiredWrap) return wrap
  hasRequiredWrap = 1

  /**
   * @param {string} msg The message to wrap
   * @param {object} opts
   * @param {number|string} [opts.margin] Left margin
   * @param {number} opts.width Maximum characters per line including the margin
   */
  wrap = (msg, opts = {}) => {
    const tab = Number.isSafeInteger(parseInt(opts.margin))
      ? new Array(parseInt(opts.margin)).fill(' ').join('')
      : opts.margin || ''

    const width = opts.width

    return (msg || '')
      .split(/\r?\n/g)
      .map((line) =>
        line
          .split(/\s+/g)
          .reduce(
            (arr, w) => {
              if (
                w.length + tab.length >= width ||
                arr[arr.length - 1].length + w.length + 1 < width
              )
                arr[arr.length - 1] += ` ${w}`
              else arr.push(`${tab}${w}`)
              return arr
            },
            [tab],
          )
          .join('\n'),
      )
      .join('\n')
  }
  return wrap
}

var entriesToDisplay
var hasRequiredEntriesToDisplay

function requireEntriesToDisplay() {
  if (hasRequiredEntriesToDisplay) return entriesToDisplay
  hasRequiredEntriesToDisplay = 1

  /**
   * Determine what entries should be displayed on the screen, based on the
   * currently selected index and the maximum visible. Used in list-based
   * prompts like `select` and `multiselect`.
   *
   * @param {number} cursor the currently selected entry
   * @param {number} total the total entries available to display
   * @param {number} [maxVisible] the number of entries that can be displayed
   */
  entriesToDisplay = (cursor, total, maxVisible) => {
    maxVisible = maxVisible || total

    let startIndex = Math.min(
      total - maxVisible,
      cursor - Math.floor(maxVisible / 2),
    )
    if (startIndex < 0) startIndex = 0

    let endIndex = Math.min(startIndex + maxVisible, total)

    return { startIndex, endIndex }
  }
  return entriesToDisplay
}

var util
var hasRequiredUtil

function requireUtil() {
  if (hasRequiredUtil) return util
  hasRequiredUtil = 1

  util = {
    action: requireAction(),
    clear: requireClear(),
    style: requireStyle(),
    strip: requireStrip(),
    figures: requireFigures(),
    lines: requireLines(),
    wrap: requireWrap(),
    entriesToDisplay: requireEntriesToDisplay(),
  }
  return util
}

var prompt
var hasRequiredPrompt

function requirePrompt() {
  if (hasRequiredPrompt) return prompt
  hasRequiredPrompt = 1

  const readline = require$$0
  const { action } = requireUtil()
  const EventEmitter = require$$2
  const { beep, cursor } = requireSrc()
  const color = requireKleur()

  /**
   * Base prompt skeleton
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */
  class Prompt extends EventEmitter {
    constructor(opts = {}) {
      super()

      this.firstRender = true
      this.in = opts.stdin || process.stdin
      this.out = opts.stdout || process.stdout
      this.onRender = (opts.onRender || (() => void 0)).bind(this)
      const rl = readline.createInterface({
        input: this.in,
        escapeCodeTimeout: 50,
      })
      readline.emitKeypressEvents(this.in, rl)

      if (this.in.isTTY) this.in.setRawMode(true)
      const isSelect =
        ['SelectPrompt', 'MultiselectPrompt'].indexOf(this.constructor.name) >
        -1
      const keypress = (str, key) => {
        let a = action(key, isSelect)
        if (a === false) {
          this._ && this._(str, key)
        } else if (typeof this[a] === 'function') {
          this[a](key)
        } else {
          this.bell()
        }
      }

      this.close = () => {
        this.out.write(cursor.show)
        this.in.removeListener('keypress', keypress)
        if (this.in.isTTY) this.in.setRawMode(false)
        rl.close()
        this.emit(
          this.aborted ? 'abort' : this.exited ? 'exit' : 'submit',
          this.value,
        )
        this.closed = true
      }

      this.in.on('keypress', keypress)
    }

    fire() {
      this.emit('state', {
        value: this.value,
        aborted: !!this.aborted,
        exited: !!this.exited,
      })
    }

    bell() {
      this.out.write(beep)
    }

    render() {
      this.onRender(color)
      if (this.firstRender) this.firstRender = false
    }
  }

  prompt = Prompt
  return prompt
}

var text
var hasRequiredText

function requireText() {
  if (hasRequiredText) return text
  hasRequiredText = 1
  const color = requireKleur()
  const Prompt = requirePrompt()
  const { erase, cursor } = requireSrc()
  const { style, clear, lines, figures } = requireUtil()

  /**
   * TextPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {String} [opts.style='default'] Render style
   * @param {String} [opts.initial] Default value
   * @param {Function} [opts.validate] Validate function
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.error] The invalid error label
   */
  class TextPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.transform = style.render(opts.style)
      this.scale = this.transform.scale
      this.msg = opts.message
      this.initial = opts.initial || ``
      this.validator = opts.validate || (() => true)
      this.value = ``
      this.errorMsg = opts.error || `Please Enter A Valid Value`
      this.cursor = Number(!!this.initial)
      this.cursorOffset = 0
      this.clear = clear(``, this.out.columns)
      this.render()
    }

    set value(v) {
      if (!v && this.initial) {
        this.placeholder = true
        this.rendered = color.gray(this.transform.render(this.initial))
      } else {
        this.placeholder = false
        this.rendered = this.transform.render(v)
      }
      this._value = v
      this.fire()
    }

    get value() {
      return this._value
    }

    reset() {
      this.value = ``
      this.cursor = Number(!!this.initial)
      this.cursorOffset = 0
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.value = this.value || this.initial
      this.done = this.aborted = true
      this.error = false
      this.red = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    async validate() {
      let valid = await this.validator(this.value)
      if (typeof valid === `string`) {
        this.errorMsg = valid
        valid = false
      }
      this.error = !valid
    }

    async submit() {
      this.value = this.value || this.initial
      this.cursorOffset = 0
      this.cursor = this.rendered.length
      await this.validate()
      if (this.error) {
        this.red = true
        this.fire()
        this.render()
        return
      }
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    next() {
      if (!this.placeholder) return this.bell()
      this.value = this.initial
      this.cursor = this.rendered.length
      this.fire()
      this.render()
    }

    moveCursor(n) {
      if (this.placeholder) return
      this.cursor = this.cursor + n
      this.cursorOffset += n
    }

    _(c, key) {
      let s1 = this.value.slice(0, this.cursor)
      let s2 = this.value.slice(this.cursor)
      this.value = `${s1}${c}${s2}`
      this.red = false
      this.cursor = this.placeholder ? 0 : s1.length + 1
      this.render()
    }

    delete() {
      if (this.isCursorAtStart()) return this.bell()
      let s1 = this.value.slice(0, this.cursor - 1)
      let s2 = this.value.slice(this.cursor)
      this.value = `${s1}${s2}`
      this.red = false
      if (this.isCursorAtStart()) {
        this.cursorOffset = 0
      } else {
        this.cursorOffset++
        this.moveCursor(-1)
      }
      this.render()
    }

    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
        return this.bell()
      let s1 = this.value.slice(0, this.cursor)
      let s2 = this.value.slice(this.cursor + 1)
      this.value = `${s1}${s2}`
      this.red = false
      if (this.isCursorAtEnd()) {
        this.cursorOffset = 0
      } else {
        this.cursorOffset++
      }
      this.render()
    }

    first() {
      this.cursor = 0
      this.render()
    }

    last() {
      this.cursor = this.value.length
      this.render()
    }

    left() {
      if (this.cursor <= 0 || this.placeholder) return this.bell()
      this.moveCursor(-1)
      this.render()
    }

    right() {
      if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
        return this.bell()
      this.moveCursor(1)
      this.render()
    }

    isCursorAtStart() {
      return this.cursor === 0 || (this.placeholder && this.cursor === 1)
    }

    isCursorAtEnd() {
      return (
        this.cursor === this.rendered.length ||
        (this.placeholder && this.cursor === this.rendered.length + 1)
      )
    }

    render() {
      if (this.closed) return
      if (!this.firstRender) {
        if (this.outputError)
          this.out.write(
            cursor.down(lines(this.outputError, this.out.columns) - 1) +
              clear(this.outputError, this.out.columns),
          )
        this.out.write(clear(this.outputText, this.out.columns))
      }
      super.render()
      this.outputError = ''

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.red ? color.red(this.rendered) : this.rendered,
      ].join(` `)

      if (this.error) {
        this.outputError += this.errorMsg
          .split(`\n`)
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ' ' : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(
        erase.line +
          cursor.to(0) +
          this.outputText +
          cursor.save +
          this.outputError +
          cursor.restore +
          cursor.move(this.cursorOffset, 0),
      )
    }
  }

  text = TextPrompt
  return text
}

var select
var hasRequiredSelect

function requireSelect() {
  if (hasRequiredSelect) return select
  hasRequiredSelect = 1

  const color = requireKleur()
  const Prompt = requirePrompt()
  const { style, clear, figures, wrap, entriesToDisplay } = requireUtil()
  const { cursor } = requireSrc()

  /**
   * SelectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {Number} [opts.initial] Index of default value
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {Number} [opts.optionsPerPage=10] Max options to display at once
   */
  class SelectPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.hint = opts.hint || '- Use arrow-keys. Return to submit.'
      this.warn = opts.warn || '- This option is disabled'
      this.cursor = opts.initial || 0
      this.choices = opts.choices.map((ch, idx) => {
        if (typeof ch === 'string') ch = { title: ch, value: idx }
        return {
          title: ch && (ch.title || ch.value || ch),
          value: ch && (ch.value === undefined ? idx : ch.value),
          description: ch && ch.description,
          selected: ch && ch.selected,
          disabled: ch && ch.disabled,
        }
      })
      this.optionsPerPage = opts.optionsPerPage || 10
      this.value = (this.choices[this.cursor] || {}).value
      this.clear = clear('', this.out.columns)
      this.render()
    }

    moveCursor(n) {
      this.cursor = n
      this.value = this.choices[n].value
      this.fire()
    }

    reset() {
      this.moveCursor(0)
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      if (!this.selection.disabled) {
        this.done = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      } else this.bell()
    }

    first() {
      this.moveCursor(0)
      this.render()
    }

    last() {
      this.moveCursor(this.choices.length - 1)
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.moveCursor(this.choices.length - 1)
      } else {
        this.moveCursor(this.cursor - 1)
      }
      this.render()
    }

    down() {
      if (this.cursor === this.choices.length - 1) {
        this.moveCursor(0)
      } else {
        this.moveCursor(this.cursor + 1)
      }
      this.render()
    }

    next() {
      this.moveCursor((this.cursor + 1) % this.choices.length)
      this.render()
    }

    _(c, key) {
      if (c === ' ') return this.submit()
    }

    get selection() {
      return this.choices[this.cursor]
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      let { startIndex, endIndex } = entriesToDisplay(
        this.cursor,
        this.choices.length,
        this.optionsPerPage,
      )

      // Print prompt
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.done
          ? this.selection.title
          : this.selection.disabled
          ? color.yellow(this.warn)
          : color.gray(this.hint),
      ].join(' ')

      // Print choices
      if (!this.done) {
        this.outputText += '\n'
        for (let i = startIndex; i < endIndex; i++) {
          let title,
            prefix,
            desc = '',
            v = this.choices[i]

          // Determine whether to display "more choices" indicators
          if (i === startIndex && startIndex > 0) {
            prefix = figures.arrowUp
          } else if (i === endIndex - 1 && endIndex < this.choices.length) {
            prefix = figures.arrowDown
          } else {
            prefix = ' '
          }

          if (v.disabled) {
            title =
              this.cursor === i
                ? color.gray().underline(v.title)
                : color.strikethrough().gray(v.title)
            prefix =
              (this.cursor === i
                ? color.bold().gray(figures.pointer) + ' '
                : '  ') + prefix
          } else {
            title =
              this.cursor === i ? color.cyan().underline(v.title) : v.title
            prefix =
              (this.cursor === i ? color.cyan(figures.pointer) + ' ' : '  ') +
              prefix
            if (v.description && this.cursor === i) {
              desc = ` - ${v.description}`
              if (
                prefix.length + title.length + desc.length >=
                  this.out.columns ||
                v.description.split(/\r?\n/).length > 1
              ) {
                desc =
                  '\n' +
                  wrap(v.description, { margin: 3, width: this.out.columns })
              }
            }
          }

          this.outputText += `${prefix} ${title}${color.gray(desc)}\n`
        }
      }

      this.out.write(this.outputText)
    }
  }

  select = SelectPrompt
  return select
}

var toggle
var hasRequiredToggle

function requireToggle() {
  if (hasRequiredToggle) return toggle
  hasRequiredToggle = 1
  const color = requireKleur()
  const Prompt = requirePrompt()
  const { style, clear } = requireUtil()
  const { cursor, erase } = requireSrc()

  /**
   * TogglePrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Boolean} [opts.initial=false] Default value
   * @param {String} [opts.active='no'] Active label
   * @param {String} [opts.inactive='off'] Inactive label
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */
  class TogglePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.value = !!opts.initial
      this.active = opts.active || 'on'
      this.inactive = opts.inactive || 'off'
      this.initialValue = this.value
      this.render()
    }

    reset() {
      this.value = this.initialValue
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    deactivate() {
      if (this.value === false) return this.bell()
      this.value = false
      this.render()
    }

    activate() {
      if (this.value === true) return this.bell()
      this.value = true
      this.render()
    }

    delete() {
      this.deactivate()
    }
    left() {
      this.deactivate()
    }
    right() {
      this.activate()
    }
    down() {
      this.deactivate()
    }
    up() {
      this.activate()
    }

    next() {
      this.value = !this.value
      this.fire()
      this.render()
    }

    _(c, key) {
      if (c === ' ') {
        this.value = !this.value
      } else if (c === '1') {
        this.value = true
      } else if (c === '0') {
        this.value = false
      } else return this.bell()
      this.render()
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.value ? this.inactive : color.cyan().underline(this.inactive),
        color.gray('/'),
        this.value ? color.cyan().underline(this.active) : this.active,
      ].join(' ')

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  toggle = TogglePrompt
  return toggle
}

var datepart
var hasRequiredDatepart

function requireDatepart() {
  if (hasRequiredDatepart) return datepart
  hasRequiredDatepart = 1

  class DatePart {
    constructor({ token, date, parts, locales }) {
      this.token = token
      this.date = date || new Date()
      this.parts = parts || [this]
      this.locales = locales || {}
    }

    up() {}

    down() {}

    next() {
      const currentIdx = this.parts.indexOf(this)
      return this.parts.find(
        (part, idx) => idx > currentIdx && part instanceof DatePart,
      )
    }

    setTo(val) {}

    prev() {
      let parts = [].concat(this.parts).reverse()
      const currentIdx = parts.indexOf(this)
      return parts.find(
        (part, idx) => idx > currentIdx && part instanceof DatePart,
      )
    }

    toString() {
      return String(this.date)
    }
  }

  datepart = DatePart
  return datepart
}

var meridiem
var hasRequiredMeridiem

function requireMeridiem() {
  if (hasRequiredMeridiem) return meridiem
  hasRequiredMeridiem = 1

  const DatePart = requireDatepart()

  class Meridiem extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setHours((this.date.getHours() + 12) % 24)
    }

    down() {
      this.up()
    }

    toString() {
      let meridiem = this.date.getHours() > 12 ? 'pm' : 'am'
      return /\A/.test(this.token) ? meridiem.toUpperCase() : meridiem
    }
  }

  meridiem = Meridiem
  return meridiem
}

var day
var hasRequiredDay

function requireDay() {
  if (hasRequiredDay) return day
  hasRequiredDay = 1

  const DatePart = requireDatepart()

  const pos = (n) => {
    n = n % 10
    return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  }

  class Day extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setDate(this.date.getDate() + 1)
    }

    down() {
      this.date.setDate(this.date.getDate() - 1)
    }

    setTo(val) {
      this.date.setDate(parseInt(val.substr(-2)))
    }

    toString() {
      let date = this.date.getDate()
      let day = this.date.getDay()
      return this.token === 'DD'
        ? String(date).padStart(2, '0')
        : this.token === 'Do'
        ? date + pos(date)
        : this.token === 'd'
        ? day + 1
        : this.token === 'ddd'
        ? this.locales.weekdaysShort[day]
        : this.token === 'dddd'
        ? this.locales.weekdays[day]
        : date
    }
  }

  day = Day
  return day
}

var hours
var hasRequiredHours

function requireHours() {
  if (hasRequiredHours) return hours
  hasRequiredHours = 1

  const DatePart = requireDatepart()

  class Hours extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setHours(this.date.getHours() + 1)
    }

    down() {
      this.date.setHours(this.date.getHours() - 1)
    }

    setTo(val) {
      this.date.setHours(parseInt(val.substr(-2)))
    }

    toString() {
      let hours = this.date.getHours()
      if (/h/.test(this.token)) hours = hours % 12 || 12
      return this.token.length > 1 ? String(hours).padStart(2, '0') : hours
    }
  }

  hours = Hours
  return hours
}

var milliseconds
var hasRequiredMilliseconds

function requireMilliseconds() {
  if (hasRequiredMilliseconds) return milliseconds
  hasRequiredMilliseconds = 1

  const DatePart = requireDatepart()

  class Milliseconds extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMilliseconds(this.date.getMilliseconds() + 1)
    }

    down() {
      this.date.setMilliseconds(this.date.getMilliseconds() - 1)
    }

    setTo(val) {
      this.date.setMilliseconds(parseInt(val.substr(-this.token.length)))
    }

    toString() {
      return String(this.date.getMilliseconds())
        .padStart(4, '0')
        .substr(0, this.token.length)
    }
  }

  milliseconds = Milliseconds
  return milliseconds
}

var minutes
var hasRequiredMinutes

function requireMinutes() {
  if (hasRequiredMinutes) return minutes
  hasRequiredMinutes = 1

  const DatePart = requireDatepart()

  class Minutes extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMinutes(this.date.getMinutes() + 1)
    }

    down() {
      this.date.setMinutes(this.date.getMinutes() - 1)
    }

    setTo(val) {
      this.date.setMinutes(parseInt(val.substr(-2)))
    }

    toString() {
      let m = this.date.getMinutes()
      return this.token.length > 1 ? String(m).padStart(2, '0') : m
    }
  }

  minutes = Minutes
  return minutes
}

var month
var hasRequiredMonth

function requireMonth() {
  if (hasRequiredMonth) return month
  hasRequiredMonth = 1

  const DatePart = requireDatepart()

  class Month extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setMonth(this.date.getMonth() + 1)
    }

    down() {
      this.date.setMonth(this.date.getMonth() - 1)
    }

    setTo(val) {
      val = parseInt(val.substr(-2)) - 1
      this.date.setMonth(val < 0 ? 0 : val)
    }

    toString() {
      let month = this.date.getMonth()
      let tl = this.token.length
      return tl === 2
        ? String(month + 1).padStart(2, '0')
        : tl === 3
        ? this.locales.monthsShort[month]
        : tl === 4
        ? this.locales.months[month]
        : String(month + 1)
    }
  }

  month = Month
  return month
}

var seconds
var hasRequiredSeconds

function requireSeconds() {
  if (hasRequiredSeconds) return seconds
  hasRequiredSeconds = 1

  const DatePart = requireDatepart()

  class Seconds extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setSeconds(this.date.getSeconds() + 1)
    }

    down() {
      this.date.setSeconds(this.date.getSeconds() - 1)
    }

    setTo(val) {
      this.date.setSeconds(parseInt(val.substr(-2)))
    }

    toString() {
      let s = this.date.getSeconds()
      return this.token.length > 1 ? String(s).padStart(2, '0') : s
    }
  }

  seconds = Seconds
  return seconds
}

var year
var hasRequiredYear

function requireYear() {
  if (hasRequiredYear) return year
  hasRequiredYear = 1

  const DatePart = requireDatepart()

  class Year extends DatePart {
    constructor(opts = {}) {
      super(opts)
    }

    up() {
      this.date.setFullYear(this.date.getFullYear() + 1)
    }

    down() {
      this.date.setFullYear(this.date.getFullYear() - 1)
    }

    setTo(val) {
      this.date.setFullYear(val.substr(-4))
    }

    toString() {
      let year = String(this.date.getFullYear()).padStart(4, '0')
      return this.token.length === 2 ? year.substr(-2) : year
    }
  }

  year = Year
  return year
}

var dateparts
var hasRequiredDateparts

function requireDateparts() {
  if (hasRequiredDateparts) return dateparts
  hasRequiredDateparts = 1

  dateparts = {
    DatePart: requireDatepart(),
    Meridiem: requireMeridiem(),
    Day: requireDay(),
    Hours: requireHours(),
    Milliseconds: requireMilliseconds(),
    Minutes: requireMinutes(),
    Month: requireMonth(),
    Seconds: requireSeconds(),
    Year: requireYear(),
  }
  return dateparts
}

var date
var hasRequiredDate

function requireDate() {
  if (hasRequiredDate) return date
  hasRequiredDate = 1

  const color = requireKleur()
  const Prompt = requirePrompt()
  const { style, clear, figures } = requireUtil()
  const { erase, cursor } = requireSrc()
  const {
    DatePart,
    Meridiem,
    Day,
    Hours,
    Milliseconds,
    Minutes,
    Month,
    Seconds,
    Year,
  } = requireDateparts()

  const regex =
    /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g
  const regexGroups = {
    1: ({ token }) => token.replace(/\\(.)/g, '$1'),
    2: (opts) => new Day(opts), // Day // TODO
    3: (opts) => new Month(opts), // Month
    4: (opts) => new Year(opts), // Year
    5: (opts) => new Meridiem(opts), // AM/PM // TODO (special)
    6: (opts) => new Hours(opts), // Hours
    7: (opts) => new Minutes(opts), // Minutes
    8: (opts) => new Seconds(opts), // Seconds
    9: (opts) => new Milliseconds(opts), // Fractional seconds
  }

  const dfltLocales = {
    months:
      'January,February,March,April,May,June,July,August,September,October,November,December'.split(
        ',',
      ),
    monthsShort: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(
      ',',
    ),
    weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(','),
  }

  /**
   * DatePrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Number} [opts.initial] Index of default value
   * @param {String} [opts.mask] The format mask
   * @param {object} [opts.locales] The date locales
   * @param {String} [opts.error] The error message shown on invalid value
   * @param {Function} [opts.validate] Function to validate the submitted value
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */
  class DatePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.cursor = 0
      this.typed = ''
      this.locales = Object.assign(dfltLocales, opts.locales)
      this._date = opts.initial || new Date()
      this.errorMsg = opts.error || 'Please Enter A Valid Value'
      this.validator = opts.validate || (() => true)
      this.mask = opts.mask || 'YYYY-MM-DD HH:mm:ss'
      this.clear = clear('', this.out.columns)
      this.render()
    }

    get value() {
      return this.date
    }

    get date() {
      return this._date
    }

    set date(date) {
      if (date) this._date.setTime(date.getTime())
    }

    set mask(mask) {
      let result
      this.parts = []
      while ((result = regex.exec(mask))) {
        let match = result.shift()
        let idx = result.findIndex((gr) => gr != null)
        this.parts.push(
          idx in regexGroups
            ? regexGroups[idx]({
                token: result[idx] || match,
                date: this.date,
                parts: this.parts,
                locales: this.locales,
              })
            : result[idx] || match,
        )
      }

      let parts = this.parts.reduce((arr, i) => {
        if (typeof i === 'string' && typeof arr[arr.length - 1] === 'string')
          arr[arr.length - 1] += i
        else arr.push(i)
        return arr
      }, [])

      this.parts.splice(0)
      this.parts.push(...parts)
      this.reset()
    }

    moveCursor(n) {
      this.typed = ''
      this.cursor = n
      this.fire()
    }

    reset() {
      this.moveCursor(this.parts.findIndex((p) => p instanceof DatePart))
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.error = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    async validate() {
      let valid = await this.validator(this.value)
      if (typeof valid === 'string') {
        this.errorMsg = valid
        valid = false
      }
      this.error = !valid
    }

    async submit() {
      await this.validate()
      if (this.error) {
        this.color = 'red'
        this.fire()
        this.render()
        return
      }
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    up() {
      this.typed = ''
      this.parts[this.cursor].up()
      this.render()
    }

    down() {
      this.typed = ''
      this.parts[this.cursor].down()
      this.render()
    }

    left() {
      let prev = this.parts[this.cursor].prev()
      if (prev == null) return this.bell()
      this.moveCursor(this.parts.indexOf(prev))
      this.render()
    }

    right() {
      let next = this.parts[this.cursor].next()
      if (next == null) return this.bell()
      this.moveCursor(this.parts.indexOf(next))
      this.render()
    }

    next() {
      let next = this.parts[this.cursor].next()
      this.moveCursor(
        next
          ? this.parts.indexOf(next)
          : this.parts.findIndex((part) => part instanceof DatePart),
      )
      this.render()
    }

    _(c) {
      if (/\d/.test(c)) {
        this.typed += c
        this.parts[this.cursor].setTo(this.typed)
        this.render()
      }
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      // Print prompt
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.parts
          .reduce(
            (arr, p, idx) =>
              arr.concat(
                idx === this.cursor && !this.done
                  ? color.cyan().underline(p.toString())
                  : p,
              ),
            [],
          )
          .join(''),
      ].join(' ')

      // Print error
      if (this.error) {
        this.outputText += this.errorMsg
          .split('\n')
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  date = DatePrompt
  return date
}

var number
var hasRequiredNumber

function requireNumber() {
  if (hasRequiredNumber) return number
  hasRequiredNumber = 1
  const color = requireKleur()
  const Prompt = requirePrompt()
  const { cursor, erase } = requireSrc()
  const { style, figures, clear, lines } = requireUtil()

  const isNumber = /[0-9]/
  const isDef = (any) => any !== undefined
  const round = (number, precision) => {
    let factor = Math.pow(10, precision)
    return Math.round(number * factor) / factor
  }

  /**
   * NumberPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {String} [opts.style='default'] Render style
   * @param {Number} [opts.initial] Default value
   * @param {Number} [opts.max=+Infinity] Max value
   * @param {Number} [opts.min=-Infinity] Min value
   * @param {Boolean} [opts.float=false] Parse input as floats
   * @param {Number} [opts.round=2] Round floats to x decimals
   * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
   * @param {Function} [opts.validate] Validate function
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.error] The invalid error label
   */
  class NumberPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.transform = style.render(opts.style)
      this.msg = opts.message
      this.initial = isDef(opts.initial) ? opts.initial : ''
      this.float = !!opts.float
      this.round = opts.round || 2
      this.inc = opts.increment || 1
      this.min = isDef(opts.min) ? opts.min : -Infinity
      this.max = isDef(opts.max) ? opts.max : Infinity
      this.errorMsg = opts.error || `Please Enter A Valid Value`
      this.validator = opts.validate || (() => true)
      this.color = `cyan`
      this.value = ``
      this.typed = ``
      this.lastHit = 0
      this.render()
    }

    set value(v) {
      if (!v && v !== 0) {
        this.placeholder = true
        this.rendered = color.gray(this.transform.render(`${this.initial}`))
        this._value = ``
      } else {
        this.placeholder = false
        this.rendered = this.transform.render(`${round(v, this.round)}`)
        this._value = round(v, this.round)
      }
      this.fire()
    }

    get value() {
      return this._value
    }

    parse(x) {
      return this.float ? parseFloat(x) : parseInt(x)
    }

    valid(c) {
      return c === `-` || (c === `.` && this.float) || isNumber.test(c)
    }

    reset() {
      this.typed = ``
      this.value = ``
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      let x = this.value
      this.value = x !== `` ? x : this.initial
      this.done = this.aborted = true
      this.error = false
      this.fire()
      this.render()
      this.out.write(`\n`)
      this.close()
    }

    async validate() {
      let valid = await this.validator(this.value)
      if (typeof valid === `string`) {
        this.errorMsg = valid
        valid = false
      }
      this.error = !valid
    }

    async submit() {
      await this.validate()
      if (this.error) {
        this.color = `red`
        this.fire()
        this.render()
        return
      }
      let x = this.value
      this.value = x !== `` ? x : this.initial
      this.done = true
      this.aborted = false
      this.error = false
      this.fire()
      this.render()
      this.out.write(`\n`)
      this.close()
    }

    up() {
      this.typed = ``
      if (this.value === '') {
        this.value = this.min - this.inc
      }
      if (this.value >= this.max) return this.bell()
      this.value += this.inc
      this.color = `cyan`
      this.fire()
      this.render()
    }

    down() {
      this.typed = ``
      if (this.value === '') {
        this.value = this.min + this.inc
      }
      if (this.value <= this.min) return this.bell()
      this.value -= this.inc
      this.color = `cyan`
      this.fire()
      this.render()
    }

    delete() {
      let val = this.value.toString()
      if (val.length === 0) return this.bell()
      this.value = this.parse((val = val.slice(0, -1))) || ``
      if (this.value !== '' && this.value < this.min) {
        this.value = this.min
      }
      this.color = `cyan`
      this.fire()
      this.render()
    }

    next() {
      this.value = this.initial
      this.fire()
      this.render()
    }

    _(c, key) {
      if (!this.valid(c)) return this.bell()

      const now = Date.now()
      if (now - this.lastHit > 1000) this.typed = `` // 1s elapsed
      this.typed += c
      this.lastHit = now
      this.color = `cyan`

      if (c === `.`) return this.fire()

      this.value = Math.min(this.parse(this.typed), this.max)
      if (this.value > this.max) this.value = this.max
      if (this.value < this.min) this.value = this.min
      this.fire()
      this.render()
    }

    render() {
      if (this.closed) return
      if (!this.firstRender) {
        if (this.outputError)
          this.out.write(
            cursor.down(lines(this.outputError, this.out.columns) - 1) +
              clear(this.outputError, this.out.columns),
          )
        this.out.write(clear(this.outputText, this.out.columns))
      }
      super.render()
      this.outputError = ''

      // Print prompt
      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        !this.done || (!this.done && !this.placeholder)
          ? color[this.color]().underline(this.rendered)
          : this.rendered,
      ].join(` `)

      // Print error
      if (this.error) {
        this.outputError += this.errorMsg
          .split(`\n`)
          .reduce(
            (a, l, i) =>
              a +
              `\n${i ? ` ` : figures.pointerSmall} ${color.red().italic(l)}`,
            ``,
          )
      }

      this.out.write(
        erase.line +
          cursor.to(0) +
          this.outputText +
          cursor.save +
          this.outputError +
          cursor.restore,
      )
    }
  }

  number = NumberPrompt
  return number
}

var multiselect
var hasRequiredMultiselect

function requireMultiselect() {
  if (hasRequiredMultiselect) return multiselect
  hasRequiredMultiselect = 1

  const color = requireKleur()
  const { cursor } = requireSrc()
  const Prompt = requirePrompt()
  const { clear, figures, style, wrap, entriesToDisplay } = requireUtil()

  /**
   * MultiselectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {String} [opts.warn] Hint shown for disabled choices
   * @param {Number} [opts.max] Max choices
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {Number} [opts.optionsPerPage=10] Max options to display at once
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */
  class MultiselectPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.cursor = opts.cursor || 0
      this.scrollIndex = opts.cursor || 0
      this.hint = opts.hint || ''
      this.warn = opts.warn || '- This option is disabled -'
      this.minSelected = opts.min
      this.showMinError = false
      this.maxChoices = opts.max
      this.instructions = opts.instructions
      this.optionsPerPage = opts.optionsPerPage || 10
      this.value = opts.choices.map((ch, idx) => {
        if (typeof ch === 'string') ch = { title: ch, value: idx }
        return {
          title: ch && (ch.title || ch.value || ch),
          description: ch && ch.description,
          value: ch && (ch.value === undefined ? idx : ch.value),
          selected: ch && ch.selected,
          disabled: ch && ch.disabled,
        }
      })
      this.clear = clear('', this.out.columns)
      if (!opts.overrideRender) {
        this.render()
      }
    }

    reset() {
      this.value.map((v) => !v.selected)
      this.cursor = 0
      this.fire()
      this.render()
    }

    selected() {
      return this.value.filter((v) => v.selected)
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      const selected = this.value.filter((e) => e.selected)
      if (this.minSelected && selected.length < this.minSelected) {
        this.showMinError = true
        this.render()
      } else {
        this.done = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      }
    }

    first() {
      this.cursor = 0
      this.render()
    }

    last() {
      this.cursor = this.value.length - 1
      this.render()
    }
    next() {
      this.cursor = (this.cursor + 1) % this.value.length
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.cursor = this.value.length - 1
      } else {
        this.cursor--
      }
      this.render()
    }

    down() {
      if (this.cursor === this.value.length - 1) {
        this.cursor = 0
      } else {
        this.cursor++
      }
      this.render()
    }

    left() {
      this.value[this.cursor].selected = false
      this.render()
    }

    right() {
      if (this.value.filter((e) => e.selected).length >= this.maxChoices)
        return this.bell()
      this.value[this.cursor].selected = true
      this.render()
    }

    handleSpaceToggle() {
      const v = this.value[this.cursor]

      if (v.selected) {
        v.selected = false
        this.render()
      } else if (
        v.disabled ||
        this.value.filter((e) => e.selected).length >= this.maxChoices
      ) {
        return this.bell()
      } else {
        v.selected = true
        this.render()
      }
    }

    toggleAll() {
      if (this.maxChoices !== undefined || this.value[this.cursor].disabled) {
        return this.bell()
      }

      const newSelected = !this.value[this.cursor].selected
      this.value
        .filter((v) => !v.disabled)
        .forEach((v) => (v.selected = newSelected))
      this.render()
    }

    _(c, key) {
      if (c === ' ') {
        this.handleSpaceToggle()
      } else if (c === 'a') {
        this.toggleAll()
      } else {
        return this.bell()
      }
    }

    renderInstructions() {
      if (this.instructions === undefined || this.instructions) {
        if (typeof this.instructions === 'string') {
          return this.instructions
        }
        return (
          '\nInstructions:\n' +
          `    ${figures.arrowUp}/${figures.arrowDown}: Highlight option\n` +
          `    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection\n` +
          (this.maxChoices === undefined ? `    a: Toggle all\n` : '') +
          `    enter/return: Complete answer`
        )
      }
      return ''
    }

    renderOption(cursor, v, i, arrowIndicator) {
      const prefix =
        (v.selected ? color.green(figures.radioOn) : figures.radioOff) +
        ' ' +
        arrowIndicator +
        ' '
      let title, desc

      if (v.disabled) {
        title =
          cursor === i
            ? color.gray().underline(v.title)
            : color.strikethrough().gray(v.title)
      } else {
        title = cursor === i ? color.cyan().underline(v.title) : v.title
        if (cursor === i && v.description) {
          desc = ` - ${v.description}`
          if (
            prefix.length + title.length + desc.length >= this.out.columns ||
            v.description.split(/\r?\n/).length > 1
          ) {
            desc =
              '\n' +
              wrap(v.description, {
                margin: prefix.length,
                width: this.out.columns,
              })
          }
        }
      }

      return prefix + title + color.gray(desc || '')
    }

    // shared with autocompleteMultiselect
    paginateOptions(options) {
      if (options.length === 0) {
        return color.red('No matches for this query.')
      }

      let { startIndex, endIndex } = entriesToDisplay(
        this.cursor,
        options.length,
        this.optionsPerPage,
      )
      let prefix,
        styledOptions = []

      for (let i = startIndex; i < endIndex; i++) {
        if (i === startIndex && startIndex > 0) {
          prefix = figures.arrowUp
        } else if (i === endIndex - 1 && endIndex < options.length) {
          prefix = figures.arrowDown
        } else {
          prefix = ' '
        }
        styledOptions.push(
          this.renderOption(this.cursor, options[i], i, prefix),
        )
      }

      return '\n' + styledOptions.join('\n')
    }

    // shared with autocomleteMultiselect
    renderOptions(options) {
      if (!this.done) {
        return this.paginateOptions(options)
      }
      return ''
    }

    renderDoneOrInstructions() {
      if (this.done) {
        return this.value
          .filter((e) => e.selected)
          .map((v) => v.title)
          .join(', ')
      }

      const output = [color.gray(this.hint), this.renderInstructions()]

      if (this.value[this.cursor].disabled) {
        output.push(color.yellow(this.warn))
      }
      return output.join(' ')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      super.render()

      // print prompt
      let prompt = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.renderDoneOrInstructions(),
      ].join(' ')
      if (this.showMinError) {
        prompt += color.red(
          `You must select a minimum of ${this.minSelected} choices.`,
        )
        this.showMinError = false
      }
      prompt += this.renderOptions(this.value)

      this.out.write(this.clear + prompt)
      this.clear = clear(prompt, this.out.columns)
    }
  }

  multiselect = MultiselectPrompt
  return multiselect
}

var autocomplete
var hasRequiredAutocomplete

function requireAutocomplete() {
  if (hasRequiredAutocomplete) return autocomplete
  hasRequiredAutocomplete = 1

  const color = requireKleur()
  const Prompt = requirePrompt()
  const { erase, cursor } = requireSrc()
  const { style, clear, figures, wrap, entriesToDisplay } = requireUtil()

  const getVal = (arr, i) => arr[i] && (arr[i].value || arr[i].title || arr[i])
  const getTitle = (arr, i) =>
    arr[i] && (arr[i].title || arr[i].value || arr[i])
  const getIndex = (arr, valOrTitle) => {
    const index = arr.findIndex(
      (el) => el.value === valOrTitle || el.title === valOrTitle,
    )
    return index > -1 ? index : undefined
  }

  /**
   * TextPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of auto-complete choices objects
   * @param {Function} [opts.suggest] Filter function. Defaults to sort by title
   * @param {Number} [opts.limit=10] Max number of results to show
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {String} [opts.style='default'] Render style
   * @param {String} [opts.fallback] Fallback message - initial to default value
   * @param {String} [opts.initial] Index of the default value
   * @param {Boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.noMatches] The no matches found label
   */
  class AutocompletePrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.suggest = opts.suggest
      this.choices = opts.choices
      this.initial =
        typeof opts.initial === 'number'
          ? opts.initial
          : getIndex(opts.choices, opts.initial)
      this.select = this.initial || opts.cursor || 0
      this.i18n = { noMatches: opts.noMatches || 'no matches found' }
      this.fallback = opts.fallback || this.initial
      this.clearFirst = opts.clearFirst || false
      this.suggestions = []
      this.input = ''
      this.limit = opts.limit || 10
      this.cursor = 0
      this.transform = style.render(opts.style)
      this.scale = this.transform.scale
      this.render = this.render.bind(this)
      this.complete = this.complete.bind(this)
      this.clear = clear('', this.out.columns)
      this.complete(this.render)
      this.render()
    }

    set fallback(fb) {
      this._fb = Number.isSafeInteger(parseInt(fb)) ? parseInt(fb) : fb
    }

    get fallback() {
      let choice
      if (typeof this._fb === 'number') choice = this.choices[this._fb]
      else if (typeof this._fb === 'string') choice = { title: this._fb }
      return choice || this._fb || { title: this.i18n.noMatches }
    }

    moveSelect(i) {
      this.select = i
      if (this.suggestions.length > 0) this.value = getVal(this.suggestions, i)
      else this.value = this.fallback.value
      this.fire()
    }

    async complete(cb) {
      const p = (this.completing = this.suggest(this.input, this.choices))
      const suggestions = await p

      if (this.completing !== p) return
      this.suggestions = suggestions.map((s, i, arr) => ({
        title: getTitle(arr, i),
        value: getVal(arr, i),
        description: s.description,
      }))
      this.completing = false
      const l = Math.max(suggestions.length - 1, 0)
      this.moveSelect(Math.min(l, this.select))

      cb && cb()
    }

    reset() {
      this.input = ''
      this.complete(() => {
        this.moveSelect(this.initial !== void 0 ? this.initial : 0)
        this.render()
      })
      this.render()
    }

    exit() {
      if (this.clearFirst && this.input.length > 0) {
        this.reset()
      } else {
        this.done = this.exited = true
        this.aborted = false
        this.fire()
        this.render()
        this.out.write('\n')
        this.close()
      }
    }

    abort() {
      this.done = this.aborted = true
      this.exited = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.done = true
      this.aborted = this.exited = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    _(c, key) {
      let s1 = this.input.slice(0, this.cursor)
      let s2 = this.input.slice(this.cursor)
      this.input = `${s1}${c}${s2}`
      this.cursor = s1.length + 1
      this.complete(this.render)
      this.render()
    }

    delete() {
      if (this.cursor === 0) return this.bell()
      let s1 = this.input.slice(0, this.cursor - 1)
      let s2 = this.input.slice(this.cursor)
      this.input = `${s1}${s2}`
      this.complete(this.render)
      this.cursor = this.cursor - 1
      this.render()
    }

    deleteForward() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell()
      let s1 = this.input.slice(0, this.cursor)
      let s2 = this.input.slice(this.cursor + 1)
      this.input = `${s1}${s2}`
      this.complete(this.render)
      this.render()
    }

    first() {
      this.moveSelect(0)
      this.render()
    }

    last() {
      this.moveSelect(this.suggestions.length - 1)
      this.render()
    }

    up() {
      if (this.select === 0) {
        this.moveSelect(this.suggestions.length - 1)
      } else {
        this.moveSelect(this.select - 1)
      }
      this.render()
    }

    down() {
      if (this.select === this.suggestions.length - 1) {
        this.moveSelect(0)
      } else {
        this.moveSelect(this.select + 1)
      }
      this.render()
    }

    next() {
      if (this.select === this.suggestions.length - 1) {
        this.moveSelect(0)
      } else this.moveSelect(this.select + 1)
      this.render()
    }

    nextPage() {
      this.moveSelect(
        Math.min(this.select + this.limit, this.suggestions.length - 1),
      )
      this.render()
    }

    prevPage() {
      this.moveSelect(Math.max(this.select - this.limit, 0))
      this.render()
    }

    left() {
      if (this.cursor <= 0) return this.bell()
      this.cursor = this.cursor - 1
      this.render()
    }

    right() {
      if (this.cursor * this.scale >= this.rendered.length) return this.bell()
      this.cursor = this.cursor + 1
      this.render()
    }

    renderOption(v, hovered, isStart, isEnd) {
      let desc
      let prefix = isStart ? figures.arrowUp : isEnd ? figures.arrowDown : ' '
      let title = hovered ? color.cyan().underline(v.title) : v.title
      prefix = (hovered ? color.cyan(figures.pointer) + ' ' : '  ') + prefix
      if (v.description) {
        desc = ` - ${v.description}`
        if (
          prefix.length + title.length + desc.length >= this.out.columns ||
          v.description.split(/\r?\n/).length > 1
        ) {
          desc =
            '\n' + wrap(v.description, { margin: 3, width: this.out.columns })
        }
      }
      return prefix + ' ' + title + color.gray(desc || '')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      let { startIndex, endIndex } = entriesToDisplay(
        this.select,
        this.choices.length,
        this.limit,
      )

      this.outputText = [
        style.symbol(this.done, this.aborted, this.exited),
        color.bold(this.msg),
        style.delimiter(this.completing),
        this.done && this.suggestions[this.select]
          ? this.suggestions[this.select].title
          : (this.rendered = this.transform.render(this.input)),
      ].join(' ')

      if (!this.done) {
        const suggestions = this.suggestions
          .slice(startIndex, endIndex)
          .map((item, i) =>
            this.renderOption(
              item,
              this.select === i + startIndex,
              i === 0 && startIndex > 0,
              i + startIndex === endIndex - 1 && endIndex < this.choices.length,
            ),
          )
          .join('\n')
        this.outputText +=
          `\n` + (suggestions || color.gray(this.fallback.title))
      }

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  autocomplete = AutocompletePrompt
  return autocomplete
}

var autocompleteMultiselect
var hasRequiredAutocompleteMultiselect

function requireAutocompleteMultiselect() {
  if (hasRequiredAutocompleteMultiselect) return autocompleteMultiselect
  hasRequiredAutocompleteMultiselect = 1

  const color = requireKleur()
  const { cursor } = requireSrc()
  const MultiselectPrompt = requireMultiselect()
  const { clear, style, figures } = requireUtil()
  /**
   * MultiselectPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Array} opts.choices Array of choice objects
   * @param {String} [opts.hint] Hint to display
   * @param {String} [opts.warn] Hint shown for disabled choices
   * @param {Number} [opts.max] Max choices
   * @param {Number} [opts.cursor=0] Cursor start position
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   */
  class AutocompleteMultiselectPrompt extends MultiselectPrompt {
    constructor(opts = {}) {
      opts.overrideRender = true
      super(opts)
      this.inputValue = ''
      this.clear = clear('', this.out.columns)
      this.filteredOptions = this.value
      this.render()
    }

    last() {
      this.cursor = this.filteredOptions.length - 1
      this.render()
    }
    next() {
      this.cursor = (this.cursor + 1) % this.filteredOptions.length
      this.render()
    }

    up() {
      if (this.cursor === 0) {
        this.cursor = this.filteredOptions.length - 1
      } else {
        this.cursor--
      }
      this.render()
    }

    down() {
      if (this.cursor === this.filteredOptions.length - 1) {
        this.cursor = 0
      } else {
        this.cursor++
      }
      this.render()
    }

    left() {
      this.filteredOptions[this.cursor].selected = false
      this.render()
    }

    right() {
      if (this.value.filter((e) => e.selected).length >= this.maxChoices)
        return this.bell()
      this.filteredOptions[this.cursor].selected = true
      this.render()
    }

    delete() {
      if (this.inputValue.length) {
        this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1)
        this.updateFilteredOptions()
      }
    }

    updateFilteredOptions() {
      const currentHighlight = this.filteredOptions[this.cursor]
      this.filteredOptions = this.value.filter((v) => {
        if (this.inputValue) {
          if (typeof v.title === 'string') {
            if (v.title.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true
            }
          }
          if (typeof v.value === 'string') {
            if (v.value.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true
            }
          }
          return false
        }
        return true
      })
      const newHighlightIndex = this.filteredOptions.findIndex(
        (v) => v === currentHighlight,
      )
      this.cursor = newHighlightIndex < 0 ? 0 : newHighlightIndex
      this.render()
    }

    handleSpaceToggle() {
      const v = this.filteredOptions[this.cursor]

      if (v.selected) {
        v.selected = false
        this.render()
      } else if (
        v.disabled ||
        this.value.filter((e) => e.selected).length >= this.maxChoices
      ) {
        return this.bell()
      } else {
        v.selected = true
        this.render()
      }
    }

    handleInputChange(c) {
      this.inputValue = this.inputValue + c
      this.updateFilteredOptions()
    }

    _(c, key) {
      if (c === ' ') {
        this.handleSpaceToggle()
      } else {
        this.handleInputChange(c)
      }
    }

    renderInstructions() {
      if (this.instructions === undefined || this.instructions) {
        if (typeof this.instructions === 'string') {
          return this.instructions
        }
        return `
Instructions:
    ${figures.arrowUp}/${figures.arrowDown}: Highlight option
    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
`
      }
      return ''
    }

    renderCurrentInput() {
      return `
Filtered results for: ${
        this.inputValue
          ? this.inputValue
          : color.gray('Enter something to filter')
      }\n`
    }

    renderOption(cursor, v, i) {
      let title
      if (v.disabled)
        title =
          cursor === i
            ? color.gray().underline(v.title)
            : color.strikethrough().gray(v.title)
      else title = cursor === i ? color.cyan().underline(v.title) : v.title
      return (
        (v.selected ? color.green(figures.radioOn) : figures.radioOff) +
        '  ' +
        title
      )
    }

    renderDoneOrInstructions() {
      if (this.done) {
        return this.value
          .filter((e) => e.selected)
          .map((v) => v.title)
          .join(', ')
      }

      const output = [
        color.gray(this.hint),
        this.renderInstructions(),
        this.renderCurrentInput(),
      ]

      if (
        this.filteredOptions.length &&
        this.filteredOptions[this.cursor].disabled
      ) {
        output.push(color.yellow(this.warn))
      }
      return output.join(' ')
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      super.render()

      // print prompt

      let prompt = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(false),
        this.renderDoneOrInstructions(),
      ].join(' ')

      if (this.showMinError) {
        prompt += color.red(
          `You must select a minimum of ${this.minSelected} choices.`,
        )
        this.showMinError = false
      }
      prompt += this.renderOptions(this.filteredOptions)

      this.out.write(this.clear + prompt)
      this.clear = clear(prompt, this.out.columns)
    }
  }

  autocompleteMultiselect = AutocompleteMultiselectPrompt
  return autocompleteMultiselect
}

var confirm
var hasRequiredConfirm

function requireConfirm() {
  if (hasRequiredConfirm) return confirm
  hasRequiredConfirm = 1
  const color = requireKleur()
  const Prompt = requirePrompt()
  const { style, clear } = requireUtil()
  const { erase, cursor } = requireSrc()

  /**
   * ConfirmPrompt Base Element
   * @param {Object} opts Options
   * @param {String} opts.message Message
   * @param {Boolean} [opts.initial] Default value (true/false)
   * @param {Stream} [opts.stdin] The Readable stream to listen to
   * @param {Stream} [opts.stdout] The Writable stream to write readline data to
   * @param {String} [opts.yes] The "Yes" label
   * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
   * @param {String} [opts.no] The "No" label
   * @param {String} [opts.noOption] The "No" option when choosing between yes/no
   */
  class ConfirmPrompt extends Prompt {
    constructor(opts = {}) {
      super(opts)
      this.msg = opts.message
      this.value = opts.initial
      this.initialValue = !!opts.initial
      this.yesMsg = opts.yes || 'yes'
      this.yesOption = opts.yesOption || '(Y/n)'
      this.noMsg = opts.no || 'no'
      this.noOption = opts.noOption || '(y/N)'
      this.render()
    }

    reset() {
      this.value = this.initialValue
      this.fire()
      this.render()
    }

    exit() {
      this.abort()
    }

    abort() {
      this.done = this.aborted = true
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    submit() {
      this.value = this.value || false
      this.done = true
      this.aborted = false
      this.fire()
      this.render()
      this.out.write('\n')
      this.close()
    }

    _(c, key) {
      if (c.toLowerCase() === 'y') {
        this.value = true
        return this.submit()
      }
      if (c.toLowerCase() === 'n') {
        this.value = false
        return this.submit()
      }
      return this.bell()
    }

    render() {
      if (this.closed) return
      if (this.firstRender) this.out.write(cursor.hide)
      else this.out.write(clear(this.outputText, this.out.columns))
      super.render()

      this.outputText = [
        style.symbol(this.done, this.aborted),
        color.bold(this.msg),
        style.delimiter(this.done),
        this.done
          ? this.value
            ? this.yesMsg
            : this.noMsg
          : color.gray(this.initialValue ? this.yesOption : this.noOption),
      ].join(' ')

      this.out.write(erase.line + cursor.to(0) + this.outputText)
    }
  }

  confirm = ConfirmPrompt
  return confirm
}

var elements
var hasRequiredElements

function requireElements() {
  if (hasRequiredElements) return elements
  hasRequiredElements = 1

  elements = {
    TextPrompt: requireText(),
    SelectPrompt: requireSelect(),
    TogglePrompt: requireToggle(),
    DatePrompt: requireDate(),
    NumberPrompt: requireNumber(),
    MultiselectPrompt: requireMultiselect(),
    AutocompletePrompt: requireAutocomplete(),
    AutocompleteMultiselectPrompt: requireAutocompleteMultiselect(),
    ConfirmPrompt: requireConfirm(),
  }
  return elements
}

var hasRequiredPrompts

function requirePrompts() {
  if (hasRequiredPrompts) return prompts$1
  hasRequiredPrompts = 1
  ;(function (exports) {
    const $ = exports
    const el = requireElements()
    const noop = (v) => v

    function toPrompt(type, args, opts = {}) {
      return new Promise((res, rej) => {
        const p = new el[type](args)
        const onAbort = opts.onAbort || noop
        const onSubmit = opts.onSubmit || noop
        const onExit = opts.onExit || noop
        p.on('state', args.onState || noop)
        p.on('submit', (x) => res(onSubmit(x)))
        p.on('exit', (x) => res(onExit(x)))
        p.on('abort', (x) => rej(onAbort(x)))
      })
    }

    /**
     * Text prompt
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.text = (args) => toPrompt('TextPrompt', args)

    /**
     * Password prompt with masked input
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.password = (args) => {
      args.style = 'password'
      return $.text(args)
    }

    /**
     * Prompt where input is invisible, like sudo
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {function} [args.onState] On state change callback
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.invisible = (args) => {
      args.style = 'invisible'
      return $.text(args)
    }

    /**
     * Number prompt
     * @param {string} args.message Prompt message to display
     * @param {number} args.initial Default number value
     * @param {function} [args.onState] On state change callback
     * @param {number} [args.max] Max value
     * @param {number} [args.min] Min value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {Boolean} [opts.float=false] Parse input as floats
     * @param {Number} [opts.round=2] Round floats to x decimals
     * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.number = (args) => toPrompt('NumberPrompt', args)

    /**
     * Date prompt
     * @param {string} args.message Prompt message to display
     * @param {number} args.initial Default number value
     * @param {function} [args.onState] On state change callback
     * @param {number} [args.max] Max value
     * @param {number} [args.min] Min value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {Boolean} [opts.float=false] Parse input as floats
     * @param {Number} [opts.round=2] Round floats to x decimals
     * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
     * @param {function} [args.validate] Function to validate user input
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.date = (args) => toPrompt('DatePrompt', args)

    /**
     * Classic yes/no prompt
     * @param {string} args.message Prompt message to display
     * @param {boolean} [args.initial=false] Default value
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.confirm = (args) => toPrompt('ConfirmPrompt', args)

    /**
     * List prompt, split intput string by `seperator`
     * @param {string} args.message Prompt message to display
     * @param {string} [args.initial] Default string value
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {string} [args.separator] String separator
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input, in form of an `Array`
     */
    $.list = (args) => {
      const sep = args.separator || ','
      return toPrompt('TextPrompt', args, {
        onSubmit: (str) => str.split(sep).map((s) => s.trim()),
      })
    }

    /**
     * Toggle/switch prompt
     * @param {string} args.message Prompt message to display
     * @param {boolean} [args.initial=false] Default value
     * @param {string} [args.active="on"] Text for `active` state
     * @param {string} [args.inactive="off"] Text for `inactive` state
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.toggle = (args) => toPrompt('TogglePrompt', args)

    /**
     * Interactive select prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of choices objects `[{ title, value }, ...]`
     * @param {number} [args.initial] Index of default value
     * @param {String} [args.hint] Hint to display
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.select = (args) => toPrompt('SelectPrompt', args)

    /**
     * Interactive multi-select / autocompleteMultiselect prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of choices objects `[{ title, value, [selected] }, ...]`
     * @param {number} [args.max] Max select
     * @param {string} [args.hint] Hint to display user
     * @param {Number} [args.cursor=0] Cursor start position
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.multiselect = (args) => {
      args.choices = [].concat(args.choices || [])
      const toSelected = (items) =>
        items.filter((item) => item.selected).map((item) => item.value)
      return toPrompt('MultiselectPrompt', args, {
        onAbort: toSelected,
        onSubmit: toSelected,
      })
    }

    $.autocompleteMultiselect = (args) => {
      args.choices = [].concat(args.choices || [])
      const toSelected = (items) =>
        items.filter((item) => item.selected).map((item) => item.value)
      return toPrompt('AutocompleteMultiselectPrompt', args, {
        onAbort: toSelected,
        onSubmit: toSelected,
      })
    }

    const byTitle = (input, choices) =>
      Promise.resolve(
        choices.filter(
          (item) =>
            item.title.slice(0, input.length).toLowerCase() ===
            input.toLowerCase(),
        ),
      )

    /**
     * Interactive auto-complete prompt
     * @param {string} args.message Prompt message to display
     * @param {Array} args.choices Array of auto-complete choices objects `[{ title, value }, ...]`
     * @param {Function} [args.suggest] Function to filter results based on user input. Defaults to sort by `title`
     * @param {number} [args.limit=10] Max number of results to show
     * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
     * @param {String} [args.initial] Index of the default value
     * @param {boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
     * @param {String} [args.fallback] Fallback message - defaults to initial value
     * @param {function} [args.onState] On state change callback
     * @param {Stream} [args.stdin] The Readable stream to listen to
     * @param {Stream} [args.stdout] The Writable stream to write readline data to
     * @returns {Promise} Promise with user input
     */
    $.autocomplete = (args) => {
      args.suggest = args.suggest || byTitle
      args.choices = [].concat(args.choices || [])
      return toPrompt('AutocompletePrompt', args)
    }
  })(prompts$1)
  return prompts$1
}

var lib
var hasRequiredLib

function requireLib() {
  if (hasRequiredLib) return lib
  hasRequiredLib = 1

  const prompts = requirePrompts()

  const passOn = [
    'suggest',
    'format',
    'onState',
    'validate',
    'onRender',
    'type',
  ]
  const noop = () => {}

  /**
   * Prompt for a series of questions
   * @param {Array|Object} questions Single question object or Array of question objects
   * @param {Function} [onSubmit] Callback function called on prompt submit
   * @param {Function} [onCancel] Callback function called on cancel/abort
   * @returns {Object} Object with values from user input
   */
  async function prompt(
    questions = [],
    { onSubmit = noop, onCancel = noop } = {},
  ) {
    const answers = {}
    const override = prompt._override || {}
    questions = [].concat(questions)
    let answer, question, quit, name, type, lastPrompt

    const getFormattedAnswer = async (
      question,
      answer,
      skipValidation = false,
    ) => {
      if (
        !skipValidation &&
        question.validate &&
        question.validate(answer) !== true
      ) {
        return
      }
      return question.format ? await question.format(answer, answers) : answer
    }

    for (question of questions) {
      ;({ name, type } = question)

      // evaluate type first and skip if type is a falsy value
      if (typeof type === 'function') {
        type = await type(answer, { ...answers }, question)
        question['type'] = type
      }
      if (!type) continue

      // if property is a function, invoke it unless it's a special function
      for (let key in question) {
        if (passOn.includes(key)) continue
        let value = question[key]
        question[key] =
          typeof value === 'function'
            ? await value(answer, { ...answers }, lastPrompt)
            : value
      }

      lastPrompt = question

      if (typeof question.message !== 'string') {
        throw new Error('prompt message is required')
      }

      // update vars in case they changed
      ;({ name, type } = question)

      if (prompts[type] === void 0) {
        throw new Error(`prompt type (${type}) is not defined`)
      }

      if (override[question.name] !== undefined) {
        answer = await getFormattedAnswer(question, override[question.name])
        if (answer !== undefined) {
          answers[name] = answer
          continue
        }
      }

      try {
        // Get the injected answer if there is one or prompt the user
        answer = prompt._injected
          ? getInjectedAnswer(prompt._injected, question.initial)
          : await prompts[type](question)
        answers[name] = answer = await getFormattedAnswer(
          question,
          answer,
          true,
        )
        quit = await onSubmit(question, answer, answers)
      } catch (err) {
        quit = !(await onCancel(question, answers))
      }

      if (quit) return answers
    }

    return answers
  }

  function getInjectedAnswer(injected, deafultValue) {
    const answer = injected.shift()
    if (answer instanceof Error) {
      throw answer
    }

    return answer === undefined ? deafultValue : answer
  }

  function inject(answers) {
    prompt._injected = (prompt._injected || []).concat(answers)
  }

  function override(answers) {
    prompt._override = Object.assign({}, answers)
  }

  lib = Object.assign(prompt, { prompt, prompts, inject, override })
  return lib
}

function isNodeLT(tar) {
  tar = (Array.isArray(tar) ? tar : tar.split('.')).map(Number)
  let i = 0,
    src = process.versions.node.split('.').map(Number)
  for (; i < tar.length; i++) {
    if (src[i] > tar[i]) return false
    if (tar[i] > src[i]) return true
  }
  return false
}

var prompts = isNodeLT('8.6.0') ? requireDist() : requireLib()

var picocolorsExports = {}
var picocolors = {
  get exports() {
    return picocolorsExports
  },
  set exports(v) {
    picocolorsExports = v
  },
}

let tty = require$$0$1

let isColorSupported =
  !('NO_COLOR' in process.env || process.argv.includes('--no-color')) &&
  ('FORCE_COLOR' in process.env ||
    process.argv.includes('--color') ||
    process.platform === 'win32' ||
    (tty.isatty(1) && process.env.TERM !== 'dumb') ||
    'CI' in process.env)

let formatter =
  (open, close, replace = open) =>
  (input) => {
    let string = '' + input
    let index = string.indexOf(close, open.length)
    return ~index
      ? open + replaceClose(string, close, replace, index) + close
      : open + string + close
  }

let replaceClose = (string, close, replace, index) => {
  let start = string.substring(0, index) + replace
  let end = string.substring(index + close.length)
  let nextIndex = end.indexOf(close)
  return ~nextIndex
    ? start + replaceClose(end, close, replace, nextIndex)
    : start + end
}

let createColors = (enabled = isColorSupported) => ({
  isColorSupported: enabled,
  reset: enabled ? (s) => `\x1b[0m${s}\x1b[0m` : String,
  bold: enabled ? formatter('\x1b[1m', '\x1b[22m', '\x1b[22m\x1b[1m') : String,
  dim: enabled ? formatter('\x1b[2m', '\x1b[22m', '\x1b[22m\x1b[2m') : String,
  italic: enabled ? formatter('\x1b[3m', '\x1b[23m') : String,
  underline: enabled ? formatter('\x1b[4m', '\x1b[24m') : String,
  inverse: enabled ? formatter('\x1b[7m', '\x1b[27m') : String,
  hidden: enabled ? formatter('\x1b[8m', '\x1b[28m') : String,
  strikethrough: enabled ? formatter('\x1b[9m', '\x1b[29m') : String,
  black: enabled ? formatter('\x1b[30m', '\x1b[39m') : String,
  red: enabled ? formatter('\x1b[31m', '\x1b[39m') : String,
  green: enabled ? formatter('\x1b[32m', '\x1b[39m') : String,
  yellow: enabled ? formatter('\x1b[33m', '\x1b[39m') : String,
  blue: enabled ? formatter('\x1b[34m', '\x1b[39m') : String,
  magenta: enabled ? formatter('\x1b[35m', '\x1b[39m') : String,
  cyan: enabled ? formatter('\x1b[36m', '\x1b[39m') : String,
  white: enabled ? formatter('\x1b[37m', '\x1b[39m') : String,
  gray: enabled ? formatter('\x1b[90m', '\x1b[39m') : String,
  bgBlack: enabled ? formatter('\x1b[40m', '\x1b[49m') : String,
  bgRed: enabled ? formatter('\x1b[41m', '\x1b[49m') : String,
  bgGreen: enabled ? formatter('\x1b[42m', '\x1b[49m') : String,
  bgYellow: enabled ? formatter('\x1b[43m', '\x1b[49m') : String,
  bgBlue: enabled ? formatter('\x1b[44m', '\x1b[49m') : String,
  bgMagenta: enabled ? formatter('\x1b[45m', '\x1b[49m') : String,
  bgCyan: enabled ? formatter('\x1b[46m', '\x1b[49m') : String,
  bgWhite: enabled ? formatter('\x1b[47m', '\x1b[49m') : String,
})

picocolors.exports = createColors()
picocolorsExports.createColors = createColors

var crossSpawnExports = {}
var crossSpawn = {
  get exports() {
    return crossSpawnExports
  },
  set exports(v) {
    crossSpawnExports = v
  },
}

var windows
var hasRequiredWindows

function requireWindows() {
  if (hasRequiredWindows) return windows
  hasRequiredWindows = 1
  windows = isexe
  isexe.sync = sync

  var fs = require$$0$2

  function checkPathExt(path, options) {
    var pathext =
      options.pathExt !== undefined ? options.pathExt : process.env.PATHEXT

    if (!pathext) {
      return true
    }

    pathext = pathext.split(';')
    if (pathext.indexOf('') !== -1) {
      return true
    }
    for (var i = 0; i < pathext.length; i++) {
      var p = pathext[i].toLowerCase()
      if (p && path.substr(-p.length).toLowerCase() === p) {
        return true
      }
    }
    return false
  }

  function checkStat(stat, path, options) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false
    }
    return checkPathExt(path, options)
  }

  function isexe(path, options, cb) {
    fs.stat(path, function (er, stat) {
      cb(er, er ? false : checkStat(stat, path, options))
    })
  }

  function sync(path, options) {
    return checkStat(fs.statSync(path), path, options)
  }
  return windows
}

var mode
var hasRequiredMode

function requireMode() {
  if (hasRequiredMode) return mode
  hasRequiredMode = 1
  mode = isexe
  isexe.sync = sync

  var fs = require$$0$2

  function isexe(path, options, cb) {
    fs.stat(path, function (er, stat) {
      cb(er, er ? false : checkStat(stat, options))
    })
  }

  function sync(path, options) {
    return checkStat(fs.statSync(path), options)
  }

  function checkStat(stat, options) {
    return stat.isFile() && checkMode(stat, options)
  }

  function checkMode(stat, options) {
    var mod = stat.mode
    var uid = stat.uid
    var gid = stat.gid

    var myUid =
      options.uid !== undefined
        ? options.uid
        : process.getuid && process.getuid()
    var myGid =
      options.gid !== undefined
        ? options.gid
        : process.getgid && process.getgid()

    var u = parseInt('100', 8)
    var g = parseInt('010', 8)
    var o = parseInt('001', 8)
    var ug = u | g

    var ret =
      mod & o ||
      (mod & g && gid === myGid) ||
      (mod & u && uid === myUid) ||
      (mod & ug && myUid === 0)

    return ret
  }
  return mode
}

var core
if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) {
  core = requireWindows()
} else {
  core = requireMode()
}

var isexe_1 = isexe$1
isexe$1.sync = sync

function isexe$1(path, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe$1(path, options || {}, function (er, is) {
        if (er) {
          reject(er)
        } else {
          resolve(is)
        }
      })
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || (options && options.ignoreErrors)) {
        er = null
        is = false
      }
    }
    cb(er, is)
  })
}

function sync(path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if ((options && options.ignoreErrors) || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}

const isWindows =
  process.platform === 'win32' ||
  process.env.OSTYPE === 'cygwin' ||
  process.env.OSTYPE === 'msys'

const path$2 = require$$0$3
const COLON = isWindows ? ';' : ':'
const isexe = isexe_1

const getNotFoundError = (cmd) =>
  Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' })

const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv =
    cmd.match(/\//) || (isWindows && cmd.match(/\\/))
      ? ['']
      : [
          // windows always checks the cwd first
          ...(isWindows ? [process.cwd()] : []),
          ...(
            opt.path ||
            process.env.PATH ||
            /* istanbul ignore next: very unusual */ ''
          ).split(colon),
        ]
  const pathExtExe = isWindows
    ? opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM'
    : ''
  const pathExt = isWindows ? pathExtExe.split(colon) : ['']

  if (isWindows) {
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '') pathExt.unshift('')
  }

  return {
    pathEnv,
    pathExt,
    pathExtExe,
  }
}

const which$1 = (cmd, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  if (!opt) opt = {}

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  const step = (i) =>
    new Promise((resolve, reject) => {
      if (i === pathEnv.length)
        return opt.all && found.length
          ? resolve(found)
          : reject(getNotFoundError(cmd))

      const ppRaw = pathEnv[i]
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw

      const pCmd = path$2.join(pathPart, cmd)
      const p =
        !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd

      resolve(subStep(p, i, 0))
    })

  const subStep = (p, i, ii) =>
    new Promise((resolve, reject) => {
      if (ii === pathExt.length) return resolve(step(i + 1))
      const ext = pathExt[ii]
      isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
        if (!er && is) {
          if (opt.all) found.push(p + ext)
          else return resolve(p + ext)
        }
        return resolve(subStep(p, i, ii + 1))
      })
    })

  return cb ? step(0).then((res) => cb(null, res), cb) : step(0)
}

const whichSync = (cmd, opt) => {
  opt = opt || {}

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt)
  const found = []

  for (let i = 0; i < pathEnv.length; i++) {
    const ppRaw = pathEnv[i]
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw

    const pCmd = path$2.join(pathPart, cmd)
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd

    for (let j = 0; j < pathExt.length; j++) {
      const cur = p + pathExt[j]
      try {
        const is = isexe.sync(cur, { pathExt: pathExtExe })
        if (is) {
          if (opt.all) found.push(cur)
          else return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length) return found

  if (opt.nothrow) return null

  throw getNotFoundError(cmd)
}

var which_1 = which$1
which$1.sync = whichSync

var pathKeyExports = {}
var pathKey$2 = {
  get exports() {
    return pathKeyExports
  },
  set exports(v) {
    pathKeyExports = v
  },
}

const pathKey$1 = (options = {}) => {
  const environment = options.env || process.env
  const platform = options.platform || process.platform

  if (platform !== 'win32') {
    return 'PATH'
  }

  return (
    Object.keys(environment)
      .reverse()
      .find((key) => key.toUpperCase() === 'PATH') || 'Path'
  )
}

pathKey$2.exports = pathKey$1
// TODO: Remove this for the next major release
pathKeyExports.default = pathKey$1

const path$1 = require$$0$3
const which = which_1
const getPathKey = pathKeyExports

function resolveCommandAttempt(parsed, withoutPathExt) {
  const env = parsed.options.env || process.env
  const cwd = process.cwd()
  const hasCustomCwd = parsed.options.cwd != null
  // Worker threads do not have process.chdir()
  const shouldSwitchCwd =
    hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled

  // If a custom `cwd` was specified, we need to change the process cwd
  // because `which` will do stat calls but does not support a custom cwd
  if (shouldSwitchCwd) {
    try {
      process.chdir(parsed.options.cwd)
    } catch (err) {
      /* Empty */
    }
  }

  let resolved

  try {
    resolved = which.sync(parsed.command, {
      path: env[getPathKey({ env })],
      pathExt: withoutPathExt ? path$1.delimiter : undefined,
    })
  } catch (e) {
    /* Empty */
  } finally {
    if (shouldSwitchCwd) {
      process.chdir(cwd)
    }
  }

  // If we successfully resolved, ensure that an absolute path is returned
  // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
  if (resolved) {
    resolved = path$1.resolve(hasCustomCwd ? parsed.options.cwd : '', resolved)
  }

  return resolved
}

function resolveCommand$1(parsed) {
  return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true)
}

var resolveCommand_1 = resolveCommand$1

var _escape = {}

// See http://www.robvanderwoude.com/escapechars.php
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g

function escapeCommand(arg) {
  // Escape meta chars
  arg = arg.replace(metaCharsRegExp, '^$1')

  return arg
}

function escapeArgument(arg, doubleEscapeMetaChars) {
  // Convert to string
  arg = `${arg}`

  // Algorithm below is based on https://qntm.org/cmd

  // Sequence of backslashes followed by a double quote:
  // double up all the backslashes and escape the double quote
  arg = arg.replace(/(\\*)"/g, '$1$1\\"')

  // Sequence of backslashes followed by the end of the string
  // (which will become a double quote later):
  // double up all the backslashes
  arg = arg.replace(/(\\*)$/, '$1$1')

  // All other backslashes occur literally

  // Quote the whole thing:
  arg = `"${arg}"`

  // Escape meta chars
  arg = arg.replace(metaCharsRegExp, '^$1')

  // Double escape meta chars if necessary
  if (doubleEscapeMetaChars) {
    arg = arg.replace(metaCharsRegExp, '^$1')
  }

  return arg
}

_escape.command = escapeCommand
_escape.argument = escapeArgument

var shebangRegex$1 = /^#!(.*)/

const shebangRegex = shebangRegex$1

var shebangCommand$1 = (string = '') => {
  const match = string.match(shebangRegex)

  if (!match) {
    return null
  }

  const [path, argument] = match[0].replace(/#! ?/, '').split(' ')
  const binary = path.split('/').pop()

  if (binary === 'env') {
    return argument
  }

  return argument ? `${binary} ${argument}` : binary
}

const fs = require$$0$2
const shebangCommand = shebangCommand$1

function readShebang$1(command) {
  // Read the first 150 bytes from the file
  const size = 150
  const buffer = Buffer.alloc(size)

  let fd

  try {
    fd = fs.openSync(command, 'r')
    fs.readSync(fd, buffer, 0, size, 0)
    fs.closeSync(fd)
  } catch (e) {
    /* Empty */
  }

  // Attempt to extract shebang (null is returned if not a shebang)
  return shebangCommand(buffer.toString())
}

var readShebang_1 = readShebang$1

const path = require$$0$3
const resolveCommand = resolveCommand_1
const escape = _escape
const readShebang = readShebang_1

const isWin$2 = process.platform === 'win32'
const isExecutableRegExp = /\.(?:com|exe)$/i
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i

function detectShebang(parsed) {
  parsed.file = resolveCommand(parsed)

  const shebang = parsed.file && readShebang(parsed.file)

  if (shebang) {
    parsed.args.unshift(parsed.file)
    parsed.command = shebang

    return resolveCommand(parsed)
  }

  return parsed.file
}

function parseNonShell(parsed) {
  if (!isWin$2) {
    return parsed
  }

  // Detect & add support for shebangs
  const commandFile = detectShebang(parsed)

  // We don't need a shell if the command filename is an executable
  const needsShell = !isExecutableRegExp.test(commandFile)

  // If a shell is required, use cmd.exe and take care of escaping everything correctly
  // Note that `forceShell` is an hidden option used only in tests
  if (parsed.options.forceShell || needsShell) {
    // Need to double escape meta chars if the command is a cmd-shim located in `node_modules/.bin/`
    // The cmd-shim simply calls execute the package bin file with NodeJS, proxying any argument
    // Because the escape of metachars with ^ gets interpreted when the cmd.exe is first called,
    // we need to double escape them
    const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile)

    // Normalize posix paths into OS compatible paths (e.g.: foo/bar -> foo\bar)
    // This is necessary otherwise it will always fail with ENOENT in those cases
    parsed.command = path.normalize(parsed.command)

    // Escape command & arguments
    parsed.command = escape.command(parsed.command)
    parsed.args = parsed.args.map((arg) =>
      escape.argument(arg, needsDoubleEscapeMetaChars),
    )

    const shellCommand = [parsed.command].concat(parsed.args).join(' ')

    parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`]
    parsed.command = process.env.comspec || 'cmd.exe'
    parsed.options.windowsVerbatimArguments = true // Tell node's spawn that the arguments are already escaped
  }

  return parsed
}

function parse$1(command, args, options) {
  // Normalize arguments, similar to nodejs
  if (args && !Array.isArray(args)) {
    options = args
    args = null
  }

  args = args ? args.slice(0) : [] // Clone array to avoid changing the original
  options = Object.assign({}, options) // Clone object to avoid changing the original

  // Build our parsed object
  const parsed = {
    command,
    args,
    options,
    file: undefined,
    original: {
      command,
      args,
    },
  }

  // Delegate further parsing to shell or non-shell
  return options.shell ? parsed : parseNonShell(parsed)
}

var parse_1 = parse$1

const isWin$1 = process.platform === 'win32'

function notFoundError(original, syscall) {
  return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
    code: 'ENOENT',
    errno: 'ENOENT',
    syscall: `${syscall} ${original.command}`,
    path: original.command,
    spawnargs: original.args,
  })
}

function hookChildProcess(cp, parsed) {
  if (!isWin$1) {
    return
  }

  const originalEmit = cp.emit

  cp.emit = function (name, arg1) {
    // If emitting "exit" event and exit code is 1, we need to check if
    // the command exists and emit an "error" instead
    // See https://github.com/IndigoUnited/node-cross-spawn/issues/16
    if (name === 'exit') {
      const err = verifyENOENT(arg1, parsed)

      if (err) {
        return originalEmit.call(cp, 'error', err)
      }
    }

    return originalEmit.apply(cp, arguments) // eslint-disable-line prefer-rest-params
  }
}

function verifyENOENT(status, parsed) {
  if (isWin$1 && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawn')
  }

  return null
}

function verifyENOENTSync(status, parsed) {
  if (isWin$1 && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawnSync')
  }

  return null
}

var enoent$1 = {
  hookChildProcess,
  verifyENOENT,
  verifyENOENTSync,
  notFoundError,
}

const cp = require$$0$4
const parse = parse_1
const enoent = enoent$1

function spawn(command, args, options) {
  // Parse the arguments
  const parsed = parse(command, args, options)

  // Spawn the child process
  const spawned = cp.spawn(parsed.command, parsed.args, parsed.options)

  // Hook into child process "exit" event to emit an error if the command
  // does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
  enoent.hookChildProcess(spawned, parsed)

  return spawned
}

function spawnSync(command, args, options) {
  // Parse the arguments
  const parsed = parse(command, args, options)

  // Spawn the child process
  const result = cp.spawnSync(parsed.command, parsed.args, parsed.options)

  // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
  result.error = result.error || enoent.verifyENOENTSync(result.status, parsed)

  return result
}

crossSpawn.exports = spawn
crossSpawnExports.spawn = spawn
crossSpawnExports.sync = spawnSync

crossSpawnExports._parse = parse
crossSpawnExports._enoent = enoent

function stripFinalNewline(input) {
  const LF = typeof input === 'string' ? '\n' : '\n'.charCodeAt()
  const CR = typeof input === 'string' ? '\r' : '\r'.charCodeAt()

  if (input[input.length - 1] === LF) {
    input = input.slice(0, -1)
  }

  if (input[input.length - 1] === CR) {
    input = input.slice(0, -1)
  }

  return input
}

function pathKey(options = {}) {
  const { env = process.env, platform = process.platform } = options

  if (platform !== 'win32') {
    return 'PATH'
  }

  return (
    Object.keys(env)
      .reverse()
      .find((key) => key.toUpperCase() === 'PATH') || 'Path'
  )
}

function npmRunPath(options = {}) {
  const {
    cwd = process$2.cwd(),
    path: path_ = process$2.env[pathKey()],
    execPath = process$2.execPath,
  } = options

  let previous
  const cwdString = cwd instanceof URL ? url.fileURLToPath(cwd) : cwd
  let cwdPath = path$3.resolve(cwdString)
  const result = []

  while (previous !== cwdPath) {
    result.push(path$3.join(cwdPath, 'node_modules/.bin'))
    previous = cwdPath
    cwdPath = path$3.resolve(cwdPath, '..')
  }

  // Ensure the running `node` binary is used.
  result.push(path$3.resolve(cwdString, execPath, '..'))

  return [...result, path_].join(path$3.delimiter)
}

function npmRunPathEnv({ env = process$2.env, ...options } = {}) {
  env = { ...env }

  const path = pathKey({ env })
  options.path = env[path]
  env[path] = npmRunPath(options)

  return env
}

const getRealtimeSignals = function () {
  const length = SIGRTMAX - SIGRTMIN + 1
  return Array.from({ length }, getRealtimeSignal)
}

const getRealtimeSignal = function (value, index) {
  return {
    name: `SIGRT${index + 1}`,
    number: SIGRTMIN + index,
    action: 'terminate',
    description: 'Application-specific signal (realtime)',
    standard: 'posix',
  }
}

const SIGRTMIN = 34
const SIGRTMAX = 64

const SIGNALS = [
  {
    name: 'SIGHUP',
    number: 1,
    action: 'terminate',
    description: 'Terminal closed',
    standard: 'posix',
  },

  {
    name: 'SIGINT',
    number: 2,
    action: 'terminate',
    description: 'User interruption with CTRL-C',
    standard: 'ansi',
  },

  {
    name: 'SIGQUIT',
    number: 3,
    action: 'core',
    description: 'User interruption with CTRL-\\',
    standard: 'posix',
  },

  {
    name: 'SIGILL',
    number: 4,
    action: 'core',
    description: 'Invalid machine instruction',
    standard: 'ansi',
  },

  {
    name: 'SIGTRAP',
    number: 5,
    action: 'core',
    description: 'Debugger breakpoint',
    standard: 'posix',
  },

  {
    name: 'SIGABRT',
    number: 6,
    action: 'core',
    description: 'Aborted',
    standard: 'ansi',
  },

  {
    name: 'SIGIOT',
    number: 6,
    action: 'core',
    description: 'Aborted',
    standard: 'bsd',
  },

  {
    name: 'SIGBUS',
    number: 7,
    action: 'core',
    description:
      'Bus error due to misaligned, non-existing address or paging error',
    standard: 'bsd',
  },

  {
    name: 'SIGEMT',
    number: 7,
    action: 'terminate',
    description: 'Command should be emulated but is not implemented',
    standard: 'other',
  },

  {
    name: 'SIGFPE',
    number: 8,
    action: 'core',
    description: 'Floating point arithmetic error',
    standard: 'ansi',
  },

  {
    name: 'SIGKILL',
    number: 9,
    action: 'terminate',
    description: 'Forced termination',
    standard: 'posix',
    forced: true,
  },

  {
    name: 'SIGUSR1',
    number: 10,
    action: 'terminate',
    description: 'Application-specific signal',
    standard: 'posix',
  },

  {
    name: 'SIGSEGV',
    number: 11,
    action: 'core',
    description: 'Segmentation fault',
    standard: 'ansi',
  },

  {
    name: 'SIGUSR2',
    number: 12,
    action: 'terminate',
    description: 'Application-specific signal',
    standard: 'posix',
  },

  {
    name: 'SIGPIPE',
    number: 13,
    action: 'terminate',
    description: 'Broken pipe or socket',
    standard: 'posix',
  },

  {
    name: 'SIGALRM',
    number: 14,
    action: 'terminate',
    description: 'Timeout or timer',
    standard: 'posix',
  },

  {
    name: 'SIGTERM',
    number: 15,
    action: 'terminate',
    description: 'Termination',
    standard: 'ansi',
  },

  {
    name: 'SIGSTKFLT',
    number: 16,
    action: 'terminate',
    description: 'Stack is empty or overflowed',
    standard: 'other',
  },

  {
    name: 'SIGCHLD',
    number: 17,
    action: 'ignore',
    description: 'Child process terminated, paused or unpaused',
    standard: 'posix',
  },

  {
    name: 'SIGCLD',
    number: 17,
    action: 'ignore',
    description: 'Child process terminated, paused or unpaused',
    standard: 'other',
  },

  {
    name: 'SIGCONT',
    number: 18,
    action: 'unpause',
    description: 'Unpaused',
    standard: 'posix',
    forced: true,
  },

  {
    name: 'SIGSTOP',
    number: 19,
    action: 'pause',
    description: 'Paused',
    standard: 'posix',
    forced: true,
  },

  {
    name: 'SIGTSTP',
    number: 20,
    action: 'pause',
    description: 'Paused using CTRL-Z or "suspend"',
    standard: 'posix',
  },

  {
    name: 'SIGTTIN',
    number: 21,
    action: 'pause',
    description: 'Background process cannot read terminal input',
    standard: 'posix',
  },

  {
    name: 'SIGBREAK',
    number: 21,
    action: 'terminate',
    description: 'User interruption with CTRL-BREAK',
    standard: 'other',
  },

  {
    name: 'SIGTTOU',
    number: 22,
    action: 'pause',
    description: 'Background process cannot write to terminal output',
    standard: 'posix',
  },

  {
    name: 'SIGURG',
    number: 23,
    action: 'ignore',
    description: 'Socket received out-of-band data',
    standard: 'bsd',
  },

  {
    name: 'SIGXCPU',
    number: 24,
    action: 'core',
    description: 'Process timed out',
    standard: 'bsd',
  },

  {
    name: 'SIGXFSZ',
    number: 25,
    action: 'core',
    description: 'File too big',
    standard: 'bsd',
  },

  {
    name: 'SIGVTALRM',
    number: 26,
    action: 'terminate',
    description: 'Timeout or timer',
    standard: 'bsd',
  },

  {
    name: 'SIGPROF',
    number: 27,
    action: 'terminate',
    description: 'Timeout or timer',
    standard: 'bsd',
  },

  {
    name: 'SIGWINCH',
    number: 28,
    action: 'ignore',
    description: 'Terminal window size changed',
    standard: 'bsd',
  },

  {
    name: 'SIGIO',
    number: 29,
    action: 'terminate',
    description: 'I/O is available',
    standard: 'other',
  },

  {
    name: 'SIGPOLL',
    number: 29,
    action: 'terminate',
    description: 'Watched event',
    standard: 'other',
  },

  {
    name: 'SIGINFO',
    number: 29,
    action: 'ignore',
    description: 'Request for process information',
    standard: 'other',
  },

  {
    name: 'SIGPWR',
    number: 30,
    action: 'terminate',
    description: 'Device running out of power',
    standard: 'systemv',
  },

  {
    name: 'SIGSYS',
    number: 31,
    action: 'core',
    description: 'Invalid system call',
    standard: 'other',
  },

  {
    name: 'SIGUNUSED',
    number: 31,
    action: 'terminate',
    description: 'Invalid system call',
    standard: 'other',
  },
]

const getSignals = function () {
  const realtimeSignals = getRealtimeSignals()
  const signals = [...SIGNALS, ...realtimeSignals].map(normalizeSignal)
  return signals
}

const normalizeSignal = function ({
  name,
  number: defaultNumber,
  description,
  action,
  forced = false,
  standard,
}) {
  const {
    signals: { [name]: constantSignal },
  } = os.constants
  const supported = constantSignal !== undefined
  const number = supported ? constantSignal : defaultNumber
  return { name, number, description, supported, action, forced, standard }
}

const getSignalsByName = function () {
  const signals = getSignals()
  return Object.fromEntries(signals.map(getSignalByName))
}

const getSignalByName = function ({
  name,
  number,
  description,
  supported,
  action,
  forced,
  standard,
}) {
  return [
    name,
    { name, number, description, supported, action, forced, standard },
  ]
}

const signalsByName = getSignalsByName()

const getSignalsByNumber = function () {
  const signals = getSignals()
  const length = SIGRTMAX + 1
  const signalsA = Array.from({ length }, (value, number) =>
    getSignalByNumber(number, signals),
  )

  return Object.assign({}, ...signalsA)
}

const getSignalByNumber = function (number, signals) {
  const signal = findSignalByNumber(number, signals)

  if (signal === undefined) {
    return {}
  }

  const { name, description, supported, action, forced, standard } = signal
  return {
    [number]: {
      name,
      number,
      description,
      supported,
      action,
      forced,
      standard,
    },
  }
}

const findSignalByNumber = function (number, signals) {
  const signal = signals.find(
    ({ name }) => os.constants.signals[name] === number,
  )

  if (signal !== undefined) {
    return signal
  }

  return signals.find((signalA) => signalA.number === number)
}

getSignalsByNumber()

const getErrorPrefix = ({
  timedOut,
  timeout,
  errorCode,
  signal,
  signalDescription,
  exitCode,
  isCanceled,
}) => {
  if (timedOut) {
    return `timed out after ${timeout} milliseconds`
  }

  if (isCanceled) {
    return 'was canceled'
  }

  if (errorCode !== undefined) {
    return `failed with ${errorCode}`
  }

  if (signal !== undefined) {
    return `was killed with ${signal} (${signalDescription})`
  }

  if (exitCode !== undefined) {
    return `failed with exit code ${exitCode}`
  }

  return 'failed'
}

const makeError = ({
  stdout,
  stderr,
  all,
  error,
  signal,
  exitCode,
  command,
  escapedCommand,
  timedOut,
  isCanceled,
  killed,
  parsed: {
    options: { timeout },
  },
}) => {
  // `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
  // We normalize them to `undefined`
  exitCode = exitCode === null ? undefined : exitCode
  signal = signal === null ? undefined : signal
  const signalDescription =
    signal === undefined ? undefined : signalsByName[signal].description

  const errorCode = error && error.code

  const prefix = getErrorPrefix({
    timedOut,
    timeout,
    errorCode,
    signal,
    signalDescription,
    exitCode,
    isCanceled,
  })
  const execaMessage = `Command ${prefix}: ${command}`
  const isError = Object.prototype.toString.call(error) === '[object Error]'
  const shortMessage = isError
    ? `${execaMessage}\n${error.message}`
    : execaMessage
  const message = [shortMessage, stderr, stdout].filter(Boolean).join('\n')

  if (isError) {
    error.originalMessage = error.message
    error.message = message
  } else {
    error = new Error(message)
  }

  error.shortMessage = shortMessage
  error.command = command
  error.escapedCommand = escapedCommand
  error.exitCode = exitCode
  error.signal = signal
  error.signalDescription = signalDescription
  error.stdout = stdout
  error.stderr = stderr

  if (all !== undefined) {
    error.all = all
  }

  if ('bufferedData' in error) {
    delete error.bufferedData
  }

  error.failed = true
  error.timedOut = Boolean(timedOut)
  error.isCanceled = isCanceled
  error.killed = killed && !timedOut

  return error
}

const aliases = ['stdin', 'stdout', 'stderr']

const hasAlias = (options) =>
  aliases.some((alias) => options[alias] !== undefined)

const normalizeStdio = (options) => {
  if (!options) {
    return
  }

  const { stdio } = options

  if (stdio === undefined) {
    return aliases.map((alias) => options[alias])
  }

  if (hasAlias(options)) {
    throw new Error(
      `It's not possible to provide \`stdio\` in combination with one of ${aliases
        .map((alias) => `\`${alias}\``)
        .join(', ')}`,
    )
  }

  if (typeof stdio === 'string') {
    return stdio
  }

  if (!Array.isArray(stdio)) {
    throw new TypeError(
      `Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``,
    )
  }

  const length = Math.max(stdio.length, aliases.length)
  return Array.from({ length }, (value, index) => stdio[index])
}

var signalExitExports = {}
var signalExit = {
  get exports() {
    return signalExitExports
  },
  set exports(v) {
    signalExitExports = v
  },
}

var signalsExports = {}
var signals$1 = {
  get exports() {
    return signalsExports
  },
  set exports(v) {
    signalsExports = v
  },
}

var hasRequiredSignals

function requireSignals() {
  if (hasRequiredSignals) return signalsExports
  hasRequiredSignals = 1
  ;(function (module) {
    // This is not the set of all possible signals.
    //
    // It IS, however, the set of all signals that trigger
    // an exit on either Linux or BSD systems.  Linux is a
    // superset of the signal names supported on BSD, and
    // the unknown signals just fail to register, so we can
    // catch that easily enough.
    //
    // Don't bother with SIGKILL.  It's uncatchable, which
    // means that we can't fire any callbacks anyway.
    //
    // If a user does happen to register a handler on a non-
    // fatal signal like SIGWINCH or something, and then
    // exit, it'll end up firing `process.emit('exit')`, so
    // the handler will be fired anyway.
    //
    // SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
    // artificially, inherently leave the process in a
    // state from which it is not safe to try and enter JS
    // listeners.
    module.exports = ['SIGABRT', 'SIGALRM', 'SIGHUP', 'SIGINT', 'SIGTERM']

    if (process.platform !== 'win32') {
      module.exports.push(
        'SIGVTALRM',
        'SIGXCPU',
        'SIGXFSZ',
        'SIGUSR2',
        'SIGTRAP',
        'SIGSYS',
        'SIGQUIT',
        'SIGIOT',
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      )
    }

    if (process.platform === 'linux') {
      module.exports.push(
        'SIGIO',
        'SIGPOLL',
        'SIGPWR',
        'SIGSTKFLT',
        'SIGUNUSED',
      )
    }
  })(signals$1)
  return signalsExports
}

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
// grab a reference to node's real process object right away
var process$1 = commonjsGlobal.process

const processOk = function (process) {
  return (
    process &&
    typeof process === 'object' &&
    typeof process.removeListener === 'function' &&
    typeof process.emit === 'function' &&
    typeof process.reallyExit === 'function' &&
    typeof process.listeners === 'function' &&
    typeof process.kill === 'function' &&
    typeof process.pid === 'number' &&
    typeof process.on === 'function'
  )
}

// some kind of non-node environment, just no-op
/* istanbul ignore if */
if (!processOk(process$1)) {
  signalExit.exports = function () {
    return function () {}
  }
} else {
  var assert = require$$0$5
  var signals = requireSignals()
  var isWin = /^win/i.test(process$1.platform)

  var EE = require$$2
  /* istanbul ignore if */
  if (typeof EE !== 'function') {
    EE = EE.EventEmitter
  }

  var emitter
  if (process$1.__signal_exit_emitter__) {
    emitter = process$1.__signal_exit_emitter__
  } else {
    emitter = process$1.__signal_exit_emitter__ = new EE()
    emitter.count = 0
    emitter.emitted = {}
  }

  // Because this emitter is a global, we have to check to see if a
  // previous version of this library failed to enable infinite listeners.
  // I know what you're about to say.  But literally everything about
  // signal-exit is a compromise with evil.  Get used to it.
  if (!emitter.infinite) {
    emitter.setMaxListeners(Infinity)
    emitter.infinite = true
  }

  signalExit.exports = function (cb, opts) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return function () {}
    }
    assert.equal(
      typeof cb,
      'function',
      'a callback must be provided for exit handler',
    )

    if (loaded === false) {
      load()
    }

    var ev = 'exit'
    if (opts && opts.alwaysLast) {
      ev = 'afterexit'
    }

    var remove = function () {
      emitter.removeListener(ev, cb)
      if (
        emitter.listeners('exit').length === 0 &&
        emitter.listeners('afterexit').length === 0
      ) {
        unload()
      }
    }
    emitter.on(ev, cb)

    return remove
  }

  var unload = function unload() {
    if (!loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = false

    signals.forEach(function (sig) {
      try {
        process$1.removeListener(sig, sigListeners[sig])
      } catch (er) {}
    })
    process$1.emit = originalProcessEmit
    process$1.reallyExit = originalProcessReallyExit
    emitter.count -= 1
  }
  signalExitExports.unload = unload

  var emit = function emit(event, code, signal) {
    /* istanbul ignore if */
    if (emitter.emitted[event]) {
      return
    }
    emitter.emitted[event] = true
    emitter.emit(event, code, signal)
  }

  // { <signal>: <listener fn>, ... }
  var sigListeners = {}
  signals.forEach(function (sig) {
    sigListeners[sig] = function listener() {
      /* istanbul ignore if */
      if (!processOk(commonjsGlobal.process)) {
        return
      }
      // If there are no other listeners, an exit is coming!
      // Simplest way: remove us and then re-send the signal.
      // We know that this will kill the process, so we can
      // safely emit now.
      var listeners = process$1.listeners(sig)
      if (listeners.length === emitter.count) {
        unload()
        emit('exit', null, sig)
        /* istanbul ignore next */
        emit('afterexit', null, sig)
        /* istanbul ignore next */
        if (isWin && sig === 'SIGHUP') {
          // "SIGHUP" throws an `ENOSYS` error on Windows,
          // so use a supported signal instead
          sig = 'SIGINT'
        }
        /* istanbul ignore next */
        process$1.kill(process$1.pid, sig)
      }
    }
  })

  signalExitExports.signals = function () {
    return signals
  }

  var loaded = false

  var load = function load() {
    if (loaded || !processOk(commonjsGlobal.process)) {
      return
    }
    loaded = true

    // This is the number of onSignalExit's that are in play.
    // It's important so that we can count the correct number of
    // listeners on signals, and don't wait for the other one to
    // handle it instead of us.
    emitter.count += 1

    signals = signals.filter(function (sig) {
      try {
        process$1.on(sig, sigListeners[sig])
        return true
      } catch (er) {
        return false
      }
    })

    process$1.emit = processEmit
    process$1.reallyExit = processReallyExit
  }
  signalExitExports.load = load

  var originalProcessReallyExit = process$1.reallyExit
  var processReallyExit = function processReallyExit(code) {
    /* istanbul ignore if */
    if (!processOk(commonjsGlobal.process)) {
      return
    }
    process$1.exitCode = code || /* istanbul ignore next */ 0
    emit('exit', process$1.exitCode, null)
    /* istanbul ignore next */
    emit('afterexit', process$1.exitCode, null)
    /* istanbul ignore next */
    originalProcessReallyExit.call(process$1, process$1.exitCode)
  }

  var originalProcessEmit = process$1.emit
  var processEmit = function processEmit(ev, arg) {
    if (ev === 'exit' && processOk(commonjsGlobal.process)) {
      /* istanbul ignore else */
      if (arg !== undefined) {
        process$1.exitCode = arg
      }
      var ret = originalProcessEmit.apply(this, arguments)
      /* istanbul ignore next */
      emit('exit', process$1.exitCode, null)
      /* istanbul ignore next */
      emit('afterexit', process$1.exitCode, null)
      /* istanbul ignore next */
      return ret
    } else {
      return originalProcessEmit.apply(this, arguments)
    }
  }
}

function isStream(stream) {
  return (
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function'
  )
}

var getStreamExports = {}
var getStream$1 = {
  get exports() {
    return getStreamExports
  },
  set exports(v) {
    getStreamExports = v
  },
}

const { PassThrough: PassThroughStream } = require$$0$6

var bufferStream$1 = (options) => {
  options = { ...options }

  const { array } = options
  let { encoding } = options
  const isBuffer = encoding === 'buffer'
  let objectMode = false

  if (array) {
    objectMode = !(encoding || isBuffer)
  } else {
    encoding = encoding || 'utf8'
  }

  if (isBuffer) {
    encoding = null
  }

  const stream = new PassThroughStream({ objectMode })

  if (encoding) {
    stream.setEncoding(encoding)
  }

  let length = 0
  const chunks = []

  stream.on('data', (chunk) => {
    chunks.push(chunk)

    if (objectMode) {
      length = chunks.length
    } else {
      length += chunk.length
    }
  })

  stream.getBufferedValue = () => {
    if (array) {
      return chunks
    }

    return isBuffer ? Buffer.concat(chunks, length) : chunks.join('')
  }

  stream.getBufferedLength = () => length

  return stream
}

const { constants: BufferConstants } = require$$0$7
const stream = require$$0$6
const { promisify } = require$$2$1
const bufferStream = bufferStream$1

const streamPipelinePromisified = promisify(stream.pipeline)

class MaxBufferError extends Error {
  constructor() {
    super('maxBuffer exceeded')
    this.name = 'MaxBufferError'
  }
}

async function getStream(inputStream, options) {
  if (!inputStream) {
    throw new Error('Expected a stream')
  }

  options = {
    maxBuffer: Infinity,
    ...options,
  }

  const { maxBuffer } = options
  const stream = bufferStream(options)

  await new Promise((resolve, reject) => {
    const rejectPromise = (error) => {
      // Don't retrieve an oversized buffer.
      if (error && stream.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
        error.bufferedData = stream.getBufferedValue()
      }

      reject(error)
    }

    ;(async () => {
      try {
        await streamPipelinePromisified(inputStream, stream)
        resolve()
      } catch (error) {
        rejectPromise(error)
      }
    })()

    stream.on('data', () => {
      if (stream.getBufferedLength() > maxBuffer) {
        rejectPromise(new MaxBufferError())
      }
    })
  })

  return stream.getBufferedValue()
}

getStream$1.exports = getStream
getStreamExports.buffer = (stream, options) =>
  getStream(stream, { ...options, encoding: 'buffer' })
getStreamExports.array = (stream, options) =>
  getStream(stream, { ...options, array: true })
getStreamExports.MaxBufferError = MaxBufferError

const validateInputSync = ({ input }) => {
  if (isStream(input)) {
    throw new TypeError('The `input` option cannot be a stream in sync mode')
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
const nativePromisePrototype = (async () => {})().constructor.prototype

;['then', 'catch', 'finally'].map((property) => [
  property,
  Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property),
])

const normalizeArgs = (file, args = []) => {
  if (!Array.isArray(args)) {
    return [file]
  }

  return [file, ...args]
}

const NO_ESCAPE_REGEXP = /^[\w.-]+$/
const DOUBLE_QUOTES_REGEXP = /"/g

const escapeArg = (arg) => {
  if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
    return arg
  }

  return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`
}

const joinCommand = (file, args) => normalizeArgs(file, args).join(' ')

const getEscapedCommand = (file, args) =>
  normalizeArgs(file, args)
    .map((arg) => escapeArg(arg))
    .join(' ')

const SPACES_REGEXP = / +/g

// Handle `execaCommand()`
const parseCommand = (command) => {
  const tokens = []
  for (const token of command.trim().split(SPACES_REGEXP)) {
    // Allow spaces to be escaped by a backslash if not meant as a delimiter
    const previousToken = tokens[tokens.length - 1]
    if (previousToken && previousToken.endsWith('\\')) {
      // Merge previous token with current one
      tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`
    } else {
      tokens.push(token)
    }
  }

  return tokens
}

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100

const getEnv = ({
  env: envOption,
  extendEnv,
  preferLocal,
  localDir,
  execPath,
}) => {
  const env = extendEnv ? { ...process$2.env, ...envOption } : envOption

  if (preferLocal) {
    return npmRunPathEnv({ env, cwd: localDir, execPath })
  }

  return env
}

const handleArguments = (file, args, options = {}) => {
  const parsed = crossSpawnExports._parse(file, args, options)
  file = parsed.command
  args = parsed.args
  options = parsed.options

  options = {
    maxBuffer: DEFAULT_MAX_BUFFER,
    buffer: true,
    stripFinalNewline: true,
    extendEnv: true,
    preferLocal: false,
    localDir: options.cwd || process$2.cwd(),
    execPath: process$2.execPath,
    encoding: 'utf8',
    reject: true,
    cleanup: true,
    all: false,
    windowsHide: true,
    ...options,
  }

  options.env = getEnv(options)

  options.stdio = normalizeStdio(options)

  if (
    process$2.platform === 'win32' &&
    path$3.basename(file, '.exe') === 'cmd'
  ) {
    // #116
    args.unshift('/q')
  }

  return { file, args, options, parsed }
}

const handleOutput = (options, value, error) => {
  if (typeof value !== 'string' && !node_buffer.Buffer.isBuffer(value)) {
    // When `execaSync()` errors, we normalize it to '' to mimic `execa()`
    return error === undefined ? undefined : ''
  }

  if (options.stripFinalNewline) {
    return stripFinalNewline(value)
  }

  return value
}

function execaSync(file, args, options) {
  const parsed = handleArguments(file, args, options)
  const command = joinCommand(file, args)
  const escapedCommand = getEscapedCommand(file, args)

  validateInputSync(parsed.options)

  let result
  try {
    result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options)
  } catch (error) {
    throw makeError({
      error,
      stdout: '',
      stderr: '',
      all: '',
      command,
      escapedCommand,
      parsed,
      timedOut: false,
      isCanceled: false,
      killed: false,
    })
  }

  const stdout = handleOutput(parsed.options, result.stdout, result.error)
  const stderr = handleOutput(parsed.options, result.stderr, result.error)

  if (result.error || result.status !== 0 || result.signal !== null) {
    const error = makeError({
      stdout,
      stderr,
      error: result.error,
      signal: result.signal,
      exitCode: result.status,
      command,
      escapedCommand,
      parsed,
      timedOut: result.error && result.error.code === 'ETIMEDOUT',
      isCanceled: false,
      killed: result.signal !== null,
    })

    if (!parsed.options.reject) {
      return error
    }

    throw error
  }

  return {
    command,
    escapedCommand,
    exitCode: 0,
    stdout,
    stderr,
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false,
  }
}

function execaCommandSync(command, options) {
  const [file, ...args] = parseCommand(command)
  return execaSync(file, args, options)
}

const cfgPath = path$3.join(__dirname, './cfg.json')
const getCfg = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    const initCmdMap = JSON.parse(node_fs.readFileSync(cfgPath).toString())
    return initCmdMap
  })
const setCfg = (initCmdMap, newItem) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const newMap = Object.assign(Object.assign({}, initCmdMap), newItem)
    node_fs.writeFileSync(cfgPath, JSON.stringify(newMap, null, 2), {})
  })
const cli = cac('fe-weki')
cli
  .command('[appName]', 'init')
  .alias('init')
  .action((appName, options) =>
    __awaiter(void 0, void 0, void 0, function* () {
      const initCmdMap = yield getCfg()
      const choices = Object.entries(initCmdMap).map(([title, value]) => {
        return { title, value }
      })
      const FRAMEWORK = [
        {
          type: 'select',
          name: 'init',
          message: 'select your framework',
          choices,
        },
      ]
      const answers = yield prompts(FRAMEWORK)
      const { init } = answers
      execaCommandSync(`${init} ${appName || ''}`, {
        stdio: 'inherit',
      })
    }),
  )
cli
  .command('add [framework]', 'add a new framework')
  .option('--init [init]', 'the init cmd')
  .action((framework, options) =>
    __awaiter(void 0, void 0, void 0, function* () {
      const { init } = options
      if (!framework) {
        console.log(`\n❌${picocolorsExports.red('[framework] is necessary!')}`)
        return
      }
      if (!init) {
        console.log(`\n❌${picocolorsExports.red('[init] is necessary!')}`)
        return
      }
      const initCmdMap = yield getCfg()
      const curPkg = initCmdMap[framework]
      if (curPkg) {
        if (curPkg.trim() === init.trim()) {
          console.log(`\n${picocolorsExports.green('Done')}✅`)
          return
        }
        const { yes } = yield prompts([
          {
            type: 'confirm',
            name: 'yes',
            message: `replace ${picocolorsExports.green(
              framework,
            )}'s init command from ${picocolorsExports.yellow(
              curPkg,
            )} to ${picocolorsExports.green(init)}`,
          },
        ])
        if (!yes) return
      }
      setCfg(initCmdMap, { [framework]: init })
      console.log(`\n${picocolorsExports.green('Done')}✅`)
    }),
  )
cli.help()
cli.version('0.0.1')
cli.parse()
