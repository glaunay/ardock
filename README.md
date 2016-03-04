ARDOCK server implementation


Installation
netcat (nc command) is required

Download ZIP from https://github.com/glaunay/ardock
unzip
npm install

Check the config file './scripts/package.json' for correct path and r/w permissions

# Run a test on any machine, slurm engine is emulated w/ fork on local system
nnode index.js --conf ./scripts/package.json --http --slurm -p 3 --local

