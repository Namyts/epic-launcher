import {exec} from 'child_process'
import psList from 'ps-list';

export const joinArgs = (args) => {
	const quoteArgs = args.map(a=>a.includes(" ") ? `"${a}"` : a)
	return quoteArgs.join(' ')
}

export const execute = (command='cd',options={}) => new Promise((resolve,reject)=>{
	const {verbose, logCommand, debug, ...rest} = options
	const otherOptions = {windowsHide: true,...rest}
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

export const delay = (time) => new Promise(resolve=>setTimeout(resolve,time))

export const close = err => {
	console.error(err)
	return (
		delay(5000)
		.then(()=>process.exit(1))
	)
}

let startTime = new Date()
let initialWait = 120
let initialPollTime = 5
let runningPollTime = 10
let runningProcess = null

export const findProcess = (name) => (
	psList()
	.then(processes=>processes.find(p=>p.name === name))
)

export const waitForProcess = (name,options={}) => {
	const {onClose} = options
	const message = runningProcess ? `[Checking]: ${name}` : `[Searching]: ${name}`
	console.log(message)
	return (
		findProcess(name)
		.then(foundProcess=>{
			if(foundProcess){
				if(!runningProcess){ 
					console.log('The game has been detected!')
					runningProcess = foundProcess	
				}
				return (
					delay(runningPollTime*1000)
					.then(()=>waitForProcess(name,options))
				)
			} else {
				if(runningProcess){
					console.log('The game has been closed!')
					runningProcess = null
					Promise.resolve(onClose ? onClose() : null)
					.then(()=>process.exit())
					.catch(err=>close(err))
				} else {
					if((new Date())-startTime > initialWait*1000){
						return Promise.reject('Failed to launch the game :(')
					} else {
						return (
							delay(initialPollTime*1000)
							.then(()=>waitForProcess(name,options))
						)
					}
				}
			}
			
		})
	)
}
