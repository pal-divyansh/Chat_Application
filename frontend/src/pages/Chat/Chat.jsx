import React from 'react'
import './Chat.css'
import ChatBox from '../../components/ChatBox/ChatBox'
import RightSideBar from '../../components/RightSideBar/RightSideBar'
import LeftSideBar from '../../components/LeftSideBar/LeftSideBar'
import { useAppContext } from '../../context/AppContext';

const Chat = () => {
  const { messages, selectedChat, sendMessage } = useAppContext();

  return (
    <div className='chat'>
      <div className='chat-container'>
        <LeftSideBar />
        <ChatBox 
          messages={messages} 
          onSendMessage={sendMessage}
          userId={selectedChat?._id}
        />
        <RightSideBar />
      </div>
    </div>
  )
}

export default Chat
