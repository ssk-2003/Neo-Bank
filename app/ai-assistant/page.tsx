'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react'
import { apiRequest } from '@/lib/store'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hello! I am your **NeoBank AI Financial Assistant**.\n\nI can analyze your actual transactions, budgets, savings goals, and loans to offer custom advice.\n\nTry asking me:\n- 💰 *"What is my current total balance?"*\n- 📊 *"Where do I spend the most money?"*\n- 💡 *"How can I save more?"*\n- 📈 *"Summarize my finances"*`,
        timestamp: new Date(),
      },
    ])
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
    setSending(true)

    try {
      const res = await apiRequest('/api/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      })
      if (res?.ok) {
        const json = await res.json()
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: json.reply, timestamp: new Date(json.timestamp) },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Network error. Please verify database connectivity.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <Bot size={24} className="text-[var(--neo-green)]" /> AI Financial Assistant
          </h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Get immediate insights and automated feedback on cashflow records</p>
        </div>
      </div>

      {/* Chat pane */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 neo-card relative min-h-0"
        style={{ background: '#111411' }}
      >
        <div className="space-y-4 flex flex-col">
          {messages.map((m, idx) => {
            const isAI = m.role === 'assistant'
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isAI ? 'var(--neo-green)' : 'rgba(90, 110, 90, 0.2)',
                    color: isAI ? '#050d05' : 'var(--neo-text)',
                  }}
                >
                  {isAI ? <Bot size={15} /> : <User size={15} />}
                </div>

                {/* Bubble */}
                <div className={isAI ? 'chat-bubble-ai' : 'chat-bubble-user'}>
                  <div
                    className="text-sm whitespace-pre-wrap leading-relaxed markdown-style"
                    dangerouslySetInnerHTML={{
                      __html: m.content
                        // Basic markdown parsing for bold text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^- (.*)$/gm, '• $1')
                        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded font-mono text-xs bg-black/40">$1</code>')
                    }}
                  />
                  <p className="text-[9px] mt-1.5 opacity-55 text-right">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}

          {sending && (
            <div className="flex gap-3 max-w-[80%] self-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--neo-green)', color: '#050d05' }}
              >
                <Bot size={15} />
              </div>
              <div className="chat-bubble-ai flex items-center gap-1.5 py-3 px-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0">
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your finances..."
          disabled={sending}
          className="neo-input"
          style={{ background: '#111411' }}
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={sending || !input.trim()}
          className="neo-btn neo-btn-primary px-5"
          style={{ borderRadius: '12px' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
