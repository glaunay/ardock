#!/bin/bash

# already loaded in the sbatch script
# - module load cuda/5.0
# - module load hex
# - module load naccess

# required variables :
# - nProbe
# - targetPdbFile
# - probeDir

export HEX_GPUS=1
export HEX_FIRST_GPU=${CUDA_VISIBLE_DEVICES}

hexScript="/data/software/mobi/hex/8.0.0/exe/hex8.0.0-cuda.x64"

SOURCEDIR=`pwd`
cd $WORKDIR/
mkdir results logs inputs

cp $targetPdbFile ./
targetPdbFile=`basename $targetPdbFile`

# compute free-form accessibility
naccess $targetPdbFile > /dev/null
rsaFree=${targetPdbFile%%.pdb}".rsa"
grep "^RES" $rsaFree > ${targetPdbFile%%.pdb}"_trim.rsa"
rsaFree=${targetPdbFile%%.pdb}"_trim.rsa"

# hex computations
for probePdbFile in `ls $probeDir/*.pdb | head -$nProbe`
do
	probeTag=`basename $probePdbFile | perl -pe 's/\.pdb$//'`
	echo "
open_receptor $targetPdbFile
open_ligand $probePdbFile

docking_fft_device 1
docking_fft_type 1

molecular_axis 1
display_sidechain 0

receptor_range_angle 180
ligand_range_angle 180

docking_r12_range 40
docking_r12_step 0.75
docking_r12_substeps 2

max_docking_solutions 3000
max_docking_clusters 2000
docking_cluster_window 200
docking_cluster_threshold 9.0
docking_correlation 0

MOVING_THING 1
RANDOMISE_MOLECULE
MOVING_THING 0
RANDOMISE_MOLECULE
COMMIT_VIEW
MOVING_THING -1

activate_docking
save_range 1 10 ./results/ pose_$probeTag pdb
#save_matrix matrix.dat
exit" > inputs/$probeTag.mac

	 $hexScript -nice 0 -noexec < inputs/$probeTag.mac > logs/$probeTag.log &
done

# waiting for the end of all jobs
num=`jobs | wc -l`
while test $num -gt 0;
do
	sleep 5
	num=`jobs | wc -l`
	jobs > /dev/null
done

# post processing results
ls *.pdb > /dev/null
if test $? -ne 0
    then
    echo '{}' # empty results
else
	NB=`wc -l $rsaFree  | cut -f1 -d" "`
	touch interface_index.temp
	poseNum=0 # indispensable !!
	# for each result (each 10 poses of each probes)
    for file in `ls $WORKDIR/results/pose_*.pdb`
    do
    	((poseNum++))
    	tmpPdbFile=pose_$poseNum.pdb
    	tmpRsaFile=pose_$poseNum.rsa
    	cp $file $tmpPdbFile

    	tag=`basename $file | perl -pe 's/\.pdb//'`

    	cmd="naccess $tmpPdbFile";
        $cmd > /dev/null

        grep "^RES" $tmpRsaFile | head -$NB > $WORKDIR/temp.rsa
        diff temp.rsa $rsaFree | grep "> RES"  | cut -c 11-16  >> $WORKDIR/interface_index.temp
	done

	cp interface_index.temp $SOURCEDIR
	mkdir $SOURCEDIR/res/
	cp -r ./* $SOURCEDIR/res/
	cat $SOURCEDIR/interface_index.temp | perl -ne 'BEGIN {print "{ \"rawCounts\":[\n"; $all =[] } @tmp = $_ =~ /^(.)(.{4})(.)$/g;$tmp[2] = $tmp[2] eq " " ? "null" : "\"$tmp[2]\"";  push @{$all}, "{\"chain\" : \"" . $tmp[0] . "\" , \"resSeq\" : \"" . $tmp[1] . "\" , \"AChar\" : " . $tmp[2] . "}"; END{ print join(",", @{$all}) . "\n]}\n"}'
fi




