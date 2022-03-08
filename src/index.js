import path from 'path'
import psList from 'ps-list';
import {execute, delay} from './functions'

// example commands:
// npm start -- Kinglet
// npm start -- --override-exe Base/Binaries/Win64EOS/CivilizationVI_DX12.exe Kinglet
// --override-exe must be relative to the install directory

const DEBUG_MODE = true

const args = process.argv.slice(2)
const options = args.slice(0,-1).join(' ')
const epicName = args[args.length-1]

DEBUG_MODE && console.log(epicName)
DEBUG_MODE && console.log(options)

let overrideExeArg = ''
if(options.includes('--override-exe')){
	const oSplit = options.split(' ')
	const overrideIndex = oSplit.indexOf('--override-exe')
	overrideExeArg = oSplit[overrideIndex+1]
}

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
		let executableName = path.basename(game.executable)
		let overrideCommand = ''
		let overrideExe = ''
		if(overrideExeArg){
			overrideExe = path.resolve(game.install_path,overrideExeArg)
			overrideCommand = `--override-exe "${overrideExe}"`
		}
		return (
			execute(`legendary launch ${overrideCommand} ${epicName}`,{verbose: true, debug: DEBUG_MODE})
			.then(()=>waitForProcess(overrideExe ? path.basename(overrideExe) : executableName))
		)
	} else {
		const message = `${epicName} can't be found, or isn't installed...`
		console.log(message)
		return Promise.reject(message)
	}
})
