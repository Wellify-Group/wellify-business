import Link from 'next/link';

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-white/[0.02] px-8 py-10 text-center shadow-xl shadow-black/60">
        <h1 className="text-2xl font-semibold text-white mb-3">
          E-mail подтвержден
        </h1>
        <p className="text-zinc-300 text-sm mb-6">
          Вы успешно подтвердили e-mail. Эту вкладку можно закрыть и вернуться к регистрации в WELLIFY business.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition"
        >
          Вернуться на сайт
        </Link>
      </div>
    </div>
  );
}
