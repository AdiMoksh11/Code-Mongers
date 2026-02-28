"use client";

import React, { useState, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = forwardRef<HTMLElement>((props, ref) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      setSuccess(false);
      setMessage("❌ Configuration error: Access key is missing.");
      console.error("ERROR: NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY is not set in .env.local");
      return;
    }

    formData.append("access_key", accessKey);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setMessage("✅ Message sent successfully!");
        formRef.current?.reset();
        setTimeout(() => setMessage(''), 5000);
      } else {
        setSuccess(false);
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setSuccess(false);
      setMessage("❌ An error occurred. Please try again later.");
    }
  };

  return (
    <section id="contact" ref={ref} className="pb-20 pt-10 px-6">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
          <Mail className="w-8 h-8" />
          Get in Touch
        </h2>

        <div className="flex flex-col lg:flex-row justify-center gap-8 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="w-full lg:w-[40%]"
          >
            <img
              src="/msg icon.png"
              draggable={false}
              alt="Contact Illustration"
              className="rounded-xl shadow-lg w-full h-auto object-cover max-w-md mx-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="w-full lg:w-[20%] space-y-6 text-center lg:text-left"
          >
             <p className="text-md text-gray-600 dark:text-gray-300">
              Have questions? We'd love to hear from you.
            </p>
            <div className="space-y-4 text-gray-700 dark:text-gray-200 flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                <span>credexaowns@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-pink-500" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </motion.div>

          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-full lg:w-[40%] shadow-xl rounded-xl p-8 space-y-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <input type="hidden" name="from_name" value="Credexa Contact Form" />
            <input type="hidden" name="subject" value="New Contact Message from Credexa" />
            
            <div>
              <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">Your Name</label>
              <input
                type="text" name="name" required
                placeholder="e.g., Jane Doe"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">Your Email</label>
              <input
                type="email" name="email" required
                placeholder="e.g., jane.doe@example.com"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-800 dark:text-gray-200">Your Message</label>
              <textarea
                name="message" rows={5} required
                placeholder="How can we help?"
                className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Send Message
            </button>

            {message && (
              <p className={`mt-4 text-center font-medium ${success ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
});

Contact.displayName = 'Contact';
export default Contact;
