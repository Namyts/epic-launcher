# Epic Games Launcher 
...that stays open while the game is open

## What
Given an epic games app name eg: Kinglet (Civ 6)
- Uses the legendary command line tool to check if the game is installed
- Launches the game
- Waits for the process to appear
- Periodically checks to see if the game is running
- Closes when the game closes

## Why
- Legendary command line exits after the game launch is initiated. This means that adding the game to Steam shows you playing the game for approximately 10 seconds
- This tool remains open for as long as the game does

## How to install
- Download this repo
- ```npm install```
- ```npm link```
- DONE!

## Example commands
- ```epic-launcher Kinglet``` - This is the most standard use-case
- ```epic-launcher --override-exe "D:\Program Files\Epic Games\SidMeiersCivilizationVI\Base\Binaries\Win64EOS\CivilizationVI_DX12.exe" Kinglet``` - I prefer to override the exe for Civ 6 to avoid the 2K launcher

