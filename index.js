var express=require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var shortid = require('shortid');
var mongoose = require('mongoose');
var conn = mongoose.createConnection('mongodb://127.0.0.1/nodechess');
var ObjectID = require('mongodb').ObjectID;
console.log("Connected to mongoDB successfully!");
conn.on('error',function(){
    console.log('MONGOOSE ERROR')
});
var port = 20202;

var roomDataSchema = new mongoose.Schema({
    roomid : String,
    count :Number
});
var clientRoomMapSchema = new mongoose.Schema({
    roomid : String,
    socketid: String
});
var roomModel = conn.model('roomData', roomDataSchema, 'roomData');
var mapModel = conn.model('clientroomMap', clientRoomMapSchema, 'clientroomMap');


// Register events on socket connection
io.on('connection', function(socket){
    console.log('Player is connected : '+socket.id);

    roomModel.find({count : {$lt : 2}},function(err,doc){
        var _roomid,_turn;
        if(doc.length > 0){
            _roomid = doc[0].roomid;
            _turn = 1;
            conn.collection('roomData').update({roomid : _roomid},{$inc : {count: 1 }});
        }
        else{
            _roomid = shortid.generate();
            _turn = 0;
            conn.collection('roomData').insert({
                roomid: _roomid,
                count:1
            });

        }
        /*conn.collection('clientroomMap').insert({
                        roomid: _roomid,
                        socketid:socket.id
                    });*/
        socket.emit('joinedRoom',{roomid: _roomid, turn: _turn});
        socket.join(_roomid);
    }).limit(1);


    socket.on('disconnect',function(){
        console.log('Player is disconnected : '+socket.id);
  /*      mapModel.find({socketid : socket.id},function(err,res){
            var t = res[0].roomid;
            roomModel.find({roomid: t},function(err,doc){
                if(doc[0].count==2){
                    conn.collection('roomData').update({roomid : doc[0].roomid},{$inc : {count: -1 }});
                }else{
                    roomModel.find({roomid:res[0].roomid}).remove().exec();
                }
            });
        }).remove().exec();*/
    });

    socket.on('playerMoved',function(data){
        console.log("roomid : " + data.roomid);
        var _roomid= data.roomid;
        socket.broadcast.to(_roomid).emit("opponentMoved",data);
    });
});

// Listen application request on port specified
http.listen(port, function(){
  console.log('listening on *: '+port);
});
