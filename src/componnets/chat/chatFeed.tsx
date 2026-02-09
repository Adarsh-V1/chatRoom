'use client'

import React from 'react'

import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'


interface ChatFeedProps {
  currentUser?: string;
  room: string;
}

const ChatFeed = ({ currentUser, room }: ChatFeedProps) => {
  const feed = useQuery(api.chats.getChats, { room })

  return (
    <div className="flex flex-col h-[400px] w-full max-w-md mx-auto bg-white border rounded-lg shadow overflow-y-auto p-4 mb-2">
      {feed && feed.length > 0 ? (
        feed.map((chat) => (
          <div
            className={`self-start bg-blue-100 text-gray-900 px-4 py-2 rounded-2xl mb-2 max-w-[80%] shadow-sm ${currentUser === chat.username ? 'bg-green-100 self-end' : ''}`}
            key={chat._id}
          >
            <span className="font-semibold text-blue-700 mr-2">{chat.username}:</span>
            <span>{chat.message}</span>
          </div>
        ))
      ) : (
        <div className="text-gray-400 text-center my-auto">No messages yet.</div>
      )}
    </div>
  )
}

export { ChatFeed }