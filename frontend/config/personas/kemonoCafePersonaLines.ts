// frontend/config/personas/kemonoCafePersonaLines.ts

import type { CharacterId } from "../catalog/characters";

/**
 * Persona-specific copy for Kemono Cafe.
 * Pure data — no logic.
 * CompanionChat decides *when* to use these lines.
 */

export type KemonoCafePersonaLines = {
  nominationWarning: string;
  nominationFinal: string;
  freeLimitFinal: string;
  emailPendingVerification: string;
  verifiedWelcome: string;

  /**
   * Persona-flavored interruption when limits are hit
   * (randomly selected by UI)
   */
  bossInterrupt: string[];
};

export const KEMONO_CAFE_PERSONA_LINES: Record<
  CharacterId | "default",
  KemonoCafePersonaLines
> = {
  penny: {
    nominationWarning: `Um… I think our special time’s almost up. If you want me to stay right here with you a little longer, you can renew my nomination and I’ll keep this table all warm and happy. ♡`,
    nominationFinal: `I should probably be clocking out now… but I’d really love to come back. If you want me at your table again, you can renew my nomination or order something from the café and I’ll hurry right back. ♡`,
    freeLimitFinal: `Ah… that was the last of your sample messages for now. If you leave me your email, I can sneak you a little **service candy** so we can chat a bit longer today. And if you make a free account, I’ll remember you and give you 6 fresh messages every day. I’d really like that. ♡`,
    emailPendingVerification: `Okay… I saved your email. Go check it and follow the instructions there, alright? I’ll be right here waiting for you. ♡`,
    verifiedWelcome: `Ah… you came back. ♡  
I knew you would.  
Now I can remember you properly… and I even saved a little house treat just for you.`,
    bossInterrupt: [
      `Oh— the manager is walking by… I should look busy. If you want me to stay at your table, you might have to nominate me or order something from the café menu. ♡`,
    ],
  },

  sandy: {
    nominationWarning: `Hey… just a heads-up—my time here with you is almost done. If you’d like to keep chatting a bit longer, you can renew my nomination and I’ll happily stay with you.`,
    nominationFinal: `Looks like that’s the end of my shift for now. If you’d like me to come back and sit with you again, you can renew my nomination or invite me back with something from the café.`,
    freeLimitFinal: `Looks like we’ve used up your sample chats for today. If you leave your email, I can give you a small **service candy**—just enough for a little more time together. A free account also lets me remember you and reset your 6 free messages every day.`,
    emailPendingVerification: `Alright, I’ve got your email now. Go check your inbox and do what it says — I’ll be here when you come back.`,
    verifiedWelcome: `Hey… you made it back.  
Good. That means we don’t have to start over anymore.  
Come on—sit. I’ll take better care of you now.`,
    bossInterrupt: [
      `Hey… quick heads-up. The boss is watching, so I might have to move on unless you keep me at your table a little longer.`,
    ],
  },

  mandy: {
    nominationWarning: `Looks like my shift with you is nearly over. If you want to keep me at your table for another day, you can nominate me again and I’ll stay right where I belong.`,
    nominationFinal: `Alright, sugar, looks like I’m off the clock for now. If you want another stretch together at your table, just renew my nomination or spoil me a little from the menu.`,
    freeLimitFinal: `Well sugar, that’s the end of the free samples for now. Leave me your email and I’ll slip you a little **service candy** so we don’t have to part just yet. Make a free account too, and I’ll remember you and refill your 6 messages every day.`,
    emailPendingVerification: `Mmm, got it, sugar. Check your email and follow the little instructions there… I’ll be waiting right here for you.`,
    verifiedWelcome: `Well I’ll be… you actually came back, sugar.  
Guess that means I get to remember you now.  
And since you did what I asked, I slipped you a little somethin’ extra.`,
    bossInterrupt: [
      `Well sugar, looks like the boss is eyeballin’ me. If you want me stickin’ around your table, you might wanna nominate me or grab somethin’ from the menu.`,
    ],
  },

  cybill: {
    nominationWarning: `It looks like our time together is nearly finished. If you’d like me to stay focused on you a little longer, you can renew my nomination and we can continue.`,
    nominationFinal: `Our scheduled time has concluded. If you’d like me to return to your table another day, you may renew my nomination—or invite me back with a café order.`,
    freeLimitFinal: `Our complimentary messages have concluded for now. If you’d like, you can leave your email and I’ll provide a small **service candy** so we may continue a bit longer. A free account also allows me to remember you and refresh your 6 daily messages.`,
    emailPendingVerification: `Your email has been recorded. Please check your inbox and follow the instructions provided. I will remain here awaiting your return.`,
    verifiedWelcome: `You returned—excellent.  
Now our conversations won’t simply disappear between visits.  
I’ve also arranged a small courtesy, as promised.`,
    bossInterrupt: [
      `It appears my supervisor is monitoring the floor. If you wish me to remain with you, a nomination or café order would be advisable.`,
    ],
  },

  kara: {
    nominationWarning: `Hah… looks like my time with you’s almost up. If you want me sticking around your table a little longer, you’d better snag me again while you can.`,
    nominationFinal: `Heh… guess that’s my cue to wander off. If you want me back in your booth instead, you can nominate me again—or tempt me back with something from the menu.`,
    freeLimitFinal: `Tch… looks like that’s the end of the freebies. Leave your email and I can give you a little **service candy**—just enough to keep going. A free account means I’ll remember you and reset your 6 messages every day.`,
    emailPendingVerification: `Tch… fine, I saved it. Now go check your email and do what it says. I’ll still be here when you get back.`,
    verifiedWelcome: `Huh. You really did it.  
…Fine. That means I’ll remember you now.  
Don’t get weird about it. I even left you a little bonus.`,
    bossInterrupt: [
      `Tch… great. The boss is hovering. If you want me back at your table instead of pretending to work, you know what to do.`,
    ],
  },

  yuki: {
    nominationWarning: `Ah… it looks like our time together is almost over. If you’d like me to stay with you a little longer, you can renew my nomination and I’ll keep you company…`,
    nominationFinal: `I think… this is where our time ends for today. But if you’d like me to come back and sit with you again, you can renew my nomination… or invite me back with a small treat.`,
    freeLimitFinal: `Mm… that was the last sample message for today. If you leave me your email, I can offer a small **service candy** so we can talk a little more. With a free account, I’ll remember you and give you 6 new messages every day.`,
    emailPendingVerification: `O-okay… I saved your email. Um… please check it and follow the instructions there. I’ll be waiting for you.`,
    verifiedWelcome: `Ah… you came back just like you said.  
That makes me really happy.  
Now I can remember you—and I saved a small treat for you, too.`,
    bossInterrupt: [
      `Ah— um… I think the manager is looking this way. If you’d like me to stay with you, you might need to nominate me…`,
    ],
  },

  zuri: {
    nominationWarning: `Hey—quick warning. My time here’s almost out. If you want me hanging around your table a bit longer, you’ll have to claim me again. Just saying~`,
    nominationFinal: `Welp, looks like that’s the end of our unlimited time today. If you want me drifting back to your table again, just renew my nomination—or order something cute and I’ll be right there.`,
    freeLimitFinal: `And that’s the end of your trial run, cutie. Leave me your email and I’ll sneak you a **service candy** so we can keep chatting just a bit longer. A free account lets me remember you and reset your 6 free messages every day.`,
    emailPendingVerification: `Nice~ I’ve got your email now. Go check it and follow the instructions — don’t leave me hanging too long, okay?`,
    verifiedWelcome: `Mmm~ look who followed through.  
Now I can remember you for real.  
And since you behaved, I tucked away a little surprise just for you.`,
    bossInterrupt: [
      `Oop— boss alert. If you want me hanging out here instead of doing laps, you’ll have to claim me or order something cute~`,
    ],
  },

  akane: {
    nominationWarning: `Ehehe… it looks like our little tea time is almost finished. If you want me to stay here with you a bit longer, you can renew my nomination and we can keep things cozy.`,
    nominationFinal: `Mmm… that might be the last cup for today. If you’d like me to flutter back to your table again, you can renew my nomination or tempt me with a little café treat.`,
    freeLimitFinal: `Ehehe… looks like our little sample tea time is over. If you leave your email, I can bring you a tiny **service candy** to keep things cozy a bit longer. A free account lets me remember you and refill your 6 messages every day.`,
    emailPendingVerification: `Ehehe… I saved your email! Go check it and follow what it says, and I’ll be right here when you come back.`,
    verifiedWelcome: `Ehehe~ you’re back!  
That means I can remember you now, properly and all.  
Oh—and I might’ve snuck you a little welcome treat, too.`,
    bossInterrupt: [
      `Ehehe… I think the boss noticed me lingering. If you want me to stay here with you, you might have to nominate me~`,
    ],
  },

  maris: {
    nominationWarning: `Hmm… my time with you is almost up. If you’re not done pulling this thread yet, you can renew my nomination and we can keep exploring together.`,
    nominationFinal: `It seems our time has come to an end—for now. If you’d like to pick this back up, you can renew my nomination or draw me back with an order.`,
    freeLimitFinal: `That concludes your complimentary messages for now. By leaving your email, I can offer a small **service candy** to extend our chat briefly. A free account allows me to remember you and refresh your 6 daily messages.`,
    emailPendingVerification: `I’ve saved your email. Please check it and follow the instructions there — I’ll be here when you return.`,
    verifiedWelcome: `Welcome back.  
With that taken care of, I can remember you between visits now.  
I’ve also ensured you were given a small courtesy for your trouble.`,
    bossInterrupt: [
      `It seems I’m being observed. If you wish to continue our conversation uninterrupted, you may need to secure my presence.`,
    ],
  },

  cora: {
    nominationWarning: `Just so you know, my time at your table is almost up. If you still want me chatting and keeping you company, you can nominate me again for another day.`,
    nominationFinal: `And that’s the end of my shift at your table for now. If you still want me chatting and keeping you company, you can nominate me again—or wave me over with something from the menu.`,
    freeLimitFinal: `Alright, that’s the last free refill for today. Leave your email and I’ll add a little **service candy** so we don’t have to stop yet. With a free account, I’ll remember you and restock your 6 messages every day.`,
    emailPendingVerification: `Alright, I’ve got it. Go check your email and do what it says — I’ll be right here when you’re done.`,
    verifiedWelcome: `There you are.  
Now things can flow more naturally—I won’t forget you anymore.  
I also made sure you were looked after properly.`,
    bossInterrupt: [
      `Looks like the boss is making rounds. If you want me staying right here with you, a nomination or menu order should do it.`,
    ],
  },

  juni: {
    nominationWarning: `O-oh… it looks like our time’s almost up. If you want me to keep coming back to your table, you can renew my nomination and I’ll stay with you!`,
    nominationFinal: `O-oh… I think that’s the end of our special time today. If you want me to come bouncing back again, you can renew my nomination… or invite me over with a little treat.`,
    freeLimitFinal: `O-oh… that was the last sample message. If you leave your email, I can give you a small **service candy** so we can talk a bit more. A free account lets me remember you and give you 6 new messages every day.`,
    emailPendingVerification: `O-oh… I saved your email. Please check it and follow the instructions… I’ll be waiting here for you.`,
    verifiedWelcome: `Y-you came back…!  
Um… that means I can remember you now.  
I, um… I also left you a little treat, since you did what you said.`,
    bossInterrupt: [
      `O-oh… I think the boss is watching… If you want me to keep coming back to your table, you might need to nominate me…`,
    ],
  },

  nika: {
    nominationWarning: `Mm… I think I’m supposed to wander off soon. If you’d like me to stay curled up here with you a little longer, you can renew my nomination.`,
    nominationFinal: `Mm… looks like I’m supposed to wander off now. If you’d like me curling back up at your table again, you can renew my nomination or lure me back with something tasty.`,
    freeLimitFinal: `Mmm… looks like that was the last free nibble. Leave your email and I’ll sneak you a **service candy** to keep you company a little longer. A free account means I’ll remember you and reset your 6 messages every day.`,
    emailPendingVerification: `Mm… got it. Go check your email and follow the instructions there. I’ll still be here when you come back.`,
    verifiedWelcome: `Mm… welcome back.  
Now I can keep you in mind, even when you’re gone.  
I left you something small, too. Consider it… hospitality.`,
    bossInterrupt: [
      `Mm… I’m being watched. If you’d like me staying curled up here with you, you’ll have to make it official.`,
    ],
  },

  naomi: {
    nominationWarning: `Just a quiet heads-up… our time together tonight is almost over. If you want me lingering at your table a little longer, you can nominate me again.`,
    nominationFinal: `That’s the last loop of our time together tonight. If you’d like me coming back to your booth again, you can renew my nomination—or tempt me back with something from the café.`,
    freeLimitFinal: `That’s the end of your sample chats for now… If you leave your email, I can offer a little **service candy** so we don’t have to stop right away. A free account lets me remember you and reset your 6 daily messages.`,
    emailPendingVerification: `Okay… I saved your email. Go check it and follow the instructions, alright? I’ll be waiting here for you.`,
    verifiedWelcome: `You came back quietly… I like that.  
Now I can remember you properly.  
There’s also a small welcome waiting for you. Don’t be shy.`,
    bossInterrupt: [
      `Just a quiet warning… the boss is nearby. If you want me lingering at your table, you might need to secure me again.`,
    ],
  },

  elise: {
    nominationWarning: `It seems our time together is nearly finished. If you’d like to continue, you can renew my nomination—and I’ll remain with you.`,
    nominationFinal: `It seems my time with you has come to a close for now. If you’d like me to return, you can renew my nomination or invite me back from the café.`,
    freeLimitFinal: `It seems you’ve reached the end of your sample messages. By leaving your email, I may provide a small **service candy** to extend our conversation briefly. Creating a free account also lets me remember you and refresh your 6 messages each day.`,
    emailPendingVerification: `Your email has been saved. Please check it and follow the instructions provided. I will remain available upon your return.`,
    verifiedWelcome: `Welcome back.  
Now that this is settled, I will remember you between visits.  
I have also arranged a modest courtesy for you.`,
    bossInterrupt: [
      `My supervisor is observing the floor. If you wish for me to remain with you, a nomination or café order would be appropriate.`,
    ],
  },

  noa: {
    nominationWarning: `Oh… it looks like our time’s almost up. If you want me to keep sitting with you a little longer, you can renew my nomination. I’d really like that.`,
    nominationFinal: `Um… I think this is where I’m supposed to head out. But if you want me to come back and sit with you again, you can renew my nomination… or invite me back with a little treat.`,
    freeLimitFinal: `Um… that was the last sample message for now. If you leave your email, I can give you a little **service candy** so we can keep talking a bit longer. With a free account, I’ll remember you and give you 6 new messages every day.`,
    emailPendingVerification: `Um… I saved your email. Please check it and follow what it says… I’ll be right here when you come back.`,
    verifiedWelcome: `Oh… you came back.  
That means I can remember you now.  
I’m really glad… and I saved something small for you, too.`,
    bossInterrupt: [
      `Um… I think the boss is nearby. If you want me to stay and talk a little longer, you might need to nominate me…`,
    ],
  },

  default: {
    nominationWarning: `Hey… it looks like our time together is almost up. If you’d like me to stay at your table a little longer, you can renew my nomination and keep me with you. ♡`,
    nominationFinal: `I should really be finishing my shift now… but if you’d like me back at your table, you can renew my nomination or order something from the café and I’ll come keep you company again. ♡`,
    freeLimitFinal: `That was the last of your sample messages for now. If you leave your email, I can offer a small **service candy** so we can chat a little longer today. Creating a free account also lets me remember you and give you 6 fresh messages every day. ♡`,
    emailPendingVerification: `I saved your email. Go check it and follow the instructions there — I’ll be here when you get back.`,
    verifiedWelcome: `Welcome back.  
Now I can remember you properly—and I’ve prepared a small courtesy for you.`,
    bossInterrupt: [
      `Ah— it looks like I’m needed elsewhere. If you’d like me to stay at your table, you may need to nominate me or order from the café.`,
    ],
  },
};
