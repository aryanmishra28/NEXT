import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { useAuth } from "./AuthContext";
import ReactMarkdown from "react-markdown";

type Message = {
  sender: "user" | "ai";
  text: string;
};

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 15); // typing speed (ms)

    return () => clearInterval(interval);
  }, [text]);

  return <>{displayedText}</>;
}

export function AICareerChat() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "👋 **Hi! I am your AI Career Mentor.**\n\nAsk me about:\n- Career roadmaps\n- Placements & internships\n- Skills to learn\n- Tech stacks (MERN, Java, Backend, etc.)",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/ai/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: userMessage }),
        }
      );

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.reply || "No response from AI." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ **Unable to reach AI service.** Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] p-4 text-white text-center text-xl font-semibold">
        AI Career Mentor
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-2xl shadow ${
                msg.sender === "user"
                  ? "bg-[#6A0DAD] text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {/* Sender */}
              <div className="flex items-center gap-2 mb-2 text-sm opacity-80">
                {msg.sender === "user" ? (
                  <User size={14} />
                ) : (
                  <Bot size={14} />
                )}
                <span>
                  {msg.sender === "user" ? user?.name || "You" : "AI Mentor"}
                </span>
              </div>

              {/* ✅ Markdown Rendering */}
              <div className="prose prose-sm max-w-none prose-ul:pl-4 prose-ol:pl-4">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl shadow text-gray-500">
              🤖 AI is thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your career question..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
