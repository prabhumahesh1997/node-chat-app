//this client file have access to to socket.io lib bcz we have loaded <script src="/socket.io/socket.io.js"></script>
// client connection to server

const socket = io() 

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton =document.querySelector('#send-location')
const $message = document.querySelector('#message')



//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username , room } = Qs.parse(location.search, { ignoreQueryPrefix : true})  //we get an obj with key val pairs

const autoscroll = ()=>{
        //new message
        const $newMessage = $message.lastElementChild

//get the new message -> get the margin val -> take the margin and add it on height of the message to get total height 
       
        //Height of new message
        const newMessageStyles = getComputedStyle($newMessage)
        const newMessageMargin = parseInt(newMessageStyles.marginBottom)
        const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

        //Visible Height
        const visibleHeight = $message.offsetHeight

        //height of message container
        const containerHeight = $message.scrollHeight

        //How far have i scrolled
        const scrollOffset = $message.scrollTop + visibleHeight

        if(containerHeight - newMessageHeight <= scrollOffset){
                $message.scrollTop = $message.scrollHeight
        }


}

socket.on('message',(message)=>{        //receiving the event sent by server using socket.on...same event_name
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('locationMessage',(message)=>{
    const html = Mustache.render(locationMessageTemplate,{
        username : message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({ room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()      //to prevent the browser for full page refresh
   // const message = document.querySelector('input').
   $messageFormButton.setAttribute('disabled','disabled')     // disabling the form bttn after clicking once
    const message = e.target.elements.message.value 
//Whoever is emiting the event set up a callback function. Whoever is receiving the event receive the callback function that it needs to call
    socket.emit('sendMessage',message, (message)=>{     //callback receiving the arg passed by callback of client
        $messageFormButton.removeAttribute('disabled')      //enabling form bttn again
        $messageFormInput.value =''
        $messageFormInput.focus()
        console.log("message was delivered",message)
    })      //sending an event from client to server
})

$sendLocationButton.addEventListener('click',(e)=>{
    
    if(!navigator.geolocation){   //The Navigator.geolocation read-only property returns a Geolocation object that gives Web content access to the location of the device.
        return alert('Geolocation is not supported by your browser!')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{      //getCurrentPosition is a fn property of geolocation which takes arg postion which as all the info of current pos.
        socket.emit('sendLocation',{         //getCurrentPosition takes callback. doesnt support Promise or async await
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },(message)=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log(message)
        })                  

    })
})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})