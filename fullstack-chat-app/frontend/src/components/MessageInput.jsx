import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, MicOff, Trash } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const { sendMessage } = useChatStore();

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start a timer to show recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Microphone access denied");
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  // Cancel recording (similar to WhatsApp swipe gesture)
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setAudioBlob(null);
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    let audioBase64 = null;
    if (audioBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        audioBase64 = reader.result;
        sendMessageToStore(audioBase64);
      };
    } else {
      sendMessageToStore(null);
    }
  };

  const sendMessageToStore = async (audioBase64) => {
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioBlob && (
        <div className="mb-3 flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-40"></audio>
          <button
            onClick={removeAudio}
            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            type="button"
          >
            <Trash size={16} />
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-2 text-red-500">
          <span className="animate-pulse">● Recording {recordingTime}s</span>
          <button
            onClick={cancelRecording}
            className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* Image Upload Button */}
          <button
            type="button"
            className="btn btn-circle"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          {/* Audio Record Button */}
          <button
            type="button"
            className={`btn btn-circle ${isRecording ? "text-red-500" : ""}`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* Send Message Button */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
