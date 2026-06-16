import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
// => /api/user/register
const SignIn = () => {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [pass, setPass] = useState("")
    const [confirmpass,setConfirmPass] = useState("")
    const [load, setLoad] = useState(false)
    const nav = useNavigate()
    const handleSubmit = async(e)=>{
        e.preventDefault();
        if (!username || !email || !pass || !confirmpass) return toast.error('Fill all fields');
        if (pass !== confirmpass){return toast.error('Password mismatch')}
        try {
            setLoad(true);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/user/register`, {name: username, email, password: pass},
            { withCredentials: true });
            setUsername('');
            setEmail('');
            setPass('');
            setConfirmPass('')
            toast.success('Account created!');
            nav('/login');
        } catch (error) {
            if (error.response?.status === 409) { 
                toast.error('User already exists');
            } else {
                toast.error('Please try again');
            }    
        } finally {
            setLoad(false);
        }
    }
  return (
    <main className='bg-gray-600 w-screen h-screen flex justify-center items-center'>
        <form onSubmit={handleSubmit} className="bg-white text-gray-500 w-full max-w-[340px] mx-4 md:p-6 p-4 py-8 text-left text-sm rounded-lg shadow-[0px_0px_10px_0px] shadow-black/10">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>
            <input value={username} onChange={(e)=>(setUsername(e.target.value))} className="w-full border mt-1 bg-indigo-500/5 mb-2 border-gray-500/10 outline-none rounded py-2.5 px-3" type="text" placeholder="Username" required />
            <input value = {email} onChange={(e)=>(setEmail(e.target.value))} className="w-full border mt-1 bg-indigo-500/5 mb-2 border-gray-500/10 outline-none rounded py-2.5 px-3" type="email" placeholder="Email" required />
            <input value={pass} onChange={(e)=>(setPass(e.target.value))} className="w-full border mt-1 bg-indigo-500/5 mb-2 border-gray-500/10 outline-none rounded py-2.5 px-3" type="text" placeholder="Password" required />
            <input value={confirmpass} onChange={(e)=>(setConfirmPass(e.target.value))} className="w-full border mt-1 bg-indigo-500/5 mb-7 border-gray-500/10 outline-none rounded py-2.5 px-3" type="text" placeholder="Confirm Password" required />
            <button type='submit' className="w-full mb-3 bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95 py-2.5 rounded text-white font-medium cursor-pointer" disabled={load}>{load?"Creating....":"Create Account"}</button>
            <div className='flex items-center justify-center gap-2'>
                <p className="text-center mt-4">Already have an account?</p>
                <p onClick={() => nav('/login')} className="text-blue-500 underline cursor-pointer">Log In</p>
            </div>
        </form>
    </main>
  )
}

export default SignIn