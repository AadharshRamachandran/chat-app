import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Play, Pause } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const audioRefs = useRef({});

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleAudioPlayPause = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;

    if (audio.paused) {
      Object.values(audioRefs.current).forEach((a) => a.pause()); // Pause all other audios
      audio.play();
    } else {
      audio.pause();
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {/* Image Message */}
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}

              {/* Text Message */}
              {message.text && <p>{message.text}</p>}

              {/* Audio Message - WhatsApp Style */}
              {message.audio && (
                <div
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 cursor-pointer"
                  onClick={() => handleAudioPlayPause(message._id)}
                >
                  <button>
                    <Play className="w-6 h-6 text-blue-500" />
                  </button>
                  <audio
                    ref={(el) => (audioRefs.current[message._id] = el)}
                    src={message.audio}
                    onPlay={(e) => (e.target.previousSibling.firstChild.className = "w-6 h-6 text-red-500")}
                    onPause={(e) => (e.target.previousSibling.firstChild.className = "w-6 h-6 text-blue-500")}
                  />
                  <span className="text-sm text-gray-600">Audio message</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
