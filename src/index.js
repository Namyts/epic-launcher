#!/usr/bin/env node --es-module-specifier-resolution=node

import path from 'path'
import commandLineArgs from 'command-line-args'
import {close, execute, joinArgs, waitForProcess} from './functions.js'

const argDefinitions = [
	{ name: 'debug', type: Boolean },
	{ name: 'service', type: String, defaultOption: true },
	{ name: 'epic-game', type: String },
	{ name: 'epic-override-exe', type: String },
	{ name: 'epic-other-args', type: String }
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
		break;
	}
	default: {
		close("No service has been selected...")
		break;
	}
}
