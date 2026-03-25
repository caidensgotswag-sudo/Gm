import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="text-center">
        <div className="text-4xl mb-6">⚔️</div>
        <h1 className="text-2xl font-bold text-gold mb-8" style={{ letterSpacing: "0.1em" }}>THE DUNGEON FORGE</h1>
        <SignIn />
      </div>
    </main>
  );
}
