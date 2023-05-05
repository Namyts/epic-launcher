#!/usr/bin/env node --es-module-specifier-resolution=node

import path from 'path'
import commandLineArgs from 'command-line-args'
import {close, delay, execute, findProcess, waitForProcess} from './functions.js'

const argDefinitions = [
	{ name: 'debug', type: Boolean },
	{ name: 'service', type: String, defaultOption: true },
	{ name: 'epic-game', type: String },
	{ name: 'epic-override-exe', type: String },
	{ name: 'epic-other-args', type: String },
	{ name: 'ea-game-exe', type: String }
]
const args = commandLineArgs(argDefinitions,{stopAtFirstUnknown: true})


const DEBUG_MODE = args["dry-run"]
const service = args["service"]
DEBUG_MODE && console.log(args)

switch(service){
	case "epic": {
		const epicName = args["epic-game"]
		const overrideExeArg = args["epic-override-exe"]
		
		if(!epicName){
			console.log('Add the epic games name as a command line argument')
			process.exit(1)
		}
		execute(`legendary list-installed --json`)
		.then(res=>{
			const installed_games = JSON.parse(res)
			const game = installed_games.find(game=>game.app_name === epicName)
			if(game){
				DEBUG_MODE && console.log(game)
				const exeName = overrideExeArg || game.executable
				return (
					execute(`legendary launch ${epicName} ${overrideExeArg?`--override-exe ${overrideExeArg}`:''}`,{verbose: true, debug: DEBUG_MODE})
					.then(()=>DEBUG_MODE ? Promise.resolve() : waitForProcess(path.basename(exeName)))
				)
			} else {
				return Promise.reject(`${epicName} can't be found, or isn't installed...`)
			}
		})
		.catch(err=>close(err))
		break;
	}
	case "ea": {
		const eaLauncher = "EADesktop.exe"
		const exeName = args["ea-game-exe"]
		const closeEA = () => {
			return (
				findProcess(eaLauncher)
				.then(foundProcess=>{
					if(foundProcess){
						const eaLauncherPID = foundProcess.pid
						console.log(`Killing ${eaLauncher}`)
						return execute(`taskkill /PID ${eaLauncherPID}`)
					} else {
						return close("EA app was not found, or failed to be killed")
					}
				})
			)
		}
		console.log(`Keep this window open while playing ${exeName}, it will auto close, and kill EA App`)
		try{
			execute(`${exeName.replaceAll("\\\\","\\")}`,{verbose: true, debug: DEBUG_MODE})
			.catch(e=>console.log('Minor error when launching... attempting to continue...'))
		}catch(e){
			console.log('Dodging a sneaky error')
		}
		delay(5000)
		.then(()=>DEBUG_MODE ? Promise.resolve() : waitForProcess(path.basename(exeName), {onClose: closeEA}))
		break;
	}
	default: {
		close("No service has been selected...")
		break;
	}
}
