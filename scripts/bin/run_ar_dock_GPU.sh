#!/bin/bash
#SBATCH -n 1 # Number of cores
#SBATCH -N 1 # Ensure that all cores are on one machine
#SBATCH -t 0-01:11 # Runtime in D-HH:MM
#SBATCH -p gpu-mobi # Partition to submit to
#SBATCH --qos gpu-mobi # Partition to submit to
#SBATCH --gres=gpu:1
##SBATCH -o hex.out # File to which STDOUT will be written
##SBATCH -e hex.err # File to which STDERR will be written

module load cuda/5.0
module load hex
module load naccess
module load pymol/current

echo "exported variables"
echo $target
echo $list
echo $PROBE_DIR
echo $nb_hits_file
echo $residue_file

export HEX_FIRST_GPU=${CUDA_VISIBLE_DEVICES}
ldd /software/mobi/hex/8.0.0//exe/hex8.0.0-cuda.x64

cd $WORKDIR/

# input: $target, $list, $PROBE_DIR, $OUTPUT_DIR
TARGET_NAME=`basename ${target%%.pdb}`

echo "copy target structure"

# copy target structure
if (! cp $target ./$TARGET_NAME.pdb)
    then
    exit
fi

# compute accessibility
naccess $TARGET_NAME.pdb

# iterate over arbitrary_partners
for probe in $(\cat $list)
  do
  date
  echo copy $probe

  receptor=$TARGET_NAME.pdb
  ligand=$probe.pdb

  # copy ligand
  if (! cp $PROBE_DIR/$ligand .  )
      then
      exit
  fi

  # create hex macro file
  echo "
open_receptor $receptor
open_ligand $ligand

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
save_range 1 10 ./  pose_ pdb
#save_matrix $receptor"\_"$ligand.matrix
exit" > input.mac

  #run docking

  echo run hex with $probe
  hex -nice 0 -noexec < input.mac >$receptor\_$ligand.log

  ls *.pdb 2 &> /dev/null
  if test $? -ne 0
	then
	echo no pose generated for probe $probe !
	fi
  # detect interface residues, based on accessibility

  echo post-treat docking poses
  # interate on poses
  for file in `ls pose_*.pdb`
  do
      echo treating $file
      naccess $file
      ls
      # size of the target accessibility file
      NB=`wc -l $TARGET_NAME.rsa  | cut -f1 -d" "`
      wc -l *.rsa
      # truncate pose accessibility file accordingly:
      echo "head -$NB ${file%%.pdb}.rsa > temp.rsa "
      head -$NB ${file%%.pdb}.rsa > temp.rsa
      # extract interface: residues with accessiblity change, i.e., differences in the accessibility file
      #head temp.rsa $TARGET_NAME.rsa
      diff temp.rsa  $TARGET_NAME.rsa  | grep "> RES"  | cut -c 11-16  >> interface_index.temp
      #cp interface_index.temp $SLURM_SUBMIT_DIR
      #cp $TARGET_NAME.rsa ${file%%.pdb}.rsa $SLURM_SUBMIT_DIR
  done

  # count residues
  echo "copying updated_result"
  cat interface_index.temp | sort | uniq -c | awk '{print substr($0,9,6)","substr($0,0,7)}' > nb_hits.data
  cp nb_hits.data  $SLURM_SUBMIT_DIR/$nb_hits_file
  cp interface_index.temp $SLURM_SUBMIT_DIR/$residue_file

  rm -f pose_*
  rm -f $probe.pdb
done


#echo "returning a PDB file with modified B-factors"

#echo "alter all, b=-1" > temp.pml
#cat nb_hits.data  | awk -F"," '{pos=$1;chain=substr(pos,0,1);ind=substr(pos,2,6);gsub(/ /,"",ind);gsub(/ /,"",chain); printf "alter ///%s/%s/,b=%f\n",chain,ind,$2}' >> temp.pml
#echo save colored_structure.pdb  >> temp.pml
#echo quit >> temp.pml
#pymol  -c -q $TARGET_NAME.pdb temp.pml

#cp colored_structure.pdb $SLURM_SUBMIT_DIR

echo "end of job"

