#!/usr/bin/env node --es-module-specifier-resolution=node

import path from 'path'
import psList from 'ps-list';
import {execute, delay} from './functions'
import commandLineArgs from 'command-line-args'

// example commands:
// npm start -- Kinglet
// npm start -- Kinglet --override-exe Base/Binaries/Win64EOS/CivilizationVI_DX12.exe
// --override-exe must be relative to the install directory

const argDefinitions = [
	{ name: 'app', type: String, defaultOption: true },
	{ name: 'debug', alias: 'd', type: Boolean },
	{ name: 'override-exe', alias: 'e', type: String },
]
const args = commandLineArgs(argDefinitions,{stopAtFirstUnknown: true})


const DEBUG_MODE = args.debug
const epicName = args.app
const overrideExeArg = args["override-exe"]

DEBUG_MODE && console.log(args)

if(!epicName){
	console.log('Add the epic games name as a command line argument')
	process.exit(1)
}

let startTime = new Date()
let initialWait = 120
let initialPollTime = 5
let runningPollTime = 10
let runningProcess = null

const waitForProcess = (name) => {
	const message = runningProcess ? `[Checking]: ${name}` : `[Searching]: ${name}`
	console.log(message)
	return (
		psList()
		.then(processes=>{
			const foundProcess = processes.find(p=>p.name === name)
			if(foundProcess){
				if(!runningProcess){ 
					console.log('The game has been detected!')
					runningProcess = foundProcess	
				}
				return (
					delay(runningPollTime*1000)
					.then(()=>waitForProcess(name))
				)
			} else {
				if(runningProcess){
					console.log('The game has been closed!')
					process.exit()
				} else {
					if((new Date())-startTime > initialWait*1000){
						const message = 'Failed to launch the game :('
						console.error(message)
						return Promise.reject(message)
					} else {
						return (
							delay(initialPollTime*1000)
							.then(()=>waitForProcess(name))
						)
					}
				}
			}
			
		})
	)
}

execute(`legendary list-installed --json`)
.then(res=>{
	const installed_games = JSON.parse(res)
	const game = installed_games.find(game=>game.app_name === epicName)
	if(game){
		DEBUG_MODE && console.log(game)
		let overrideCommand = ''
		let overrideExe = ''
		if(overrideExeArg){
			overrideExe = path.resolve(game.install_path,overrideExeArg)
			overrideCommand = `--override-exe "${overrideExe}"`
		}
		return (
			execute(`legendary launch ${overrideCommand} ${epicName}`,{verbose: true, debug: DEBUG_MODE})
			.then(()=>waitForProcess(overrideExe ? path.basename(overrideExe) : path.basename(game.executable)))
		)
	} else {
		const message = `${epicName} can't be found, or isn't installed...`
		console.log(message)
		return Promise.reject(message)
	}
})
