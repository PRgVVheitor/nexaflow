import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { useState } from "react";
import { buildCopilotResponse } from "../lib/copilot";
import { cn } from "../lib/utils";
import { Button, Input } from "./ui";

export function FinancialCopilot({ intelligence, totals, transactions }) {
  const initialMessage = {
    id: "welcome",
    role: "assistant",
    text: "Olá! Eu sou o Mikal, seu assistente financeiro. Posso analisar seu saldo, gastos e projeções.",
  };
  const suggestions = [
    "Por que gastei mais?",
    "Quanto posso gastar este fim de semana?",
    "Qual meu saldo em 30 dias?",
  ];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([initialMessage]);

  function startNewConversation() {
    setMessages([initialMessage]);
    setInput("");
  }

  function sendMessage(question = input) {
    const text = question.trim();
    if (!text) return;

    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, role: "user", text },
      {
        id: `assistant-${timestamp}`,
        role: "assistant",
        text: buildCopilotResponse(text, transactions, totals, intelligence),
      },
    ]);
    setInput("");
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="Mikal"
            className="fixed inset-x-3 bottom-3 z-50 flex h-[min(42rem,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[26rem]"
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            role="dialog"
            transition={{ duration: 0.2 }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-zinc-800 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-400 text-zinc-950">
                  <BrainCircuit size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-zinc-50">
                    Mikal
                  </h2>
                  <p className="text-xs text-emerald-300">Analisando seus dados</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  aria-label="Iniciar nova conversa"
                  size="icon"
                  title="Iniciar nova conversa"
                  type="button"
                  variant="ghost"
                  onClick={startNewConversation}
                >
                  <RotateCcw size={16} />
                </Button>
                <Button
                  aria-label="Fechar Mikal"
                  size="icon"
                  title="Fechar"
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  <X size={17} />
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[88%] rounded-lg px-3 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "ml-auto bg-emerald-400 text-zinc-950"
                      : "border border-zinc-800 bg-zinc-950/70 text-zinc-300",
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  key={message.id}
                >
                  {message.text}
                </motion.div>
              ))}
            </div>

            <div className="border-t border-zinc-800 p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => (
                  <button
                    className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <Input
                  aria-label="Pergunte ao Mikal"
                  placeholder="Pergunte sobre suas finanças..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
                <Button aria-label="Enviar mensagem" size="icon" type="submit">
                  <Send size={17} />
                </Button>
              </form>
              <p className="mt-2 text-[11px] text-zinc-600">
                Respostas calculadas a partir dos dados disponíveis no NexaFlow.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Abrir Mikal"
          className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-950/50 transition-colors hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:bottom-6 sm:right-6"
          initial={{ opacity: 0, scale: 0.8 }}
          title="Abrir Mikal"
          type="button"
          onClick={() => setOpen(true)}
        >
          <MessageCircle size={23} />
        </motion.button>
      )}
    </>
  );
}
