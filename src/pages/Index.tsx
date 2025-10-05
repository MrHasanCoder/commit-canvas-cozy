import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import { supabase } from "@/integrations/supabase/client"
import './CodeReview.css'

const Index = () => {
  const [activeTab, setActiveTab] = useState('codeReview')
  const [darkMode, setDarkMode] = useState(true)
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
    prism.highlightAll()
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!code.trim() || code === codeTemplates[Object.keys(codeTemplates)[0]]) {
      setCode(codeTemplates[language] || codeTemplates.javascript)
    }
  }, [language])

  async function reviewCode() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.functions.invoke('code-review', {
        body: { code, language, userLevel }
      })

      if (error) throw error

      if (data.success) {
        setReview(data.review)
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
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <aside className="sidebar">
        <div className="logo">Smart Code Analysis</div>
        <nav>
          <ul>
            <li className={activeTab === 'codeReview' ? 'active' : ''} onClick={() => setActiveTab('codeReview')}>Code Review</li>
            <li className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>Chat</li>
            <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</li>
          </ul>
        </nav>
        <button className="reset-btn" onClick={resetApp}>Reset</button>
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
                <button onClick={reviewCode} className="action-btn analyze-btn" disabled={isLoading}>
                  {isLoading ? 'Analyzing...' : 'Analyze Code'}
                </button>
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
