
#ARDock server implementation


	git clone https://github.com/glaunay/ardock.git
	npm install

Check the config file $scripts/package.json$ for correct path and r/w permissions





##Tests
####1. Basic pdb parsing
Test with the default input PDB file (_./scripts/test/4MOW.pdb_)

	$node index.js --conf scripts/package.json --pdb --test  
Specify a valid pdb file
	
	$node index.js --conf scripts/package.json --pdb -f scripts/test/1BRS.pdb
	
####2. Computing engine
The slurm and local implementations require **netcat (nc command) to be installed**
 
#####2.1 Local machine (multi-threaded) implementation
		
	$node index.js --conf scripts/package.json --pdb -p 3 --local --test --slurm

Use the `--test` flag to mimic a docking computation on the pdb file _scripts/test/4MOW_D.pdb_




#####2.2 Cluster of machines implementation (SLURM only)
Perform a 10 probes surface sampling of the 1BRS.pdb A,B dimer
	
	$node index.js --conf ./scripts/package.json --pdb -f ./scripts/test/1BRS.pdb -c A,B --slurm -p 10
	

####3. Running the HTTP server


#####3.1 Start the HTTP server on test mode
`$node index.js --conf ./scripts/package.json --test --http`

See result at http://ardock.ibcp.fr/test
Node server listens on port 3000 

#####3.2 HTTP Server with supports for Interactive web-client and REST interfaces

	node index.js --conf ./scripts/package.json --http --slurm --rest -p 3
 
######3.2.1 REST API specifications
Using the REST interface to trigger the download of a structure and process it.
Results will be displayed as an annotated protein structure file

eg: http://ardock.ibcp.fr/rest?pdbCode=1BRS&chains=A,B

*  pdbCode is valid [PDB](www.rcsb.org) identifier (mandatory)
* chains is a list of chain identifiers separated by coma (optional, by default all valid chains are processed)

######3.2.2 Web-client specifications

IO Duplex connection communication protocol
	
Usage

Build the client code
>$browserify -t browserify-css app.js -o js/bundleTest.js




