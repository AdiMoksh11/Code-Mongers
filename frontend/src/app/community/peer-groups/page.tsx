"use client";
import React, { useState } from "react";

const fields = ["Engineering", "Marketing", "Design", "Finance", "Healthcare"];

interface Message {
  id: number;
  text: string;
  group: string;
}

export default function PeerGroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState(fields[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([
      ...messages,
      { id: Date.now(), text: input, group: selectedGroup },
    ]);
    setInput("");
  };

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Peer Groups</h2>
      <div className="mb-6 flex gap-4">
        {fields.map((field) => (
          <button
            key={field}
            className={`px-4 py-2 rounded border font-medium transition-colors ${selectedGroup === field ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-700 hover:bg-blue-100"}`}
            onClick={() => setSelectedGroup(field)}
          >
            {field}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">{selectedGroup} Group Discussion</h3>
        <div className="mb-4 max-h-64 overflow-y-auto">
          {messages.filter(m => m.group === selectedGroup).length === 0 ? (
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          ) : (
            messages.filter(m => m.group === selectedGroup).map(m => (
              <div key={m.id} className="mb-2 p-2 bg-gray-50 rounded">
                {m.text}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
