"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import api from "@/utils/axios";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { ArrowRight } from "lucide-react";

// Define the shape of a user for type safety.
interface User {
  fullName: {
    firstName: string;
    lastName: string;
  };
  profilePic: string;
}

// Define the shape of a comment.
interface Comment {
  text: string;
}

// Define the shape of a post.
interface Post {
  id: number;
  name: string;
  profilePic: string;
  text: string;
  image?: string;
  likes: number;
  liked?: boolean;
  comments: Comment[];
}

// Define the shape of a message in a peer group.
interface Message {
  id: number;
  text: string;
  group: string | null; // Group can be null
}

// Define the shape of an event row's props.
interface EventRowProps {
  date: string;
  name: string;
  type: string;
}

const eventRows = [
  { date: "2025-09-25", name: "Web3 Credentials Workshop", type: "Workshop" },
  { date: "2025-10-02", name: "Next.js Training", type: "Training" },
  { date: "2025-10-10", name: "Digital Badges Webinar", type: "Webinar" },
];

function EventRow({ date, name, type }: EventRowProps) {
  const [rsvp, setRsvp] = useState<boolean>(false);
  const [reminder, setReminder] = useState<boolean>(false);
  return (
    <tr className="border-b">
      <td className="p-2">{date}</td>
      <td className="p-2 font-semibold">{name}</td>
      <td className="p-2">{type}</td>
      <td className="p-2">
        <button
          className={`px-3 py-1 rounded ${
            rsvp ? "bg-green-500 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          onClick={() => setRsvp(!rsvp)}
        >
          {rsvp ? "Registered" : "RSVP"}
        </button>
      </td>
      <td className="p-2">
        <button
          className={`px-3 py-1 rounded ${
            reminder ? "bg-purple-500 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          onClick={() => setReminder(!reminder)}
        >
          {reminder ? "Reminder Set" : "Set Reminder"}
        </button>
      </td>
    </tr>
  );
}

export default function CommunityPage() {
  // State and handlers

  // ...existing code...

  // ...existing code...
  const [section, setSection] = useState<string>("peer-groups");
  // Discussion Section
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch user info from backend
    const token = localStorage.getItem("authToken");
    if (!token) return;
    api.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const [commentText, setCommentText] = useState<string>("");

  const handlePost = () => {
    if (text.trim() === "" && !image) return;
    setPosts([
      {
        id: Date.now(),
        name: user?.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : "Anonymous",
        profilePic: user?.profilePic || "/images/default-profile.png",
        text,
        image,
        likes: 0,
        comments: [],
      },
      ...posts,
    ]);
    setText("");
    setImage(undefined);
  };
  
  const handleLike = (id: number) => {
    setPosts(posts.map(post => post.id === id ? { ...post, likes: post.likes + 1, liked: true } : post));
  };
  
  const handleComment = (id: number) => {
    if (commentText.trim() === "") return;
    setPosts(posts.map(post => post.id === id ? { ...post, comments: [...post.comments, { text: commentText }] } : post));
    setCommentText("");
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Peer Groups Section
  interface Field {
    name: string;
    img: string;
    members: number;
  }
  const initialFields: Field[] = [
    { name: "Cybersecurity", img: "/images/cybersecurity.png", members: 12 },
    { name: "Blockchain", img: "/images/blockchain.png", members: 8 },
    { name: "AI", img: "/images/ai.png", members: 15 },
    { name: "Web Development", img: "/images/webdev.png", members: 20 },
    { name: "Data Science", img: "/images/datascience.png", members: 10 },
    { name: "Cloud Computing", img: "/images/cloud.png", members: 7 },
    { name: "IoT", img: "/images/iot.png", members: 5 },
    { name: "DevOps", img: "/images/devops.png", members: 9 },
    { name: "UI/UX Design", img: "/images/uiux.png", members: 6 },
    { name: "Mobile Development", img: "/images/mobile.png", members: 11 },
  ];
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [joinedGroup, setJoinedGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([
      ...messages,
      { id: Date.now(), text: input, group: joinedGroup },
    ]);
  };
  return (
    <div className="bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen">
      {/* Fixed nav bar at top */}
  <div className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between px-6 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <ArrowRight
            className="h-5 w-5 text-blue-500 dark:text-blue-400 rotate-180 cursor-pointer"
            onClick={() => window.history.back()}
          />
          <span className="text-xl font-bold text-black dark:text-gray-100">Credexa</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-6">Community</span>
          <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
        </div>
      </div>
      {/* Spacer for fixed nav bar */}
      <div className="h-12" />
      {/* Horizontal tab navigation, left-aligned below nav bar */}
      <div className="w-full flex flex-row items-start mt-6 mb-8 px-8 gap-8">
        <div style={{ width: '60vw' }}>
          <div className="flex-1 flex flex-col">
          <nav className="flex gap-4 bg-white dark:bg-zinc-800 px-6 py-3 shadow-md rounded-xl border border-gray-200 dark:border-zinc-700">
          {[
            { key: "peer-groups", label: "Peer Groups" },
            { key: "discussion", label: "Discussion" },
            { key: "events", label: "Events" },
            { key: "gamification", label: "Gamification" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSection(tab.key)}
              className={`px-5 py-2 rounded-full font-semibold transition-all duration-150 ${
                section === tab.key
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow"
                  : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-black dark:hover:bg-blue-800 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
          {/* Only the selected tab's content will appear below the nav */}
          {section === "discussion" && (
            <div className="mb-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-blue-100 px-6 py-3 mt-10" style={{ width: '60vw' }}>
              <h2
                className="text-xl font-bold mb-4 text-black dark:text-white transition-colors duration-200 hover:text-blue-400 cursor-pointer"
              >
                Discussion
              </h2>
              <div className="flex flex-col gap-2 mb-4">
                <textarea
                          className="w-full p-2 border border-gray-300 dark:border-white bg-white dark:bg-black text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 resize-none"
                  rows={2}
                  placeholder="Share your thoughts..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded font-bold shadow hover:bg-blue-700 transition"
                  onClick={handlePost}
                >
                  Post
                </button>
              </div>
              <div className="mt-6">
                {posts.length === 0 ? (
                  <p className="text-gray-400 text-center">No posts yet.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="mb-4 bg-white dark:bg-zinc-900 rounded-lg p-3 border border-gray-200 shadow flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="8" r="4" fill="#bdbdbd" />
                          <rect x="4" y="16" width="16" height="6" rx="3" fill="#bdbdbd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-black dark:text-white text-sm">{post.name}</span>
                        </div>
                        <p className="mb-2 text-black dark:text-white text-sm">{post.text}</p>
                        {post.image && (
                          <img src={post.image} alt="Post" className="max-w-xs mb-2 rounded-lg border" />
                        )}
                        <div className="flex gap-2 mt-2 items-center">
                          <button
                            className={`w-6 h-6 flex items-center justify-center rounded transition ${
                              post.liked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => handleLike(post.id)}
                            title="Like"
                            style={{ border: 'none', outline: 'none', position: 'relative' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M6.5 14V7.5L10.5 2.5C10.5 2.5 11.5 2.5 11.5 4.5C11.5 6.5 9.5 7.5 9.5 7.5H13C13.5 7.5 14 8 14 8.5V13C14 13.5 13.5 14 13 14H6.5Z"
                                stroke={post.liked ? '#2563eb' : '#222'}
                                strokeWidth="1.2"
                                fill={post.liked ? '#2563eb' : 'white'}
                              />
                            </svg>
                          </button>
                          <span className="ml-1 text-xs font-semibold text-black dark:text-white">{post.likes}</span>
                          <span className="ml-3"></span>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300 shadow-sm"
                            onClick={e => {
                              e.preventDefault();
                              setActiveCommentId(activeCommentId === post.id ? null : post.id);
                            }}
                            title="Comment"
                            style={{ outline: 'none' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="2" y="4" width="12" height="8" rx="2" stroke="#222" strokeWidth="1.2" fill="white" />
                            </svg>
                          </button>
                          <span className="ml-1 text-xs font-semibold text-black dark:text-white">{post.comments.length}</span>
                        </div>
                        {activeCommentId === post.id && (
                          <div className="flex flex-col gap-2 mt-2 p-2 rounded" style={{ maxHeight: '120px', overflowY: 'auto', background: '#f6f6f6' }}>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                className="border border-blue-900 dark:border-zinc-700 rounded px-2 py-1 text-xs flex-1 text-black dark:text-black"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                              />
                              <button
                                className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition"
                                onClick={() => { handleComment(post.id); }}
                              >
                                Comment
                              </button>
                            </div>
                            <div className="mt-2 ml-2" style={{ maxHeight: '70px', overflowY: 'auto' }}>
                              {post.comments.length > 0 ? post.comments.map((c, idx) => (
                                <div key={idx} className="text-black text-xs mb-1 font-bold">{c.text}</div>
                              )) : <span className="text-gray-400 text-xs">No comments yet.</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Only the selected tab's content will appear below the nav */}
          {section === "peer-groups" && (
            <div className="mb-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-blue-100 px-6 py-3 mt-10" style={{ width: '60vw' }}>
            <h2
              className="text-2xl font-bold mb-4 text-black dark:text-white transition-colors duration-200 hover:text-blue-400 cursor-pointer"
            >
              Peer Groups
            </h2>
            {/* Search bar for groups */}
            {!joinedGroup && (
              <div className="mb-6 flex justify-center">
                <input
                  type="text"
                  className="w-full max-w-md border rounded px-4 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  placeholder="Search for a group..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>
            )}
            {/* Filter groups by search input */}
            {!joinedGroup && (
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
                {fields.filter(field => field.name.toLowerCase().includes(input.toLowerCase())).map((field, idx) => (
                  <div key={field.name} className="flex flex-col items-center justify-center w-full h-56 rounded-xl border-2 font-semibold transition-colors shadow-lg bg-white hover:bg-blue-50 border-gray-200 p-4">
                    <img src={field.img} alt={field.name} className="w-16 h-16 mb-2 object-contain" />
                    <span className="text-lg font-bold text-black dark:text-black mb-2">{field.name}</span>
                    <button
                      className="px-6 py-2 rounded-full bg-gray-300 text-black dark:text-black font-semibold shadow hover:bg-white hover:text-black transition text-base mt-2 cursor-pointer"
                      onClick={() => {
                        setJoinedGroup(field.name);
                        setFields(fields.map(f => f.name === field.name ? { ...f, members: f.members + 1 } : f));
                      }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Show member count only inside group chat */}
            {joinedGroup && (
              <div className="flex gap-6">
                {/* Sidebar with remaining groups */}
                <div className="hidden md:flex flex-col w-48 bg-gray-50 dark:bg-zinc-900 rounded-xl shadow p-4 border border-blue-100 mr-4">
                  <h4
                    className="flex items-center text-md font-bold mb-3 text-blue-600 dark:text-blue-300 cursor-pointer"
                    onClick={() => setJoinedGroup(null)}
                  >
                    <ArrowRight className="h-5 w-5 mr-2 rotate-180" /> Peer Groups
                  </h4>
                  {fields.filter(f => f.name !== joinedGroup).map(f => (
                    <div key={f.name} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-200">{f.name}</span>
                      <button
                        className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium hover:bg-white hover:text-black transition cursor-pointer"
                        onClick={() => {
                          setJoinedGroup(f.name);
                          setFields(fields.map(field => field.name === f.name ? { ...field, members: field.members + 1 } : field));
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
                {/* Main group chat area */}
                <div className="flex-1 bg-white rounded-xl shadow p-4 border border-blue-100">
                  <div className="flex gap-2 mb-2 flex-col items-start">
                      <h3 className="text-lg font-semibold text-black dark:text-black mb-1">{joinedGroup}</h3>
                      <span className="text-sm font-semibold text-black dark:text-black mb-2">{fields.find(f => f.name === joinedGroup)?.members} members</span>
                  </div>
                  <div className="mb-4 max-h-56 overflow-y-auto flex flex-col gap-2">
                      {messages.filter(m => m.group === joinedGroup).length === 0 ? (
                        <p className="text-black dark:text-black text-center font-semibold">No messages yet. Start texting!</p>
                    ) : (
                      messages.filter(m => m.group === joinedGroup).map(m => (
                        <div key={m.id} className="self-start max-w-xs bg-blue-50 dark:bg-zinc-800 rounded-lg px-4 py-2 border border-blue-200 text-gray-800 dark:text-gray-100 shadow-sm">
                          {m.text}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <input
                      className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-black dark:text-black bg-white border-blue-100 dark:border-zinc-700"
                      type="text"
                      placeholder="Enter your message..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                    />
                    <button
                      className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                      onClick={handleSend}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          {section === "events" && (
            <div className="mb-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-blue-100 px-6 py-3 mt-10" style={{ width: '60vw' }}>
            <h2
              className="text-2xl font-bold mb-4 text-black dark:text-white transition-colors duration-200 hover:text-blue-400 cursor-pointer"
            >
              Events
            </h2>
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 text-black dark:text-black">Date</th>
                    <th className="p-2 text-black dark:text-black">Event</th>
                    <th className="p-2 text-black dark:text-black">Type</th>
                    <th className="p-2 text-black dark:text-black">RSVP</th>
                    <th className="p-2 text-black dark:text-black">Reminder</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((props, idx) => <EventRow key={idx} {...props} />)}
                </tbody>
              </table>
            </div>
            <div className="text-gray-500 text-center">Click RSVP to register and set a reminder for upcoming events!</div>
          </div>
        )}
          {section === "gamification" && (
            <div className="mb-10 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-blue-100 px-6 py-3 mt-10" style={{ width: '60vw' }}>
            <h2
              className="text-xl font-bold mb-4 text-black dark:text-white transition-colors duration-200 hover:text-blue-400 cursor-pointer"
            >
              Gamification & Recognition
            </h2>
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col items-center">
                <span className="inline-block bg-yellow-400 text-white px-4 py-2 rounded-full font-bold mb-2 shadow">🏅 Top Contributor</span>
                <span className="text-gray-700">Awarded for most posts & likes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="inline-block bg-blue-400 text-white px-4 py-2 rounded-full font-bold mb-2 shadow">🎓 Skill Mentor</span>
                <span className="text-gray-700">Awarded for helping others</span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">Leaderboard</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 text-black dark:text-black">Rank</th>
                    <th className="p-2 text-black dark:text-black">User</th>
                    <th className="p-2 text-black dark:text-black">Points</th>
                    <th className="p-2 text-black dark:text-black">Badge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-bold">1</td>
                    <td className="p-2">Alice</td>
                    <td className="p-2">1200</td>
                    <td className="p-2">🏅 Top Contributor</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-bold">2</td>
                    <td className="p-2">Bob</td>
                    <td className="p-2">950</td>
                    <td className="p-2">🎓 Skill Mentor</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">3</td>
                    <td className="p-2">Charlie</td>
                    <td className="p-2">800</td>
                    <td className="p-2">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-gray-500 text-center">Earn badges and points by posting, commenting, and helping others!</div>
          </div>
        )}
        </div>
        {/* Right-side column for both section bars */}
  <div className="hidden md:flex flex-col gap-8" style={{ position: 'absolute', right: '25px', top: '72px', width: '28vw', minWidth: '18rem', maxWidth: '32vw' }}>
          {/* Trending Skills Section Bar */}
          <aside className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-purple-200 transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
            <h3 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-2">Trending Skills</h3>
            <ul className="pl-2 text-gray-700 dark:text-gray-200 text-base mb-4 flex flex-col gap-4">
              <li className="flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer">
                <span role="img" aria-label="ML">🤖</span> Machine Learning
              </li>
              <li className="flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer">
                <span role="img" aria-label="Cybersecurity">🛡️</span> Cybersecurity
              </li>
              <li className="flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer">
                <span role="img" aria-label="Data Science">📊</span> Data Science
              </li>
              <li className="flex items-center gap-3 rounded-lg transition-colors duration-200 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer">
                <span role="img" aria-label="Cloud">☁️</span> Cloud Computing
              </li>
            </ul>
          </aside>
          {/* Social Feature & Recommendation Section Bar */}
          <aside className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-blue-100 transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-300 mb-2">Social Feature</h3>
              <div className="flex items-center gap-4 mb-4">
                <ul className="list-disc pl-4 text-gray-700 dark:text-gray-200 text-sm">
                  <li>Connect with peers</li>
                  <li>Share achievements</li>
                  <li>Direct messaging</li>
                  <li>Group chats</li>
                </ul>
                <img src="/images/card/Card-1.png" alt="Social Feature" className="rounded-xl shadow w-24 h-24 object-cover transition-transform duration-300 hover:scale-110" />
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-300 mb-2">Recommendation</h3>
                <ul className="list-disc pl-4 text-gray-700 dark:text-gray-200 text-sm">
                  <li>Suggested groups</li>
                  <li>Trending topics</li>
                  <li>Events for you</li>
                  <li>Top contributors</li>
                </ul>
              </div>
              <img src="/images/card/Card-3.png" alt="Recommendation" className="rounded-xl shadow w-24 h-24 object-cover transition-transform duration-300 hover:scale-110" />
            </div>
          </aside>
        </div>
        </div>
      </div>
    </div>
  );
}