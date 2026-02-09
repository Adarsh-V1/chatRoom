'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface ChatFormProps {
  username: string;
  room: string;
}

const ChatForm = ({ username, room }: ChatFormProps) => {
  const addMessage = useMutation(api.chats.addChat)
  const { register, handleSubmit, reset } = useForm()

  const onSubmit = (data: any) => {
    addMessage({ message: data.message, username, room })
    reset()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center w-full max-w-md mx-auto gap-2 p-2 bg-white text-black border rounded-lg shadow"
      autoComplete="off"
    >
      <input
        type="text"
        placeholder="Type your message..."
        {...register('message', { required: true })}
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-semibold shadow"
      >
        Send
      </button>
    </form>
  )
}

export { ChatForm }
