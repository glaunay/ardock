#!/bin/bash

# already loaded in the sbatch script
# - module load naccess

# required variables :
# - targetPdbFile

cmd="naccess $targetPdbFile"
# run
$cmd > /dev/null

fileName=`basename $targetPdbFile | perl -pe 's/\.pdb$//'`
rsaFile=$fileName".rsa"
cp $WORKDIR/$rsaFile ./

# parse & get results
echo `echo "{\"listRES\" : [" ;grep "^RES" $rsaFile | awk '{print "[\"" $2 "\",\"" $3 "\"," $4 "," $5 "],"}' | head --bytes -2; echo "]}"`


