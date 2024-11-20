import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Lobby } from './components/Lobby'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { Chat } from './components/Chat'


export type message = {user:string,message:string};

function App() {
  const [connection, setConnection] = useState<HubConnection>()
  const [messages, setMessages] = useState<message[]>([])
  const [users, setUsers] = useState<string[]>([]);

  async function joinRoom(user: string, room: string) {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl("https://localhost:7003/chat")
        .build();

        connection.on("UsersInRoom", (users) => {
          setUsers(users);
        })

        connection.on("ReciveMessage", (user, message) => {
          // console.log("message received:" + message);
          setMessages((messages) => [...messages, {user, message}]);
        });

        localStorage.setItem("loggedInUser", user);

        connection.onclose(e=>{
          connection.invoke("LeaveRoom", {user, room});
          setConnection(undefined);
          setMessages([]);
          setUsers([]);
          localStorage.removeItem("loggedInUser");
        });

        await connection.start();
        await connection.invoke("JoinRoom", {user, room});
        setConnection(connection);
    } catch (error) {
      console.log(error)
    }
  }

  async function sendMessage(message: string) {
    try {
      if(connection){
        await connection.invoke("SendMessage", message);
      }
    } catch (error) {
      console.log(error)
    }
  }

  async function closeConnection() {
    try {
      await connection?.stop();
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
     <h2>My Chat</h2>
     <hr className="line" />
     {!connection
      ? <Lobby joinRoom={joinRoom}/>
      : <Chat 
          users={users}
          messages={messages} 
          sendMessage={sendMessage} 
          closeConnection={closeConnection}
          />
     }
     
    </>
  )
}

export default App
