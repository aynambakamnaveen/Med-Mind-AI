import React, { useState } from 'react'
import logo from '../images/logo.png'
import { GrNotes } from "react-icons/gr";
import { FaFilePdf } from "react-icons/fa6";
import { MdOutlineMessage } from "react-icons/md";
import { FaUser } from "react-icons/fa6";
import { RiLockPasswordLine } from "react-icons/ri";
import { TbPassword } from "react-icons/tb";
import { FaEye } from "react-icons/fa";
import { IoIosEyeOff } from "react-icons/io";
import { CiLogin } from "react-icons/ci";
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useContext } from 'react'
import {AppContext} from '../context/userContext'
const Login = () => {
  const {login, setLogin} = useContext(AppContext)
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [showpass, setShowPass] = useState(false)
  const [loading,setLoading] = useState(false)
  const navigate = useNavigate()
  const handleShowPass = (e)=>{
    e.preventDefault();
    setShowPass((prev) => !prev)
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter all required inputs');
    try {
      setLoading(true)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, { email, password }, { withCredentials: true });
      setEmail('');
      setPassword('');
      setLogin(true);
      navigate('/');
      toast.success('Login successful');
    } catch (error) {
      const message = error.response?.data?.message;
      if (error.response?.status === 409 || error.response?.status === 401) {
        toast.error(message || 'Request failed');
      } else {
        toast.error(message || 'Something went wrong');
        console.log(error);
    }
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className=' w-screen flex flex-col md:flex-row bg-black text-white'>
      {/*left side*/}
      <section className='flex flex-col w-full md:max-w-1/3 gap-3 h-screen border-r border-gray-400/50 px-8'>
        {/*Header*/}
        <div>

          <div className='flex  items-center justify-start mt-4'>
            <img src={logo} alt='logo_medical_bot' className='md:max-w-18 max-w-15'/>
            <div className='flex flex-col'>
              <h1 className='md:text-2xl font-playfair font-semibold tracking-widest bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent'>MedMind AI</h1>
              <p className='font-light bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent uppercase font-poppins tracking-widest'>Medical Intelligence</p>
            </div>

          </div>
        <p className='font-light text-cyan-400 uppercase font-lora tracking-widest'>AI HEALTH ASSISTANT</p>
        </div>

        <div className='tracking-tighter md:mt-1 text-3xl md:text-6xl'>
          <h1 className='font-playfair font-medium'>Medicine,</h1>
          <h1 className='font-playfair  text-[#00FF9C] leading-10 md:leading-17'>decoded</h1>
          <h1 className='font-playfair font-medium'>for you.</h1>
        </div>

        <div>
          <p className='font-light text-violet-300/50'>Scan prescriptions, understand medicines, analyse health reports — and ask anything medical, any time.</p>
        </div>

        <div className='space-y-3 md:space-y-4 font-lora'>
          <div className='flex gap-2  max-w-[300px] bg-violet-300/10 border border-violet-400/10 transition-all duration-300 hover:border-violet-400 hover:scale-103 rounded-2xl p-5'>
            <div className='bg-green-500/10 border text-green-300/70 border-green-400/10 px-4 rounded-xl flex items-center justify-center'>
              <GrNotes/>
            </div>
            <p className='text-gray-200/50'>Prescription & medicine scanner</p>
          </div>
          <div className='flex gap-2  max-w-[300px] bg-violet-300/10 border border-violet-400/10 transition-all duration-300 hover:border-violet-400 hover:scale-103 rounded-2xl p-5'>
            <div className='bg-blue-500/10 border text-blue-300/70 border-blue-400/10 px-4 rounded-xl flex items-center justify-center'>
              <FaFilePdf/>
            </div>
            <p className='text-gray-200/50'>Health report & PDF analysis</p>
          </div>
          <div className='flex gap-2  max-w-[300px] bg-violet-300/10 border border-violet-400/10 transition-all duration-300 hover:border-violet-400 hover:scale-103 rounded-2xl p-5'>
            <div className='bg-orange-500/10 border text-orange-300/70 border-orange-400/10 px-4 rounded-xl flex items-center justify-center'>
              <MdOutlineMessage/>
            </div>
            <p className='text-gray-200/50'>Ask any medical question</p>
          </div>
        </div>
      </section>
      {/*right side*/}
      <section className='flex flex-col w-full md:max-w-2/3 bg-purple-300/10 justify-center h-screenn items-center p-5'>
          <div className='mt-3 md:mt-10  flex flex-col gap-2'>
            <div>
              <p className='text-cyan-400/20 font-poppins text-sm uppercase tracking-widest'>Welcome back</p>
              <h1 className='text-2xl md:text-4xl font-playfair'>Sign in to Med Mind AI</h1>
            </div>
            <p className='text-purple-300/20 font-poppins text-sm font-light'>Your personal medical intelligence assistant.</p>
            <div className='w-fit px-6 md:px-8 bg-green-400/10 border border-green-300 py-2 rounded-lg flex space-x-2 items-center'>
              <FaUser className='text-green-400'/>
              <p className=' text-green-400/60 inline-block'>User</p>
            </div>
            <form onSubmit={handleSubmit} className='flex flex-col space-y-1'>
              <label className='text-purple-300/30 tracking-widest mt-3'>EAMIL ADRESSS</label>
              <div className='p-2 border border-purple-300/20  rounded-xl flex gap-3 items-center bg-gray-100/10 shadow-2xl hover:shadow-cyan-400/50'>
                <FaUser className='text-purple-300/30'/>
                <input value={email} onChange={(e)=>{setEmail(e.target.value)}} type="email" className='outline-none' placeholder='you@gmail.com' />
              </div>
              <label className='text-purple-300/30 tracking-widest mt-3'>PASSWORD</label>
              <div className='p-2 border border-purple-300/20  rounded-xl flex gap-3 items-center bg-gray-100/10 shadow-2xl hover:shadow-cyan-400/50 relative'>
                <RiLockPasswordLine className='text-purple-300/30'/>
                <input value={password} onChange={(e)=>{setPassword(e.target.value)}} type={showpass ? 'text':'password'} className='outline-none' placeholder='Password' />
                <button className='absolute right-2 text-xl text-green-400 cursor-pointer' onClick={(e)=>{handleShowPass(e)}}>
                  {showpass ?<FaEye/>:<IoIosEyeOff/>}
                </button>
              </div>
              <p className='font-light text-green-400/70 text-end cursor-pointer transition-all duration-100 hover:text-green-400'>Forget password?</p>
              <button type="submit" className='mt-2 md:mt-3 cursor-pointer transition-all duration-150 hover:bg-gray-300/50 active:scale-93 border py-1 rounded-xl border-gray-300/30 font-medium font-poppins flex items-center justify-center gap-2'><CiLogin/>{ loading ?"Signing in.....":"Sign in"}</button>
              <div className='text-center flex items-center justify-center font-playfair cursor-pointer mt-2'>
                <p className='text-green-300/30'>No account?</p>
                <p className='text-green-400'>Create one free</p>
              </div>
            </form>
          </div>
        
      </section>
    </main>
  )
}

export default Login;