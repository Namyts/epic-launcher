#!/usr/bin/env node --es-module-specifier-resolution=node
import {execute, getThisDir} from './functions'

const command = process.argv.slice(2).join(' ')
const thisFileDirectory = getThisDir()

execute(`npm start -- "${command}"`,{verbose: true, cwd: thisFileDirectory})