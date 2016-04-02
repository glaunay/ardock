#!/usr/bin/bash


n=`ps aux | grep -c "node index\.js"`

if [ $1 = "--httpStart" ];then
    if (( $n > 0 ));then
        echo 'node http process already running'
        exit 0
    fi
    nohup node index.js --conf /data/www_dev/ardock/lib/scripts/package.json --http --slurm --rest -p 3 > ./httpServer.log &
    echo "Http server started"
elif [ "$1" = "--httpStop" ];then
    id=`ps aux | grep "node index\.js" | awk '{print $2}'`
    echo "Killing node process \"$id\""
    kill -9 $id
else
    echo "Unknown parameter \"$1\""
fi
exit 0
