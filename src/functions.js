import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import {exec} from 'child_process'

export const getThisDir = () => path.resolve(dirname(fileURLToPath(import.meta.url)),'..')

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

export const delay = (time) => new Promise(resolve=>setTimeout(resolve,time))