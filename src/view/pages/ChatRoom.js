import React, { useEffect, useState ,useRef} from 'react'
import { useNavigate } from 'react-router-dom'

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { db } from '../../firebase-config';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { getAuth } from 'firebase/auth';
import { doc,getDoc } from 'firebase/firestore'
import { auth } from '../../firebase-config'

import {query,collection,orderBy,onSnapshot} from 'firebase/firestore';
import { Navigate } from 'react-router-dom';

import ChatMessage from '../components/ChatMessage';
import SendMessage from '../components/SendMessage'
import ChatRoomBar from '../components/ChatRoomBar';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { Card, Paper } from '@mui/material';

import dayjs from 'dayjs';
import { toast } from 'react-toastify';

const ChatRoom = ({chatRoom}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const scroll = useRef()
  const messageScroll = useRef()
  const [roomInfo,setRoomInfo]=useState({
    name:'',
    time:null
  })
  const [userArr,setUserArr]=useState(null)
  const [currentUserName,setCurrentUserName]=useState('');

  useEffect(()=>{
    if (chatRoom===''){
      console.log('wait for it')
    }
    else if(chatRoom!==''){
    const q = query(collection(db, chatRoom+'/messages'),orderBy('timestamp'))
    const unsubscribe = onSnapshot(q, (QuerySnapshot)=>{
      let messages=[]
      QuerySnapshot.forEach((doc)=>{
        messages.push({...doc.data(),id:doc.id})
      })
      setMessages(messages);
    })
    let userArr=[]
    const unsubscribeUsers=onSnapshot(collection(db,chatRoom+'/users'),(collectionSnapshot)=>{
        collectionSnapshot.forEach((doc)=>{
          let docData=doc.data()
          userArr.push({id:doc.id,name:docData.name,ref:docData.userRef,role:docData.role})
          if (doc.id===auth.currentUser.email){
            setCurrentUserName(docData.name)
          }
        })
        setUserArr(userArr)
      })
    const chatRoomArr=chatRoom.split('/');
    const chatRoomID=chatRoomArr[chatRoomArr.length-1]
    getDoc(doc(db, chatRoomArr.slice(0,-1).join('/'), chatRoomID)).then(docSnap => {
      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        setRoomInfo({...docSnap.data(),roomUID:chatRoomID})
      } else {
        console.log("No such document!")}});
    const unsub=onSnapshot(doc(db, chatRoomArr.slice(0,-1).join('/'), chatRoomID),(doc)=>{
      if(doc.exists()){
        console.log("fine")
      }
      else{
        toast('Someone has deleted the room')
        navigate('/home/myRooms')
      }
    })
    return unsub
   }},[chatRoom])


  return (
    
    <div style={{display:'flex',flexDirection:'column',backgroundColor:'black'}}>
      {(!roomInfo.time)?<div
    style={{
        position: 'absolute', left: '60%', top: '50%',
        transform: 'translate(-50%, -50%)'
    }}
    >
      <p>loading...</p>
      <CircularProgress color="secondary" size={50} thickness={5}/>
    </div>:
      <div>
      <ChatRoomBar roomUID={roomInfo.roomUID}
      roomName={roomInfo.name} 
      roomDate={(roomInfo.time)?dayjs.unix(roomInfo.time.seconds).format('DD/MM/YYYY'):'loading...'}
      roomTime={(roomInfo.time)?dayjs.unix(roomInfo.time.seconds).format('hh:mm A'):'loading...'}
      roomLocation={roomInfo.location}
      roomPax={roomInfo.pax}
      roomCap={roomInfo.cap}
      roomUsers={userArr}/>
      ChatRoom
      <div style={{width:'100%',display:'flex',flexDirection:'column',marginTop:'25px'}}>
        <Paper>
        <Paper style={{width:'100%',height: '500px', overflow: 'auto'}}>
      {messages.map(message => (
        <ChatMessage key={message.id} className='message' message={message} messageScroll={messageScroll}></ChatMessage>
      ))}
      <span ref={messageScroll}></span>
      </Paper>
      <SendMessage scroll={scroll} messageScroll={messageScroll} chatRoom={chatRoom+'/messages'} currentUserName={currentUserName}/>
      </Paper>
      <span ref={scroll}></span>
      </div>
      </div>
}
    </div>
  )
}

export default ChatRoom