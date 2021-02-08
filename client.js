const io = require("socket.io-client");
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin,  output: process.stdout });

rl.question('Whats your name? ', (name) => {
    let socket = io.connect("http://localhost:3000");
    socket.on('connect', () => {
        console.log('Successfully connected to server');
        startGame();
    });
    socket.on('disconnect', () => {
        console.log('Connection lost...');
        rl.prompt();
    }); 
    socket.on('game result', ([result, leaderBoard]) => {
        console.log(result);
        console.log("------ LeaderBoard ------");
        leaderBoard = (Object.fromEntries(Object.entries(leaderBoard).sort(([,user1Result],[,user2Result]) => {
            return user2Result.points === user1Result.points ? [user1Result.wins + user1Result.losses + user1Result.draw]- [user2Result.wins + user2Result.losses + user2Result.draw] : user2Result.points - user1Result.points;
        })));
        for(let i in leaderBoard){
            console.log(`${i}: ${leaderBoard[i].points} points (${leaderBoard[i].wins} wins, ${leaderBoard[i].losses} losses, ${leaderBoard[i].draw} draws)`);
        }
        console.log("-------------------------");
        startGame(); 
    })
    function startGame(){
        rl.question('(R)ock, (P)aper or (S)cissors? ', (ans) => {
            if(!['r','s','p'].includes(ans.toLowerCase())) {
                console.log('Please choose a valid input');
                return startGame();
            }
            let fullForm = { 'r': 'Rock', 'p': 'Paper', 's': 'Scissor'};
            console.log(`You chose ${fullForm[ans.toLowerCase()]}`);
            const  clientTimestamp = Date.now();
            console.log(`Waiting for response`);
            let user = {
                "choice" : `${ans}`,
                "playedWith": "",
                "result" : "",
                "userName" : `${name}`,
                "createdAt" : `${clientTimestamp}`
            }
            socket.emit('user played', user);
        })   
    }
})