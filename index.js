let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
const MongoClient = require('mongodb').MongoClient;
const connectionString = "mongodb+srv://nithya:TA44MttQgrGMrU0Q@cluster0.uqtl3.mongodb.net/rock_paper_scissor?retryWrites=true&w=majority";

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('user played', (userInput) => {
        userInput.socketID = socket.id;
        MongoClient.connect(connectionString, {useUnifiedTopology: true}, (err, client) => {
            if (err) return console.error(err);
            console.log('Connected to Database');
            const dbo = client.db("rock_paper_scissor");
            const timeSort = { createdAt: -1 };
            dbo.collection("roundInfo").find().sort(timeSort).limit(1).toArray(function(err, lastRecord) {
                if(err) throw err;
                lastRecord = lastRecord[0];
                if(lastRecord && lastRecord.playedWith == ""){ //To check if the last record is waiting for response
                    lastRecord.playedWith = userInput.userName;
                    userInput.playedWith = lastRecord.userName;
                    if(userInput.choice.toLowerCase() === lastRecord.choice.toLowerCase()){
                        lastRecord.result = 'Draw';
                        userInput.result = 'Draw';
                    }else {
                        function currentUserWins(){
                            lastRecord.result = 'Lost';
                            userInput.result = 'Won';
                        }
                        function prevUserWins(){
                            lastRecord.result = 'Won';
                            userInput.result = 'Lost';
                        }
                        switch(userInput.choice.toLowerCase()){
                            case 'p': if(lastRecord.choice.toLowerCase() === 's') prevUserWins()
                                        else currentUserWins(); 
                                      break;                                 
                            case 's': if(lastRecord.choice.toLowerCase() === 'r') prevUserWins()
                                        else currentUserWins();
                                      break;
                            case 'r': if(lastRecord.choice.toLowerCase() === 'p') prevUserWins(); 
                                        else currentUserWins(); 
                                      break;
                        }
                    }
                let myquery = { _id: lastRecord._id };
                let newvalues = { $set: lastRecord };
                dbo.collection("roundInfo").updateOne(myquery, newvalues, function(err, res) { //Update the lastrecord with the game result
                    if (err) throw err;
                    console.log("1 document updated");
                    dbo.collection("roundInfo").find().toArray((err, result) => {
                        if (err) throw err;
                        let leaderBoard = {};
                        result.forEach((round) => {
                            if(leaderBoard[round.userName]){
                                if(round.result === "Won"){
                                    leaderBoard[round.userName].wins++;
                                }else if (round.result === "Lost"){
                                    leaderBoard[round.userName].losses++; 
                                }else {
                                    leaderBoard[round.userName].draw++;
                                }
                            }else {
                                leaderBoard[round.userName] = {'wins' : 0, 'losses' : 0, 'draw' : 0 };
                                switch (round.result){
                                    case "Won" : leaderBoard[round.userName].wins++; break;
                                    case "Lost" : leaderBoard[round.userName].losses++; break;
                                    case "Draw" : leaderBoard[round.userName].draw++; break;
                                }
                            }
                        })
                        for(let i in leaderBoard){
                            leaderBoard[i].points = leaderBoard[i].wins - leaderBoard[i].losses;
                        }
                        let fullForm = { 'r': 'Rock', 'p': 'Paper', 's': 'Scissor'};
                        io.to(userInput.socketID).emit("game result", [`${userInput.playedWith} chose ${fullForm[lastRecord.choice.toLowerCase()]} - ${printResult(userInput.result)}`, leaderBoard]);
                        io.to(lastRecord.socketID).emit("game result", [`${lastRecord.playedWith} chose ${fullForm[userInput.choice.toLowerCase()]} - ${printResult(lastRecord.result)}`, leaderBoard]);    
                    })
                });
                }
                dbo.collection("roundInfo").insertOne(userInput, function(err, res) { //Insert the new record
                    if (err) throw err;
                    console.log("User Input is inserted");
                });
            })
        })
    });
});
http.listen(3000, () => {
    console.log('listening on *:3000');
});
function printResult(result){
    if(['Won', 'Lost'].includes(result)){
        return `You ${result}`;
    }else {
        return result;
    }
}