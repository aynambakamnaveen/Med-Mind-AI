import React, { useState } from 'react'
import logo from '../images/logo.png'
import { useContext } from 'react'
import { AppContext } from '../context/userContext'
import { LuMenu } from "react-icons/lu";
import { ImCross } from "react-icons/im";
import { CiSearch } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { FiZap, FiShoppingCart } from "react-icons/fi";
import { MdWarningAmber } from "react-icons/md";
import toast from 'react-hot-toast';
import axios from 'axios';
import moment from 'moment';
import Messages from '../components/Messages'

export const Home = () => {
  const { chats, getChats, setSelect, user, credits, setCredits} = useContext(AppContext)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const handleMenu = () => setOpen(prev => !prev)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/create`,
        {},
        { withCredentials: true }
      )
      await getChats()
      toast.success('Chat created')
    } catch (error) {
      const message = error.response?.data?.message
      if (error.response?.status === 409 || error.response?.status === 401) {
        toast.error(message || 'Request failed')
      } else {
        toast.error(message || 'Something went wrong')
        console.log(error)
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteChat = async (e, chatId) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/delete`,
        { chatId },
        { withCredentials: true }
      )
      await getChats()
      toast.success('Chat deleted')
    } catch (error) {
      const message = error.response?.data?.message
      toast.error(message || 'Something went wrong')
      console.log(error)
    }
  }

  const selectedOne = (e, chat) => {
    e.preventDefault()
    setSelect(chat)
    localStorage.setItem('selectedChat', JSON.stringify(chat))
    setOpen(false)
  }

  const filteredChats = chats?.filter(chat => {
    const title = chat.messages?.[0]?.content || chat.name || ''
    return title.toLowerCase().includes(search.toLowerCase())
  })

  const creditMax = 20
  const noCredits = (credits ?? 0) < 1
  const lowCredits = !noCredits && (credits ?? 0) <= 3
  const creditPct = Math.min(((credits ?? 0) / creditMax) * 100, 100)
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'

  // Credit bar color
  const barColor = noCredits
    ? 'from-red-500 to-red-400'
    : lowCredits
      ? 'from-amber-400 to-orange-400'
      : 'from-teal-400 to-sky-500'

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#0d1117]">

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          onClick={handleMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
      <button
        onClick={handleMenu}
        className="fixed top-3 left-3 z-50 md:hidden flex items-center justify-center
                   w-9 h-9 rounded-xl bg-[#161b22] border border-[#30363d]
                   text-gray-300 hover:bg-[#21262d] transition-colors"
        aria-label="Toggle sidebar"
      >
        {open ? <ImCross size={12} /> : <LuMenu size={18} />}
      </button>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-[268px] flex flex-col
          bg-[#0d1117] border-r border-[#21262d]
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex md:shrink-0
        `}
      >

        {/* ── Brand ── */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#21262d]">
          <img src={logo} alt="logo" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="text-[15px] font-bold text-gray-100 tracking-tight leading-none">
              Med Mind AI
            </h1>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-teal-400 mt-0.5">
              Medical AI Chatbot
            </p>
          </div>
        </div>

        {/* ── New Chat ── */}
        <div className="px-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-[13px] text-[#0d1117] tracking-wide
                       bg-gradient-to-r from-teal-400 to-sky-500
                       shadow-[0_0_18px_rgba(45,212,191,0.2)]
                       hover:opacity-90 hover:-translate-y-px active:scale-95
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : '+ New Chat'}
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                          bg-[#161b22] border border-[#30363d]
                          focus-within:border-teal-500/50 transition-colors">
            <CiSearch className="text-gray-500 text-base shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search conversations…"
              className="bg-transparent outline-none text-[13px] text-gray-200 placeholder-gray-600 w-full"
            />
          </div>
        </div>

        {/* ── Section label ── */}
        <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-gray-600">
          Recent Chats
        </p>

        {/* ── Chat list ── */}
        <div
          className="flex-1 overflow-y-auto px-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredChats && filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={(e) => selectedOne(e, chat)}
                className="group flex items-center justify-between gap-2 px-3 py-2.5
                           rounded-xl cursor-pointer hover:bg-[#161b22] transition-colors mb-0.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-200 truncate leading-snug">
                    {chat.messages[0]?.content || chat.name}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {moment(chat.updatedAt).fromNow()}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteChat(e, chat._id)}
                  className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-lg
                             text-gray-500 hover:text-red-400 hover:bg-red-400/10
                             transition-colors shrink-0"
                  aria-label="Delete chat"
                >
                  <MdDelete size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-[13px] text-gray-600 py-8">
              {search ? 'No matching chats' : 'No chats yet'}
            </p>
          )}
        </div>

        {/* ══ USER PANEL (bottom) ══ */}
        <div className="border-t border-[#21262d] px-4 pt-3 pb-4 bg-[#0d1117]">

          {/* Zero-credits warning banner */}
          {noCredits && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl
                            bg-red-500/10 border border-red-500/25">
              <MdWarningAmber size={15} className="text-red-400 shrink-0" />
              <p className="text-[12px] text-red-300 font-medium leading-snug">
                You're out of credits!
              </p>
            </div>
          )}

          {/* Low-credits warning */}
          {lowCredits && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl
                            bg-amber-500/10 border border-amber-500/25">
              <MdWarningAmber size={15} className="text-amber-400 shrink-0" />
              <p className="text-[12px] text-amber-300 font-medium leading-snug">
                Only {credits} credit{credits === 1 ? '' : 's'} left!
              </p>
            </div>
          )}

          {/* Credits label + count */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-gray-600">
              Credits
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold font-mono
              ${noCredits ? 'text-red-400' : lowCredits ? 'text-amber-400' : 'text-teal-400'}`}>
              <FiZap size={10} />
              {credits ?? 0} left
            </span>
          </div>

          {/* Credits progress bar */}
          <div className="h-1 w-full bg-[#21262d] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
              style={{ width: noCredits ? '100%' : `${creditPct}%` }}
            />
          </div>

          {/* Buy Credits button */}
          <button
            onClick={() => window.location.href = '/buy-credits'}
            className={`
              w-full flex items-center justify-center gap-2
              py-2 rounded-xl text-[13px] font-bold mb-3
              transition-all duration-200 hover:-translate-y-px active:scale-95
              ${noCredits
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                : 'bg-[#161b22] border border-[#30363d] text-gray-300 hover:border-teal-500/40 hover:text-teal-400'}
            `}
          >
            <FiShoppingCart size={13} />
            {noCredits ? 'Buy Credits Now' : 'Buy Credits'}
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-sky-500
                            flex items-center justify-center text-[13px] font-bold text-[#0d1117] shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-200 truncate leading-snug">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-gray-600 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

        </div>
      </aside>

      {/* ── Main content ── */}
      <section className="relative flex-1 h-screen overflow-hidden">
        <Messages onOpenSidebar={handleMenu} />
      </section>

    </main>
  )
}


