## This script main loop has to be rewritten in js

WORK_DIR=/home/jmartin/group/AR_DOCK_2016_01_28
DATA_DIR=$WORK_DIR/data
LISTE_PROBES=$DATA_DIR/list_25_compact_short_probes.txt
SRC_DIR=$WORK_DIR/src/

# read input parameters
export target=$PWD/$1
#export list=$LISTE_PROBES
export PROBE_DIR=$DATA_DIR
export OUTPUT_DIR=$PWD/$OUTPUT_DIR

i=1

for probe in `cat $LISTE_PROBES`
do
    echo $probe > list$i.temp
    export list=$PWD/list$i.temp
    export nb_hits_file=nb_hits$i.txt
    export residue_file=residue$i.txt
    sbatch $SRC_DIR/run_ar_dock_GPU.sh -export=target,list,PROBE_DIR,nb_hits_file, residue_file

    i=`expr $i + 1 `
done
