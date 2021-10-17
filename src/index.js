const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const {generateMessage,generateLocationMessage} = require('./utils/message')
const {addUser,removeUser,getUser,getUserInRoom} = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publicDirectPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectPath))

io.on('connection', (socket)=>{

    console.log('new web socket connection')

    socket.on('join' ,(options,callback)=>{
        const {error,user} = addUser({id:socket.id,...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        

        socket.emit('message',generateMessage(user.username,'Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage(user.username,user.username+' has joined!'))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()

        //socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage(user.username,user.username+' has left!'))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,'https://google.com/maps?q='+coords.latitude+','+coords.longitude))
        callback()
    })
})

server.listen(PORT, ()=>{
    console.log('Now server are up on port '+ PORT)
})