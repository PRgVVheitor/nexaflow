import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BrandMark } from "../components/BrandMark";
import { FieldError } from "../components/FieldError";
import { Button, Input } from "../components/ui";
import { api } from "../lib/api";
import { loginFormSchema, registerFormSchema } from "../lib/schemas";
import { activateDemoMode } from "../demo";

export function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    const result = (isRegister ? registerFormSchema : loginFormSchema).safeParse(form);
    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          isRegister ? form : { email: form.email, password: form.password },
        ),
      });
      onAuthenticated(response);
      toast.success(isRegister ? "Conta criada com sucesso." : "Bem-vindo de volta.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function useDemo() {
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = activateDemoMode();
      onAuthenticated(response);
      toast.success("Conta demonstrativa carregada.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateAuthField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/30 lg:grid-cols-[minmax(0,1fr)_420px]"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35 }}
      >
        <section className="flex flex-col justify-between border-b border-zinc-800 p-6 sm:p-9 lg:border-b-0 lg:border-r">
          <div>
            <BrandMark className="size-11 text-lg" />
            <p className="mt-5 text-xl font-bold text-zinc-50">NexaFlow</p>
            <h1 className="mt-8 max-w-xl text-3xl font-bold leading-tight text-zinc-50 sm:text-5xl">
              Sua rotina organizada em um único fluxo.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Acompanhe suas financas e tarefas em um ambiente privado, conectado e
              preparado para organizar seu dia.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Finanças pessoais", "Transações e gráficos protegidos por conta."],
              ["Taskly", "Tarefas e prioridades sincronizadas."],
              ["Sessão segura", "Senhas protegidas e acesso autenticado."],
            ].map(([title, description]) => (
              <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3" key={title}>
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-9">
          <div className="mb-7">
            <p className="text-sm font-semibold text-emerald-300">
              {isRegister ? "Nova conta" : "Bem-vindo de volta"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-50">
              {isRegister ? "Crie seu acesso" : "Entre no NexaFlow"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isRegister
                ? "Seus dados ficarão separados e protegidos."
                : "Continue de onde parou em poucos segundos."}
            </p>
          </div>

          <form className="grid gap-3" noValidate onSubmit={submit}>
            {isRegister && (
              <>
                <Input
                  aria-invalid={Boolean(fieldErrors.name)}
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(event) => updateAuthField("name", event.target.value)}
                />
                <FieldError error={fieldErrors.name} />
              </>
            )}
            <Input
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              type="email"
              value={form.email}
              onChange={(event) => updateAuthField("email", event.target.value)}
            />
            <FieldError error={fieldErrors.email} />
            <div className="relative">
              <Input
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="pr-11"
                placeholder="Senha"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateAuthField("password", event.target.value)}
              />
              <Button
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-0 top-0"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </Button>
            </div>
            <FieldError error={fieldErrors.password} />

            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button disabled={loading} type="submit">
              {loading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : isRegister ? (
                <UserPlus size={17} />
              ) : (
                <LogIn size={17} />
              )}
              {isRegister ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 grid gap-2">
            <Button disabled={loading} type="button" variant="secondary" onClick={useDemo}>
              Usar conta demonstrativa
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
                setFieldErrors({});
              }}
            >
              {isRegister ? "Já tenho uma conta" : "Criar uma nova conta"}
            </Button>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
