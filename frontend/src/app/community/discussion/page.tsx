
"use client";
import React, { useState } from "react";

interface Post {
  id: number;
  text: string;
  image?: string;
  likes: number;
}

export default function DiscussionPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const handlePost = () => {
    if (text.trim() === "" && !image) return;
    setPosts([
      {
        id: Date.now(),
        text,
        image,
        likes: 0,
      },
      ...posts,
    ]);
    setText("");
    setImage(undefined);
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(post => post.id === id ? { ...post, likes: post.likes + 1 } : post));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Discussion</h2>
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <textarea
          className="w-full p-2 border rounded mb-2"
          rows={3}
          placeholder="Share your thoughts..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handlePost}
        >
          Post
        </button>
      </div>
      <div>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="mb-6 bg-white rounded-lg shadow p-4">
              <p className="mb-2">{post.text}</p>
              {post.image && (
                <img src={post.image} alt="Post" className="max-w-xs mb-2 rounded" />
              )}
              <button
                className="text-blue-600 font-semibold"
                onClick={() => handleLike(post.id)}
              >
                👍 Like ({post.likes})
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
