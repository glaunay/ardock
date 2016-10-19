#!/bin/bash




#echo "exported variables"
#echo "target: " $target
#echo "probeNumber : " $probeNumber
#echo "residueHitsDir : " $residueHitsDir
#echo "PROBE_DIR : " $PROBE_DIR
#echo "sleepTime " : $sleepTime
sleep $sleepTime


fTest="$residueHitsDir/residue$probeNumber.txt"

## inliner perl to produce json file out of raw count
cat $fTest | perl -ne 'BEGIN {print "{ \"rawCounts\":[\n"; $all =[] } @tmp = $_ =~ /^(.)(.{4})(.)$/g;$tmp[2] = $tmp[2] eq " " ? "null" : "\"$tmp[2]\"";  push @{$all}, "{\"chain\" : \"" . $tmp[0] . "\" , \"resSeq\" : \"" . $tmp[1] . "\" , \"AChar\" : " . $tmp[2] . "}"; END{ print join(",", @{$all}) . "\n]}\n"}'

return;
