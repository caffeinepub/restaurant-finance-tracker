import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Utensils } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();

  useEffect(() => {
    if (!isInitializing && identity) {
      void navigate({ to: "/" });
    }
  }, [identity, isInitializing, navigate]);

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.04 240) 0%, oklch(0.22 0.06 240) 50%, oklch(0.28 0.05 200) 100%)",
      }}
    >
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            RestoFinance
          </span>
        </div>

        <div>
          <blockquote className="text-white/80 text-lg leading-relaxed italic">
            &ldquo;Potpuna kontrola financija va&scaron;eg restorana &ndash; na
            jednom mjestu.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm mt-4">
            Upravljanje prihodima, rashodima i analizama
          </p>
        </div>

        <p className="text-white/30 text-xs">
          &copy; {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <Card className="border-0 shadow-2xl" data-ocid="login.card">
            <CardHeader className="pb-6">
              {/* Mobile brand */}
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                  RestoFinance
                </span>
              </div>
              <CardTitle className="text-2xl font-bold">
                Restaurant Finance Tracker
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Upravljanje financijama restorana
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground text-center">
                Koristimo Internet Identity za sigurnu autentifikaciju bez
                lozinki.
              </div>
              <Button
                className="w-full h-11 bg-teal hover:bg-teal-dark text-white font-semibold"
                onClick={() => login()}
                disabled={isLoggingIn || isInitializing}
                data-ocid="login.ii.button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prijava u tijeku...
                  </>
                ) : (
                  "Prijava"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
