#!/bin/bash
echo "Input the root folder of the project to analyse:"
read rootdir
echo "Input the wanted JSONModels directory name:"
read dirname

# find all TypeScript files in give root folder
FILES=( $(find $rootdir -type f -name "*.ts") ) 

# Create the output directory
outdir="JSONModels/$dirname"
mkdir $outdir

# Loop over every file
for FILE in ${FILES[*]}
do
  echo File: $FILE

  # Extract file name
  filename="$(basename -- $FILE)"

  # Replace all dots by dashes
  outname="${filename//./-}.json"
  outfile="$outdir/$outname"
  echo Output File Path: $outfile

  # Command to parse the file with the TypeScript importer
  ts-node src/ts2famix-cli.ts -i $FILE -o $outfile

done