"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Phone, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendContactEmail } from "@/app/actions/contact";

export function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organizationType: "Ministry / NGO",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const result = await sendContactEmail(formData);
      if (result.success) {
        setStatus("success");
        setFormData({
          fullName: "",
          email: "",
          organizationType: "Ministry / NGO",
          message: ""
        });
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("An unexpected error occurred.");
    }
  };

  return (
    <section id="contact" className="bg-gray-950 py-16 md:py-28 px-6 md:px-12">
      <div className="max-w-[1180px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <div className="font-mono text-[0.72rem] font-medium text-gold tracking-[0.14em] uppercase mb-3.5 flex items-center justify-center gap-2.5">
            <span className="w-6 h-[1.5px] bg-gold rounded-sm" />
            Get In Touch
          </div>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3rem)] font-semibold text-white leading-[1.15] mb-4">
            Start a Conversation
          </h2>
          <p className="text-[1rem] leading-[1.7] text-gray-400 font-light max-w-[560px] mx-auto">
            Ready to build something with purpose? We&apos;re here to help you navigate the technical landscape and build the frameworks your mission needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {[
              { icon: Mail, label: "Email Us", val: "hello@zionbuild.com" },
              { icon: Phone, label: "Call Us", val: "+63 (900) 123 4567" },
              { icon: MessageSquare, label: "Office", val: "Manila, Philippines" },
            ].map(item => (
              <div key={item.label} className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 bg-gold/12 border border-solid border-gold/12 rounded-lg flex items-center justify-center">
                  <item.icon size={16} className="text-gold" />
                </div>
                <div>
                  <h4 className="text-[0.82rem] font-semibold text-white mb-0.5">{item.label}</h4>
                  <p className="text-[0.85rem] text-gray-400 font-light">{item.val}</p>
                </div>
              </div>
            ))}

            <div className="mt-2 p-5 bg-gold/4 border border-solid border-gold/10 rounded-xl">
              <p className="text-[0.82rem] leading-[1.6] text-gray-400 font-light">
                <strong>Response Time:</strong> We typically respond to new inquiries within 24 business hours. We&apos;re looking forward to hearing about your vision.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div 
                   key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gold/5 border border-solid border-gold/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[400px]"
                >
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} className="text-gold" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Message Sent!</h3>
                  <p className="text-gray-400 font-light max-w-sm mb-8">
                    Thank you for reaching out. We&apos;ve received your inquiry and will get back to you shortly.
                  </p>
                  <Button variant="outline" onClick={() => setStatus("idle")}>
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-4"
                  onSubmit={handleSubmit}
                >
                  {status === "error" && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-solid border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-[0.85rem]"
                    >
                      <AlertCircle size={18} />
                      <p>{errorMessage}</p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.72rem] font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe" 
                        className="p-3.5 bg-gray-900 border border-solid border-gray-800 rounded-lg text-white font-body text-[0.88rem] outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(205,162,70,0.1)] placeholder:text-gray-600"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[0.72rem] font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@organization.org" 
                        className="p-3.5 bg-gray-900 border border-solid border-gray-800 rounded-lg text-white font-body text-[0.88rem] outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(205,162,70,0.1)] placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.72rem] font-semibold text-gray-500 uppercase tracking-wider">Organization Type</label>
                    <select 
                      name="organizationType"
                      value={formData.organizationType}
                      onChange={handleChange}
                      className="p-3.5 bg-gray-900 border border-solid border-gray-800 rounded-lg text-white font-body text-[0.88rem] outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(205,162,70,0.1)] cursor-pointer"
                    >
                      <option value="Ministry / NGO">Ministry / NGO</option>
                      <option value="Local Church">Local Church</option>
                      <option value="Faith-Based Business">Faith-Based Business</option>
                      <option value="Individual Project">Individual Project</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.72rem] font-semibold text-gray-500 uppercase tracking-wider">Message</label>
                    <textarea 
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your mission and what you're looking to build..." 
                      className="p-3.5 bg-gray-900 border border-solid border-gray-800 rounded-lg text-white font-body text-[0.88rem] outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(205,162,70,0.1)] placeholder:text-gray-600 min-h-[140px] resize-vertical"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="gold" 
                    className="self-start mt-2 px-10 min-w-[180px]"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? (
                      <span className="flex items-center gap-2">
                        Sending <Loader2 size={16} className="animate-spin" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message <Send size={16} />
                      </span>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
