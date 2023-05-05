#!/usr/bin/env node --es-module-specifier-resolution=node

import path from 'path'
import psList from 'ps-list';
import {execute, delay, joinArgs} from './functions'
import commandLineArgs from 'command-line-args'

const argDefinitions = [
	{ name: 'app', type: String, defaultOption: true },
	{ name: 'dry-run', type: Boolean },
	{ name: 'override-exe', alias: 'e', type: String },
]
const args = commandLineArgs(argDefinitions,{stopAtFirstUnknown: true})


const DEBUG_MODE = args["dry-run"]
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
						return Promise.reject('Failed to launch the game :(')
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
		const exeName = overrideExeArg || game.executable
		return (
			execute(`legendary launch ${joinArgs(process.argv.slice(2))}`,{verbose: true, debug: DEBUG_MODE})
			.then(()=>DEBUG_MODE ? Promise.resolve() : waitForProcess(path.basename(exeName)))
		)
	} else {
		return Promise.reject(`${epicName} can't be found, or isn't installed...`)
	}
})
.catch(err=>{
	console.error(err)
	return (
		new Promise((resolve,reject)=>setTimeout(resolve,5000))
		.then(()=>process.exit(1))
	)
})
