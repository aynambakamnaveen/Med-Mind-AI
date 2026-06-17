import { useContext, createContext } from "react";
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
  // FIX: 'led' starts null (unknown) so pages know auth check is still in-flight
  const [led, setLed] = useState(null)

  const loadData = async () => {
    setLed(true)
    try {
      const userRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/data`,
        { withCredentials: true }
      )
      setUser(userRes.data.user.name)
      setEmail(userRes.data.user.email)
      setCredits(userRes.data.user.credits)
      setLogin(true)
    } catch (error) {
      setUser(null)
      setEmail(null)
      setCredits(0)
      setLogin(false)
    } finally {
      setLed(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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

  // FIX: only fetch chats when login becomes true, not on false
  useEffect(() => {
    if (login) {
      getChats()
    } else {
      // Clear chats & selection when logged out
      setChats([])
      setSelect(null)
    }
  }, [login])

  // FIX: removed `if (select) return` guard — it prevented re-selection
  // after chat list updates (e.g. after creating/deleting a chat)
  useEffect(() => {
    if (!login || chats.length === 0) {
      setSelect(null)
      return
    }
    const storedChat = localStorage.getItem('selectedChat')
    if (storedChat) {
      try {
        const parsed = JSON.parse(storedChat)
        // Verify the stored chat still exists in the current list
        const stillExists = chats.find(c => c._id === parsed._id)
        if (stillExists) {
          setSelect(stillExists) // use fresh data from server, not stale stored copy
        } else {
          setSelect(chats[0])
          localStorage.setItem('selectedChat', JSON.stringify(chats[0]))
        }
      } catch {
        setSelect(chats[0])
        localStorage.setItem('selectedChat', JSON.stringify(chats[0]))
      }
    } else {
      setSelect(chats[0])
      localStorage.setItem('selectedChat', JSON.stringify(chats[0]))
    }
  }, [chats])

  // FIX: expose a logout helper that fully resets all context state
  const logout = () => {
    setUser(null)
    setEmail(null)
    setCredits(0)
    setChats([])
    setSelect(null)
    setLogin(false)
    localStorage.removeItem('selectedChat')
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      chats, setChats,
      email,
      credits, setCredits,
      login, setLogin,
      getChats,
      select, setSelect,
      led,
      loadData,
      logout,   // FIX: expose logout so Home.jsx can fully reset state
    }}>
      {children}
    </AppContext.Provider>
  )
}