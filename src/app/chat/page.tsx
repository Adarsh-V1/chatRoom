import { useState } from "react"
import { ChatFeed } from "@/src/componnets/chat/chatFeed"
import { ChatForm } from "@/src/componnets/chat/chatForm"

function ChatPage() {
  const [username, setUsername] = useState("");
  const [input, setInput] = useState("");

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input.trim());
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-800 p-4">
      {username ? (
        <>
          <ChatFeed currentUser ={username} />
          <ChatForm username={username} />
        </>
      ) : (
        <form onSubmit={handleEnter} className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow max-w-xs w-full">
          <h2 className="text-xl font-bold text-slate-800">Enter your username</h2>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Your name..."
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-semibold shadow w-full"
          >
            Enter Chatroom
          </button>
        </form>
      )}
    </main>
  );
}

export default ChatPage;