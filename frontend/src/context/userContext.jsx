import { useContext, createContext } from "react";
import {useNavigate} from 'react-router-dom'
import React from 'react'
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

export const AppContext = createContext()

export const AppContextProvider = ({children}) =>{
  const [user,setUser] = useState(null)
  const [email,setEmail] = useState(null)
  const [credits,setCredits] = useState(0)
  const [chats,setChats] = useState([])
  const [login, setLogin] = useState(false)
  const [select, setSelect] = useState(null)
  const [led, setLed] = useState(false)
  {/*Fetching user data*/}
  useEffect(() => {
    const loadData = async () => {
      setLed(true)
      try {
        // FIRST fetch user
        const userRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/data`,
          { withCredentials: true }
        )
        setUser(userRes.data.user.name)
        setEmail(userRes.data.user.email)
        setCredits(userRes.data.user.credits)
        setLogin(true)
        // THEN fetch chats
      } catch (error) {
        setUser(null)
        console.log(error)
      } finally{
        setLed(false)
      }
    } 

    loadData()

  }, [])
  {/*Get chats using API's*/}
  const getChats = async () => {
    try {
      const chatRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/getchats`,
        { withCredentials: true }
      )
      setChats(chatRes.data.chats)
    } catch (error) {
      console.log(error)
    }
  }
  {/*If login is true then run chats api*/}
  useEffect(()=>{
    if (login){
      getChats();
    }
  },[login])

  {/*Selecting chats using localHost*/}
  useEffect(() => {
    if (!login || chats.length === 0) { setSelect(null); return; }
    if (select) return;
    const storedChat = localStorage.getItem('selectedChat');
    if (storedChat) {
      try {
        setSelect(JSON.parse(storedChat))  
      } catch {
        setSelect(chats[0])
        localStorage.setItem("selectedChat", JSON.stringify(chats[0]))
      }
    } else {
      setSelect(chats[0])
      localStorage.setItem(
        "selectedChat",
        JSON.stringify(chats[0])
      )
    }
  }, [chats])
  return (
    <AppContext.Provider value={{user,setUser,chats, setChats, email, credits, setCredits, login, setLogin, getChats, select, setSelect, led}}>
        {children}
    </AppContext.Provider>
  )
}