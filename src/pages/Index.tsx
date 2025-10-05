import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Sun, Moon, LogOut, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import html2pdf from 'html2pdf.js'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import { supabase } from "@/integrations/supabase/client"
import './CodeReview.css'
import './HistoryStyles.css'

const Index = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('codeReview')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })
  const [language, setLanguage] = useState('javascript')
  const [userLevel, setUserLevel] = useState('intermediate')
  const [code, setCode] = useState(` function sum() {
  return 1 + 1
}`)
  const [review, setReview] = useState(``)
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [history, setHistory] = useState<Array<any>>([])

  const codeTemplates: Record<string, string> = {
    javascript: ` function sum(a, b) {
  return a + b;
}`,
    python: `def sum(a, b):
    return a + b`,
    java: `public class Main {
    public static int sum(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println(sum(1, 1));
    }
}`,
    csharp: `using System;

public class Program {
    public static int Sum(int a, int b) {
        return a + b;
    }

    public static void Main() {
        Console.WriteLine(Sum(1, 1));
    }
}`,
    markup: `<div class="example">
  <h1>Hello World</h1>
  <p>This is an example of HTML markup</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</div>`,
    php: `<?php
function sum($a, $b) {
    return $a + $b;
}

echo sum(1, 1);
?>`,
    ruby: `def sum(a, b)
  a + b
end

puts sum(1, 1)`,
    go: `package main

import "fmt"

func sum(a, b int) int {
    return a + b
}

func main() {
    fmt.Println(sum(1, 1))
}`,
    typescript: `function sum(a: number, b: number): number {
  return a + b;
}

console.log(sum(1, 1));`
  }

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadHistory()
      } else {
        navigate('/auth')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadHistory()
      } else {
        navigate('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    prism.highlightAll()
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!code.trim() || code === codeTemplates[Object.keys(codeTemplates)[0]]) {
      setCode(codeTemplates[language] || codeTemplates.javascript)
    }
  }, [language])

  async function loadHistory() {
    const { data } = await supabase
      .from('code_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setHistory(data)
  }

  async function reviewCode() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.functions.invoke('code-review', {
        body: { code, language, userLevel }
      })

      if (error) throw error

      if (data.success) {
        setReview(data.review)
        
        // Save to history
        await supabase.from('code_reviews').insert({
          user_id: user?.id,
          code,
          language,
          review: data.review,
          user_level: userLevel
        })
        
        loadHistory()
      } else {
        setReview('Error analyzing code: ' + (data.error || 'Unknown error'))
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error analyzing code:', error)
      setReview('Error analyzing code. Please try again.')
      setIsLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  function downloadPDF() {
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.5; color: #000;">
        <h1 style="text-align: center; margin-bottom: 30px; font-size: 20pt;">Code Review Report</h1>
        
        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px;">Code Input</h2>
        <pre style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; font-family: 'Courier New', monospace; font-size: 10pt; white-space: pre-wrap; word-wrap: break-word;">${code}</pre>
        
        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px;">Analysis Results</h2>
        <div style="font-size: 11pt;">${review}</div>
      </div>
    `
    
    const opt = {
      margin: [1, 1.25, 1, 1.25], // Top, Right, Bottom, Left in inches
      filename: 'code-review-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }
    
    html2pdf().set(opt).from(element).save()
    toast({
      title: "PDF Downloaded",
      description: "Your code review report has been saved with A4 formatting.",
    })
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: chatInput,
          context: chatMessages.map(msg => ({
            content: msg.content,
            isUser: msg.role === 'user'
          }))
        }
      })

      if (error) throw error

      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (data.error || 'Unknown error') }])
      }
    } catch (error) {
      console.error('Error in chat:', error)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  function resetApp() {
    setCode(codeTemplates[language] || codeTemplates.javascript)
    setReview('')
    toast({
      title: "Reset Complete",
      description: "Code editor and results have been cleared.",
    })
  }

  function copyCode() {
    // Extract code blocks from the markdown review
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g
    const matches = [...review.matchAll(codeBlockRegex)]
    
    if (matches.length > 0) {
      // Copy the last code block (usually the corrected version)
      const correctedCode = matches[matches.length - 1][1]
      navigator.clipboard.writeText(correctedCode)
      toast({
        title: "Code Copied!",
        description: "Corrected code has been copied to clipboard.",
      })
    } else {
      // If no code blocks, copy the entire review
      navigator.clipboard.writeText(review)
      toast({
        title: "Content Copied!",
        description: "Review content has been copied to clipboard.",
      })
    }
  }

  if (!user) return null

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <aside className="sidebar">
        <div className="logo">CodeReview AI</div>
        <nav>
          <ul>
            <li className={activeTab === 'codeReview' ? 'active' : ''} onClick={() => setActiveTab('codeReview')}>Code Review</li>
            <li className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</li>
            <li className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>Chat</li>
            <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" onClick={handleSignOut}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <main>
        {activeTab === 'codeReview' && (
          <>
            <div className="left">
              <div className="code-header">
                <h3>Code Editor</h3>
                <div className="language-selector">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="select-input"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="typescript">TypeScript</option>
                  </select>
                </div>
              </div>
              <div className="code">
                <Editor
                  value={code}
                  onValueChange={code => setCode(code)}
                  highlight={code => {
                    const lang = language.toLowerCase();
                    const grammar = prism.languages[lang] || prism.languages.javascript;
                    return prism.highlight(code, grammar, lang);
                  }}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    height: "100%",
                    width: "100%",
                    overflow: 'auto',
                    minHeight: '500px',
                    flex: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                  }}
                  className="dynamic-editor"
                />
              </div>
              <div className="action-buttons">
                <button onClick={resetApp} className="action-btn reset-btn">
                  Reset
                </button>
                <button onClick={reviewCode} className="action-btn analyze-btn" disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Analyze Code'}
                </button>
                {review && (
                  <>
                    <button onClick={copyCode} className="action-btn copy-btn">
                      Copy Code
                    </button>
                    <button onClick={downloadPDF} className="action-btn download-btn">
                      <Download size={18} /> Download PDF
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="right">
              <div className="result-header">
                <h3>Analysis Results</h3>
              </div>
              <div className="result-content">
                {review ? (
                  <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
                ) : (
                  <div className="placeholder-text">Click "Analyze Code" to see results here</div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="history-container">
            <h2>Review History</h2>
            <div className="history-list">
              {history.length === 0 ? (
                <div className="placeholder-text">No reviews yet. Start analyzing code to build your history!</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="history-item" onClick={() => {
                    setCode(item.code)
                    setReview(item.review)
                    setLanguage(item.language)
                    setActiveTab('codeReview')
                  }}>
                    <div className="history-header">
                      <span className="history-language">{item.language}</span>
                      <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="history-preview">{item.code.substring(0, 100)}...</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-welcome">
                  <h2>AI Assistant</h2>
                  <p>Ask me anything about coding, education, or roadmaps!</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}`}>
                    <div className="message-content">
                      <Markdown rehypePlugins={[rehypeHighlight]}>{msg.content}</Markdown>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleChat} className="chat-input-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="chat-input"
                disabled={isChatLoading}
              />
              <button type="submit" className="send-btn" disabled={isChatLoading}>
                {isChatLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2>Settings</h2>

            <div className="settings-section">
              <h3>Appearance</h3>
              <div className="setting-item">
                <label>Theme</label>
                <div className="toggle-switch">
                  <span className={!darkMode ? 'active' : ''}>Light</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={() => setDarkMode(!darkMode)}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span className={darkMode ? 'active' : ''}>Dark</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Code Analysis</h3>
              <div className="setting-item">
                <label>Programming Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-select"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="markup">HTML</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="go">Go</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>

              <div className="setting-item">
                <label>User Level</label>
                <select
                  value={userLevel}
                  onChange={(e) => setUserLevel(e.target.value)}
                  className="select-input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Index
