import { CheckCircle2, KeyRound, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { Button, Card, Input } from "../components/ui";
import { api } from "../lib/api";

type Mode = "forgot" | "reset" | "verify";

export function AuthActionScreen({ mode }: { mode: Mode }) {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(mode === "verify");
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (mode !== "verify") return;
    api<{ message: string }>("/api/auth/verify-email", {
      body: JSON.stringify({ token }),
      method: "POST",
    })
      .then((response) => setMessage(response.message))
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [mode, token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api<{ message: string }>(
        mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth/reset-password",
        {
          body: JSON.stringify(mode === "forgot" ? { email } : { password, token }),
          method: "POST",
        },
      );
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível concluir.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "forgot" ? "Recuperar senha" : mode === "reset" ? "Criar nova senha" : "Verificar email";
  const Icon = mode === "forgot" ? KeyRound : mode === "reset" ? CheckCircle2 : MailCheck;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-bold text-zinc-50">NexaFlow</p>
            <p className="text-xs text-zinc-400">Segurança da conta</p>
          </div>
        </div>
        <Icon className="mt-8 text-emerald-300" size={28} />
        <h1 className="mt-3 text-2xl font-bold text-zinc-50">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {mode === "forgot"
            ? "Informe seu email para receber um link seguro."
            : mode === "reset"
              ? "Escolha uma senha com pelo menos 8 caracteres."
              : "Estamos confirmando seu endereço de email."}
        </p>

        {mode !== "verify" && !message && (
          <form className="mt-6 grid gap-3" onSubmit={submit}>
            {mode === "forgot" ? (
              <Input required autoComplete="email" placeholder="seuemail@exemplo.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            ) : (
              <Input required autoComplete="new-password" minLength={8} placeholder="Nova senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            )}
            <Button disabled={loading} type="submit">
              {loading && <Loader2 className="animate-spin" size={17} />}
              Continuar
            </Button>
          </form>
        )}

        {loading && mode === "verify" && <p className="mt-6 text-sm text-zinc-300">Verificando...</p>}
        {message && <p className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
        {error && <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <Link className="mt-6 inline-block text-sm font-semibold text-emerald-300" to="/login">Voltar para o login</Link>
      </Card>
    </main>
  );
}
