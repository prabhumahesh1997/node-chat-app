const path = require('path')        //core module
const http = require('http')
const express = require('express')      //load the library
const socketio = require('socket.io')   // we get a fn back when we requre socket.io
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom }  = require('./utils/users')


const app = express()   //calling express() for generating a new applicatin
const server= http.createServer(app)        //creating a server express does this behind the scenes even thogh we didnt write
//we are creating server outside of express library and configure it

//we are creating new instance of sockets.io to configure web sockets to work with our server
//hence we are creating raw http server. Sockets expects to be called with http server. so when express creates it
// behind the scene we dont have access of it to pass in socketio(). so we explicitly created
const io = socketio(server)

const port = process.env.PORT   ||  3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))//express static middleware to serve up what ever that is added in publicDirectoryPath 
//express.static(dir_name_to_serve) to serve static files, such as images, CSS, JavaScript, etc
//you can invoke app.use(<specific_middleware_layer_here>) for every middleware layer that you want to add.


//server(emit)  -->  client(receive)  = Countupdated
//client(emit)  -->  server(receive)  = icrement

//let cnt = 0
io.on('connection',(socket)=>{                  //listening for a given event to occur by io.on()...here 'connection' 
    console.log("New websocket connection")        
    
//When a user is joining then he should be added to chat room. hence following is process
    socket.on('join',({ username, room}, callback)=>{
       const { error, user } = addUser({ id : socket.id ,username, room })      // Adding user users list
      
        if(error){
          return callback(error)
        }

        socket.join(user.room)      //Joining the socket to room

        //Giving a welcome message
        socket.emit('message',generateMessage('Admin',"Welcome!"))           //sending an event to client(i.etransfer of data btn S-C) using socket.emmit()
        //Broadcasting to other user in same chat room that userhas joined
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`)) //When we broadcast an event we send it to everybody except the current client in specific room.
  
        io.to(user.room).emit('roomData', {
          room : user.room,
          users : getUsersInRoom(user.room)
        })
        callback()
      })

    socket.on('sendMessage',(message,callback)=>{     //receiving event from client
   
      const user = getUser(socket.id)

      io.to(user.room).emit('message',generateMessage(user.username,message))             //io.emit() emits event to every connections.
      callback('Delivered!')
    })

    socket.on('sendLocation',(cords,callback)=>{

      const user = getUser(socket.id)      
      io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${cords.latitude},${cords.longitude}`))
      callback("Location was shared")

    })
    socket.on('disconnect',()=>{              //disconnect is the bilt in event when a socket is disconnected.ie browser is closed.
      const user = removeUser(socket.id)

      if(user){
        io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
        io.to(user.room).emit('roomData', {
          room : user.room,
          users : getUsersInRoom(user.room)
        })
     
      }

      
    })

})

server.listen(port ,()=>{
    console.log("Server is up on port : "  + port)
})


