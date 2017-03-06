#!/bin/bash

# already loaded in the sbatch script
# - module load naccess

# required variables :
# - targetPdbFile

SOURCEDIR=`pwd`
cd $WORKDIR/

cmd="naccess $targetPdbFile"
# run
$cmd > /dev/null

fileName=`basename $targetPdbFile | perl -pe 's/\.pdb$//'`
rsaFile=$fileName".rsa"
cp $WORKDIR/$rsaFile $SOURCEDIR

# parse & get results
echo `echo "{\"listRES\" : [" ;grep "^RES" $rsaFile | awk 'BEGIN{FS="";OFS=""}{print "[\"" $5$6$7 "\",\"" $9 "\"," $10$11$12$13 "," $15$16$17$18$19$20$21$22 "],"}' | head --bytes -2; echo "]}"`


