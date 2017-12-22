AUTHOR : MG
DATE OF LAST MODIFICATION : 2017.12.20

########################################
#####    ARDOCK PROD DEPLOYMENT    #####
########################################

1. In /data/www_prod/ardock/lib/ :

cd /data/www_prod/ardock/lib/
git clone https://github.com/glaunay/ardock.git current


2. Go into ./current/ directory :

cd current/
npm install


3. Modify the "serverDomain" variable in the file app.js : var serverDomain='http://ardock.ibcp.fr'


4. Use gulp :

gulp compile # must generate a "bundleTest.js" into ./js/
gulp compress # must minified the ./js/bundleTest.js (not necessary step)


5. Make sure the file /data/www_prod/ardock/lib/ardockConf.json exists and check its content :

less /data/www_prod/ardock/lib/ardockConf.json

-> "httpVar" paths adapted for prod (warning : "www" instead of "www_prod") & "domain" = "ardock.ibcp.fr"
-> "scriptVar" paths adapted for prod (note that "BIN_DIR" is not used anymore)


6. You can now restart the web service with :

touch /data/www_prod/ardock/bin/restart




########################################
/// ! \\\ REMARKS for 2017 december :
- before step 6 : npm install uuid
- bundleTest.js produced by the step 4 is not working well so I use the one of the dev with :
	cp /data/www_dev/ardock/lib/merge/js/bundleTest.js ./js/
########################################





########################################
#####           NOTES              #####
########################################

The command line to run the web service on prod is (file /data/www_prod/ardock/bin/start_node.sh) :

node /data/www/ardock/lib/current/index.js
	--conf /data/www/ardock/lib/current/node_modules/nslurm/config/arwen-prod_ardockConf.json
	--set /data/www/ardock/lib/ardockConf.json
	--http
	--slurm
	-p 25
	-d /data/prod/ardock/tmp/persistantNslurmCache_prod
	>> /data/www/ardock/log/nodejs_std.log
	2>> /data/www/ardock/log/nodejs_err.log
	&


Log files are in /data/www_prod/ardock/log/ : 
	- errors : /data/www_prod/ardock/log/nodejs_err.log
	- logs : /data/www_prod/ardock/log/nodejs_std.log