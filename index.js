import path from 'path'
import {exec} from 'child_process'
import psList from 'ps-list';

export const execute = (command='cd',options={}) => new Promise((resolve,reject)=>{
	const {verbose, logCommand, debug, ...otherOptions} = options
	if(debug || logCommand){
		options.cwd ? console.log(`[${options.cwd}]: ${command}`) : console.log(command)
		resolve(command)
	}
	if(!debug) {
		const e = exec(command,otherOptions,(err,stdo)=>err ? reject(err) : resolve(stdo))
		verbose && e.stdout.on('data',txt=>console.log(txt))
		verbose && e.stderr.on('data',txt=>console.error(txt))
	}
	
})

const delay = (time) => new Promise(resolve=>setTimeout(resolve,time))

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

const epicName = 'Kinglet'

const overrideExe = path.resolve('D:/Program Files/Epic Games/SidMeiersCivilizationVI/Base/Binaries/Win64EOS/CivilizationVI_DX12.exe')

execute(`legendary list-installed --json`)
.then(res=>{
	const installed_games = JSON.parse(res)
	const game = installed_games.find(game=>game.app_name === epicName)
	if(game){
		console.log(game)
		let executableName = path.basename(game.executable)
		const overrideCommand = overrideExe ? `--override-exe "${overrideExe}"` : ''
		return (
			execute(`legendary launch ${overrideCommand} ${epicName}`,{verbose: true, debug: true})
			.then(()=>waitForProcess(overrideExe ? path.basename(overrideExe) : executableName))
		)
	} else {
		const message = `${epicName} can't be found, or isn't installed...`
		console.log(message)
		return Promise.reject(message)
	}
})

// launch --override-exe "D:\Program Files\Epic Games\SidMeiersCivilizationVI\Base\Binaries\Win64EOS\CivilizationVI_DX12.exe" Kinglet