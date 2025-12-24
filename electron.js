const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        title: 'Trading Journal Assistant'
    });

    // Start backend server
    startBackend();

    // Wait for backend to start, then load frontend
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5000');
    }, 2000);

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (backendProcess) {
            backendProcess.kill();
        }
    });
}

function startBackend() {
    const isWindows = process.platform === 'win32';
    const backendPath = path.join(__dirname, 'backend', 'server.js');

    backendProcess = spawn('node', [backendPath], {
        cwd: path.join(__dirname, 'backend'),
        env: { ...process.env, PORT: '5000' }
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
