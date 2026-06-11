import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui";

const features = [
  {
    icon: LineChart,
    title: "Dashboard financeiro",
    description:
      "Entradas, saídas e saldo em gráficos comparativos, com filtros por período, categorias padronizadas e exportação em CSV.",
    bullets: ["Nexa Score explicável", "Previsão de saldo em 7, 15 e 30 dias", "Alertas de gastos fora do padrão"],
  },
  {
    icon: BrainCircuit,
    title: "Mikal, assistente financeiro",
    description:
      "Pergunte sobre seus gastos, projeções e saúde financeira e receba respostas calculadas a partir dos seus próprios dados.",
    bullets: ["Respostas em linguagem natural", "Sugestões de perguntas rápidas", "Sem enviar dados para terceiros"],
  },
  {
    icon: ClipboardList,
    title: "Taskly",
    description:
      "Organize tarefas com prioridades e prazos, alterne entre lista e quadro Kanban e acompanhe o progresso com indicadores visuais.",
    bullets: ["Visualização em lista ou Kanban", "Sinalização de tarefas atrasadas", "Anéis de progresso por status"],
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <p className="text-lg font-bold text-zinc-50">NexaFlow</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button type="button" variant="secondary" onClick={() => navigate("/login")}>
            Entrar
            <ArrowRight size={16} />
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pt-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4 }}
          >
            <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles size={14} />
              Finanças e produtividade no mesmo fluxo
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-zinc-50 sm:text-6xl">
              Suas finanças e tarefas em um painel único.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Registre entradas e saídas, entenda para onde seu dinheiro está indo com
              inteligência financeira explicável e organize sua rotina sem sair do fluxo.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button className="h-12 px-6 text-base" type="button" onClick={() => navigate("/login")}>
                Criar conta gratuita
                <ArrowRight size={18} />
              </Button>
              <Button
                className="h-12 px-6 text-base"
                type="button"
                variant="ghost"
                onClick={() => navigate("/login")}
              >
                Usar conta demonstrativa
              </Button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="text-emerald-300" size={14} />
              Dados isolados por conta, senhas com bcrypt e sessões assinadas com JWT.
            </p>
          </motion.div>
        </section>

        <section aria-labelledby="features-title" className="border-t border-zinc-800 bg-zinc-900/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-xs font-semibold uppercase text-emerald-300">Recursos</p>
            <h2 className="mt-2 text-3xl font-bold text-zinc-50" id="features-title">
              Tudo o que você precisa para organizar o dia
            </h2>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6"
                    initial={{ opacity: 0, y: 14 }}
                    key={feature.title}
                    transition={{ delay: index * 0.08, duration: 0.32 }}
                  >
                    <div className="grid size-11 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <Icon size={21} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-50">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
                    <ul className="mt-4 space-y-2">
                      {feature.bullets.map((bullet) => (
                        <li className="flex items-start gap-2 text-sm text-zinc-300" key={bullet}>
                          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={15} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
            Comece agora — leva menos de um minuto.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Crie sua conta ou explore com a conta demonstrativa, que funciona até sem API ativa.
          </p>
          <Button className="mt-6 h-12 px-6 text-base" type="button" onClick={() => navigate("/login")}>
            Entrar no NexaFlow
            <ArrowRight size={18} />
          </Button>
        </section>
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="size-8" />
            <p className="text-sm font-semibold text-zinc-100">NexaFlow</p>
          </div>
          <p className="text-xs text-zinc-400">
            Projeto full-stack com React, Express, PostgreSQL e Prisma.
          </p>
          <nav aria-label="Links do rodapé" className="flex items-center gap-4 text-xs">
            <Link className="text-zinc-400 transition-colors hover:text-emerald-300" to="/login">
              Entrar
            </Link>
            <a
              className="text-zinc-400 transition-colors hover:text-emerald-300"
              href="https://github.com/PRgVVheitor/nexaflow"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
