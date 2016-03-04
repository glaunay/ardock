#!/bin/bash


# This script is used to emulate a ardock job, when server is run w/ '--local' flag.
# It pick at random one the of precomputed file of ardock over the 4MOW_D.pdb structure

sleep 5

MAX=`ls ${residueHitsDir}/residue*.txt | wc -l`

n=$(( ( RANDOM % $MAX )  + 1 ))

fTest="$residueHitsDir/residue$n.txt"

## inliner perl to produce json file out of raw count
cat $fTest | perl -ne 'BEGIN {print "{ \"rawCounts\":[\n"; $all =[] } @tmp = $_ =~ /^(.)(.{4})(.)$/g;$tmp[2] = $tmp[2] eq " " ? "null" : "\"$tmp[2]\"";  push @{$all}, "{\"chain\" : \"" . $tmp[0] . "\" , \"resSeq\" : \"" . $tmp[1] . "\" , \"AChar\" : " . $tmp[2] . "}"; END{ print join(",", @{$all}) . "\n]}\n"}'

return;
