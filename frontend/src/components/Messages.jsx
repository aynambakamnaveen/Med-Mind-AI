import React, { useState, useRef, useEffect } from 'react'
import { useContext } from 'react'
import { AppContext } from '../context/userContext'
import toast from 'react-hot-toast';
import axios from 'axios';
import moment from 'moment'
import Markdown from 'react-markdown'
import logo from '../images/logo.png'
import userAvatar from '../images/user.png'
import { FaPlus, FaFilePdf, FaFileLines } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { LuMenu } from "react-icons/lu";
import { FaCopy, FaCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";

const Messages = ({ onOpenSidebar }) => {
  const { user, getChats, select, setSelect, credits, setCredits } = useContext(AppContext)
  const [selectmessages, setSelectmessages] = useState([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  // ── NEW: staged file state ──
  const [pendingFile, setPendingFile] = useState(null)   // { file: File, previewUrl: string, type: 'image'|'doc' }
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [select?.messages, sending])

  useEffect(() => {
    setSelectmessages(select?.messages)
  }, [select])

  // Clean up object URL when pendingFile changes
  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
    }
  }, [pendingFile])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleSend = async () => {
    if ((credits ?? 0) < 1) {
      toast.error("Not enough credits! Buy more to continue.")
      return
    }
    const trimmedMessage = message.trim()

    // Must have text OR a file (or both)
    if (!trimmedMessage && !pendingFile) return
    if (!select?._id) return

    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      _id: tempId,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
      // show local preview optimistically
      file: pendingFile
        ? {
            url: pendingFile.previewUrl,
            type: pendingFile.type,
            name: pendingFile.file.name,
          }
        : undefined,
    }

    setSelect(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticMsg],
    }))
    setMessage("")
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Capture and clear pending file before async work
    const fileToSend = pendingFile
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    try {
      setSending(true)

      let data

      if (fileToSend) {
        // Send as multipart/form-data (text + file together)
        setUploading(true)
        const formData = new FormData()
        formData.append('file', fileToSend.file)
        formData.append('chatId', select._id)
        if (trimmedMessage) formData.append('prompt', trimmedMessage)

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/message/text`,
          formData,
          { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        )
        data = res.data
        setUploading(false)
      } else {
        // Text-only
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/message/text`,
          { chatId: select._id, prompt: trimmedMessage },
          { withCredentials: true }
        )
        data = res.data
      }

      if (data?.chat) {
        setSelect(data.chat)
        localStorage.setItem('selectedChat', JSON.stringify(data.chat))
      }

      // Update credits
      const updatedCredits = data?.credits ?? data?.user?.credits
      if (typeof updatedCredits === 'number') {
        setCredits(updatedCredits)
      } else {
        setCredits(prev => prev - 1)
      }

      await getChats()
    } catch (error) {
      // Roll back optimistic message
      setSelect(prev => ({
        ...prev,
        messages: (prev?.messages || []).filter(m => m._id !== tempId),
      }))
      setMessage(trimmedMessage)
      if (textareaRef.current) autoResize()
      setUploading(false)
      const msg = error.response?.data?.message
      toast.error(msg || 'Failed to send message')
      console.error(error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileClick = () => fileInputRef.current?.click()

  // ── FIXED: just stage the file, don't send ──
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : null

    setPendingFile({
      file,
      previewUrl,
      type: isImage ? 'image' : 'doc',
    })

    // Reset input so the same file can be re-selected if cleared
    e.target.value = ''
  }

  const removePendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const renderFileAttachment = (file) => {
    if (!file?.url) return null
    if (file.type === 'image') {
      return (
        <img
          src={file.url}
          className="w-48 rounded-xl border border-white/10 mb-2 block"
          alt="uploaded"
        />
      )
    }
    const isPdf = file.type === 'pdf' || file.name?.endsWith('.pdf')
    const Icon = isPdf ? FaFilePdf : FaFileLines
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 mb-2 px-3 py-2 bg-white/5 hover:bg-white/10
                   border border-white/10 rounded-xl text-[12px] text-gray-300
                   max-w-[220px] transition-colors"
      >
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{file.name || 'Attached file'}</span>
      </a>
    )
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
  const noCredits = (credits ?? 0) < 1

  return (
    <div className="relative w-full h-full flex flex-col bg-[#10161e]">

      {/* ══ Mobile header ══ */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#21262d] bg-[#0d1117] shrink-0">
        <button
          onClick={onOpenSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400
                     hover:bg-[#21262d] transition-colors"
          aria-label="Open sidebar"
        >
          <LuMenu size={18} />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img src={logo} alt="logo" className="w-6 h-6 object-contain rounded-md" />
          <span className="text-[14px] font-semibold text-gray-200 truncate">
            {select?.name || select?.messages?.[0]?.content || 'Med Mind AI'}
          </span>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono shrink-0 border
          ${noCredits
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-teal-400/10 border-teal-400/20 text-teal-400'}`}>
          {noCredits ? '⚠ 0' : `⚡ ${credits}`}
        </span>
      </header>

      {/* ══ Desktop header ══ */}
      <header className="hidden md:flex items-center justify-between px-6 py-3.5
                         border-b border-[#21262d] bg-[#0d1117] shrink-0">
        <span className="text-[15px] font-semibold text-gray-200 truncate max-w-md">
          {select
            ? (select.messages?.[0]?.content || select.name || 'New Chat')
            : 'Med Mind AI'}
        </span>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono border
          ${noCredits
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-teal-400/10 border-teal-400/20 text-teal-400'}`}>
          {noCredits ? '⚠ No credits left' : `⚡ ${credits} credits`}
        </span>
      </header>

      {/* ══ No-credits banner ══ */}
      {noCredits && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5
                        bg-red-500/10 border-b border-red-500/20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-red-400 text-base shrink-0">⚠</span>
            <p className="text-[13px] text-red-300 font-medium truncate">
              You're out of credits. Buy more to keep chatting.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/buy-credits'}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600
                       text-white text-[12px] font-bold transition-colors"
          >
            Buy Credits
          </button>
        </div>
      )}

      {/* ══ Messages scroll area ══ */}
      <div
        className="flex-1 overflow-y-auto pb-32 pt-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent' }}
      >
        {/* No chat selected */}
        {!select && (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-400/10 border border-teal-400/20
                            flex items-center justify-center
                            shadow-[0_0_32px_rgba(45,212,191,0.15)]">
              <img src={logo} alt="logo" className="w-9 h-9 object-contain opacity-80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-[13px] text-gray-600 mt-1.5 max-w-xs leading-relaxed">
                Select a chat or create a new one to begin your medical consultation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {['Symptoms checker', 'Drug interactions', 'Lab results explained', 'General health advice'].map(s => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full bg-[#161b22] border border-[#30363d]
                             text-[12px] font-medium text-gray-500
                             hover:border-teal-500/50 hover:text-teal-400 cursor-pointer transition-colors"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat selected but no messages */}
        {select && select.messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20
                            flex items-center justify-center">
              <img src={logo} alt="logo" className="w-8 h-8 object-contain opacity-70" />
            </div>
            <p className="text-[13px] text-gray-600">No messages yet — ask anything!</p>
          </div>
        )}

        {/* Messages list */}
        {select && select.messages?.length > 0 && (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-5">
            {select.messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Meta */}
                <div className={`flex items-center gap-2 mb-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-sky-500
                                    flex items-center justify-center text-[11px] font-bold text-[#0d1117] shrink-0">
                      {userInitial}
                    </div>
                  ) : (
                    <img
                      src={logo}
                      alt="AI"
                      className="w-7 h-7 rounded-full border border-[#30363d] object-cover shrink-0"
                    />
                  )}
                  <span className="text-[12px] font-semibold text-gray-500">
                    {msg.role === 'user' ? (user?.name || user?.email || 'You') : 'Med Mind AI'}
                  </span>
                  <span className="text-[11px] text-gray-700">
                    {moment(msg.timestamp).fromNow()}
                  </span>
                </div>

                {/* Bubble */}
                <div className={`
                  max-w-[80%] sm:max-w-[75%] px-4 py-3 text-[14px] leading-relaxed rounded-2xl
                  ${msg.role === 'user'
                    ? 'bg-[#1a2435] border border-teal-400/20 text-gray-100 rounded-br-sm'
                    : 'bg-[#161b22] border border-[#21262d] text-gray-200 rounded-bl-sm'}
                `}>
                  {renderFileAttachment(msg?.file)}
                  <div className={msg.role !== 'user' ? 'prose prose-invert prose-sm max-w-none' : ''}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {/* Copy for AI */}
                {msg.role !== 'user' && (
                  <button
                    onClick={() => handleCopy(msg.content, msg._id)}
                    className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg
                               text-[11px] text-gray-600 hover:text-teal-400
                               hover:bg-teal-400/10 transition-colors"
                  >
                    {copiedId === msg._id
                      ? <><FaCheck size={10} className="text-teal-400" /><span className="text-teal-400">Copied!</span></>
                      : <><FaCopy size={10} /><span>Copy</span></>
                    }
                  </button>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={logo} alt="AI" className="w-7 h-7 rounded-full border border-[#30363d] object-cover" />
                  <span className="text-[12px] font-semibold text-gray-500">Med Mind AI</span>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-2xl rounded-bl-sm px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"
                        style={{ animation: 'typingBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {!select && <div ref={bottomRef} />}
      </div>

      {/* ══ Input bar ══ */}
      <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-4 pt-6
                      bg-gradient-to-t from-[#10161e] via-[#10161e]/90 to-transparent">
        <div className="max-w-3xl mx-auto">

          {/* Disabled overlay hint when no credits */}
          {noCredits && (
            <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2.5 rounded-xl
                            bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-[13px] font-medium">
                ⚠ Out of credits —
              </span>
              <button
                onClick={() => window.location.href = '/buy-credits'}
                className="text-[13px] font-bold text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
              >
                Buy more
              </button>
            </div>
          )}

          <div className={`flex flex-col rounded-2xl
                          bg-[#161b22] border shadow-[0_-8px_30px_rgba(0,0,0,0.4)]
                          transition-colors
                          ${noCredits
                            ? 'border-red-500/20 opacity-60 pointer-events-none'
                            : 'border-[#30363d] focus-within:border-teal-500/40'}`}>

            {/* ── Pending file preview (inside the input box, above the textarea row) ── */}
            {pendingFile && (
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl
                                bg-[#0d1117] border border-[#30363d] max-w-[240px]">
                  {pendingFile.type === 'image' ? (
                    <img
                      src={pendingFile.previewUrl}
                      alt="preview"
                      className="w-10 h-10 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-teal-400/10 border border-teal-400/20
                                    flex items-center justify-center shrink-0">
                      {pendingFile.file.name?.endsWith('.pdf')
                        ? <FaFilePdf size={16} className="text-teal-400" />
                        : <FaFileLines size={16} className="text-teal-400" />
                      }
                    </div>
                  )}
                  <span className="text-[12px] text-gray-300 truncate max-w-[130px]">
                    {pendingFile.file.name}
                  </span>
                  {/* Remove file button */}
                  <button
                    onClick={removePendingFile}
                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 flex items-center justify-center
                               rounded-full bg-[#30363d] hover:bg-red-500/80
                               text-gray-400 hover:text-white transition-colors"
                    aria-label="Remove file"
                  >
                    <ImCross size={7} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Textarea + buttons row ── */}
            <div className="flex items-end gap-2 px-3 py-2">

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />

              {/* Attach */}
              <button
                onClick={handleFileClick}
                disabled={uploading || !select || noCredits}
                className="flex items-center justify-center w-8 h-8 rounded-lg mb-0.5
                           text-gray-600 hover:text-teal-400 hover:bg-teal-400/10
                           transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                aria-label="Attach file"
              >
                {uploading
                  ? <span className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  : <FaPlus size={13} />
                }
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => { setMessage(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={!select || sending || noCredits}
                placeholder={
                  noCredits
                    ? 'No credits left. Buy more to continue…'
                    : select
                      ? 'Ask a medical question… (Enter to send)'
                      : 'Select a chat to start messaging'
                }
                className="flex-1 bg-transparent outline-none resize-none text-[14px] text-gray-200
                           placeholder-gray-600 py-2 leading-snug disabled:cursor-not-allowed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && !pendingFile) || !select || noCredits}
                className="flex items-center justify-center w-8 h-8 rounded-xl mb-0.5 shrink-0
                           bg-gradient-to-br from-teal-400 to-sky-500 text-[#0d1117]
                           hover:opacity-85 hover:scale-105 active:scale-95
                           transition-all duration-150
                           disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:scale-100
                           disabled:from-transparent disabled:to-transparent disabled:bg-[#21262d] disabled:text-gray-600"
                aria-label="Send message"
              >
                {sending
                  ? <span className="w-3.5 h-3.5 border-2 border-[#0d1117] border-t-transparent rounded-full animate-spin" />
                  : <IoSend size={14} />
                }
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-2">
            Med Mind AI may make mistakes. Always consult a qualified professional for medical advice.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

    </div>
  )
}

export default Messages