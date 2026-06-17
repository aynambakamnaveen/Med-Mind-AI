import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import {Home} from './pages/Home'
import { Toaster } from 'react-hot-toast';
import BuyCredits from './pages/BuyCredits'
import SignIn from './pages/SignIn'
function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path='/login' element={<Login/>} />
        <Route path='/' element={<Home/>} />
        <Route path='/buy-credits' element={<BuyCredits/>}/>
        <Route path = '/register' element = {<SignIn/>}/>
      </Routes>
    </>
  )
}

export default App
