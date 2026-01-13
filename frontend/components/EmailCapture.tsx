// "use client";

// import { useState } from "react";
// import { supabase } from "../lib/supabaseClient";

// export default function EmailCapture() {
//   const [email, setEmail] = useState("");
//   const [sent, setSent] = useState(false);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();

//     const { error } = await supabase.auth.signInWithOtp({
//       email,
//       options: {
//         emailRedirectTo: `${window.location.origin}/auth/callback`,
//       },
//     });

//     if (!error) setSent(true);
//   }

//   if (sent) {
//     return (
//       <p className="text-xs text-slate-500">
//         I just sent you a magic link. Tap it so I can remember you next time. 💌
//       </p>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-left">
//       <label className="text-xs text-slate-400">
//         Drop your email so I can save your seat for next time:
//       </label>
//       <div className="flex gap-2">
//         <input
//           type="email"
//           required
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="flex-1 rounded-md border border-slate-300 bg-white/80 px-2 py-1 text-sm"
//         />
//         <button
//           type="submit"
//           className="rounded-md bg-pink-500 px-3 py-1 text-xs font-semibold text-white"
//         >
//           Send Link
//         </button>
//       </div>
//     </form>
//   );
// }
