const io = require("socket.io-client");
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin,  output: process.stdout });

// write your code here
rl.question('Whats your name? ', (userInput) => {
    let socket = io.connect("http://localhost:3000");
    rl.on('line', (message) => {
        console.log(`Sending message: ${message}`);
        socket.emit('chat message', `${userInput} says ${message}`);
        rl.setPrompt('>');
        rl.prompt();
    });
    socket.on('connect', () => {
        console.log('Successfully connected to server');
        rl.setPrompt('>');
        rl.prompt();
    });
    socket.on('chat message', (msg) => {
        console.log(msg);
        rl.setPrompt('>');
        rl.prompt();
    });
    socket.on('disconnect', () => {
        console.log('Connection lost...');
        rl.setPrompt('>');
        rl.prompt();
    });  
})