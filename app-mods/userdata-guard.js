/* Self-heal: the ThingEdu build's network service sometimes replaces the
 * userData DIRECTORY with a stray HSTS state FILE, which silently breaks the
 * next launch (ElectronStore mkdir EEXIST, window never created).
 * Run before anything touches userData: if the path is a file, remove it. */
try {
    const fs = require('fs');
    const {app} = require('electron');
    const ud = app.getPath('userData');
    if (fs.existsSync(ud) && fs.statSync(ud).isFile()) {
        fs.unlinkSync(ud);
        fs.mkdirSync(ud, {recursive: true});
    }
} catch (e) { /* never block startup */ }
