"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { Footer } from "@/components/footer";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";

export default function ContactsPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: "", message: "" });

  const contacts = [
    {
      icon: Mail,
      title: t("contacts.contact_email_title"),
      value: "wellify_group@proton.me",
      description: t("contacts.contact_email_desc"),
    },
    {
      icon: MessageCircle,
      title: t("contacts.contact_tg_title"),
      value: "@shiftflow_bot",
      description: t("contacts.contact_tg_desc"),
    },
    {
      icon: MapPin,
      title: t("contacts.contact_office_title"),
      value: "Kyiv, Ukraine",
      description: t("contacts.contact_office_desc"),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form:", formData);
    // Reset form
    setFormData({ name: "", message: "" });
  };

  return (
    <main className="relative min-h-screen bg-background pt-24">
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-16 text-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            {t("contacts.title")}
          </motion.h1>

          <div className="grid gap-6 sm:grid-cols-3">
            {contacts.map((contact, index) => {
              const Icon = contact.icon;
              return (
                <motion.div
                  key={contact.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                  className="glass-card p-8"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight text-card-foreground">
                    {contact.title}
                  </h3>
                  <p className="mb-1 text-lg font-semibold text-card-foreground">
                    {contact.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contact.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className="mt-12"
          >
            <div className="glass-card bg-card p-8">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-card-foreground">
                {t("contacts.contact_title")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-card-foreground"
                  >
                    {t("contacts.form_name")}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base text-card-foreground placeholder:text-muted-foreground focus:border-white/30 focus:outline-none focus:ring-0 shadow-inner"
                    placeholder={t("contacts.form_name")}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-card-foreground"
                  >
                    {t("contacts.form_message")}
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-base text-card-foreground placeholder:text-muted-foreground focus:border-white/30 focus:outline-none focus:ring-0 shadow-inner"
                    placeholder={t("contacts.form_message")}
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("contacts.form_btn")}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

