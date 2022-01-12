

const nconf = require('nconf');
const path = require("path");
const {NodeSSH} = require('node-ssh');
nconf.argv().file('deploy/config.json');

if (!process.cwd().endsWith('Chochbuech'))
    throw new Error('Invalid working directory: ' + process.cwd());

deployToFabiansServer().then(() => process.exit(0)).catch(() => process.exit(1));

async function deployToFabiansServer() {
    console.log("Deploying to Fabian's Server... (this may take 30s)");
    try {
        const remote = await new NodeSSH().connect({
            host: nconf.get('fabiansserverUrl'),
            username: nconf.get('fabiansserverUser'),
            privateKey: nconf.get('fabiansserverKeyPath'),
        });

        const prodDir = nconf.get('fabiansserverProdDir')
        const prodDeployDir = `${prodDir}app/`

        try {
            await remote.exec(`cd ${prodDir}`, []);

            console.log('stopping server...');
            await remote.exec(`sudo systemctl stop chochbuech`, []);
            console.log('server stopped.');

            console.log('copy bundle to server...');
            if (await remote.exec(`[ -d ${prodDeployDir} ] && echo exists`, [])) {
                await remote.exec(`mv ${prodDeployDir} ${prodDir}app_old/`, []);
            }

            const projDir = path.resolve(process.cwd(), './');
            const copySuccessful = await remote.putDirectory(projDir, prodDeployDir,
                {recursive: true, concurrency: 10, validate: fileFilter});

            if (copySuccessful) {
                console.log('bundle copied successfully.');
                if (await remote.exec(`[ -d ${prodDir}app_old ] && echo exists`, [])) {
                    await remote.exec(`rm -rf ${prodDir}app_old/`, []);
                }

                console.log('installing node modules...');
                try {
                    await remote.exec(`npm install --production --silent`, [], {cwd: prodDeployDir});
                } catch (e) {
                    if (!e.message.split('\n').every(line => line.startsWith("npm notice"))) {
                        console.log("Unable to install node modules:\n" + e.message);
                        return;
                    }
                }
                console.log('node modules installed.');
            } else {
                console.log('copy bundle failed. Undoing changes...');
                if (await remote.exec(`[ -d ${prodDir}app_old ] && echo exists`, [])) {
                    await remote.exec(`rm -rf ${prodDeployDir}`, []);
                    await remote.exec(`mv ${prodDir}app_old/ ${prodDeployDir}`, []);
                }
            }

            console.log('starting server...');
            await remote.exec(`sudo systemctl start chochbuech`, []);
            console.log('server started.');

            console.log(`Successfully deployed Chochbuech to Fabian's Server.`);
        } catch (e) {
            console.log("Failed deployment to Fabian's Server:\n" + e.message);
        } finally {
            remote.dispose();
        }
    } catch (e) {
        console.log("Unable to connect to server:\n" + e.message);
    }
}

const FORBIDDEN_PATHS = ['\\deploy', '\\docs', '\\node_modules', '\\.git', '\\.idea', '\\.gitignore'];
function fileFilter(file) {
    return FORBIDDEN_PATHS.every(path => file.indexOf(path) == -1);
}
