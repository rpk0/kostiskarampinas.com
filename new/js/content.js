// Everything the page says lives here. Edit this file to change the tagline,
// the answers, the CV rows and the links; js/site.js only handles behaviour.
(() => {
  // Built at runtime so the address isn't sitting in the HTML for scrapers
  const email = ['kostis.karampinas', 'gmail.com'].join(String.fromCharCode(64));

  const LINKS = {
    blog: { label: 'photography', host: 'rpk.io', url: 'https://rpk.io/', note: 'film photography blog' },
    instagram: { label: 'instagram', host: '@rpk.io', url: 'https://www.instagram.com/rpk.io/', note: 'film photos' },
    github: { label: 'github', host: 'github.com/rpk0', url: 'https://github.com/rpk0' },
    email: { label: 'e-mail', copy: email },
    linkedin: { label: 'linkedin', host: 'linkedin.com/in/kostis-karampinas', url: 'https://linkedin.com/in/kostis-karampinas' },
    x: { label: 'x', host: '@rpk0_', url: 'https://x.com/rpk0_' }
  };

  // Newest first. to: 'now' marks the current role.
  const CV = [
    { role: 'Senior Software Engineering Lead, International', org: 'Skroutz', from: 'Jun 2026', to: 'now', note: 'International team: five engineers, no PM. Strategy and planning for Cyprus, Romania and Bulgaria; half hands-on, half leading.' },
    { role: 'Tech Lead, International', org: 'Skroutz', from: '2024', to: 'Jun 2026', note: 'Owned International end to end. Launched Cyprus shipping and the Romania and Bulgaria lanes; VAT and VIES compliance.' },
    { role: 'Tech Lead, people manager', org: 'Skroutz', from: 'Jul 2021', to: '2024', note: 'Grew the team; fashion and groceries verticals; laid the foundations for International.' },
    { role: 'Software Engineer', org: 'Skroutz', from: 'Sep 2013', to: 'Jun 2021', note: 'Catalog, the front-end redesign, SEO, the shopping experience and the internal admin platform.' },
    { role: 'Software Engineer', org: '3Edge Technologies', from: 'Dec 2012', to: 'Jun 2013', note: 'High-volume e-mail processing pipelines.' }
  ];

  window.SITE = {
    email,

    tagline: 'tech leader who still builds, artist at heart. i unblock teams and turn imagination into systems that scale.',
    // Words that take turns sitting heavier, in this order
    groups: [['tech', 'leader'], ['still', 'builds,'], ['artist', 'at', 'heart.'], ['unblock'], ['imagination'], ['scale.']],
    rotateMs: 1500,

    qa: [
      { id: 'now', q: 'What are you working on now?', a: 'I lead the International team at Skroutz, the no. 1 e-commerce site in Greece. Five engineers and no dedicated PM, so tech, product and delivery for International land on me: Cyprus, Romania, Bulgaria, shipping, couriers, VAT, checkout. Half my week is building things with AI, the other half is leading and product management.', cv: CV.slice(0, 1) },
      { id: 'ai', q: 'How do you work with AI?', a: 'Agents do the typing. I write the spec, the guardrails and the acceptance checks, then verify the result with tests, lint, diff review and staging before anything ships. Toolset: Claude Code, git worktrees, and cmux to run agents in parallel.' },
      { id: 'career', q: 'Walk me through your career', a: 'Thirteen years at Skroutz, after a short start at 3Edge. The short version:', cv: CV },
      { id: 'tenure', q: '13 years at one company?', a: 'I joined as employee #58 and saw the company grow past 600. Four jobs under one logo. The codebase got older, the problems kept getting newer.' },
      { id: 'lead', q: 'What kind of leader are you?', a: 'Half hands-on, half leading. I sit in the business meetings, make the technical calls, then go back to the code. With no PM on the team, unblocking is most of the job.' },
      { id: 'art', q: 'Where does the artist come in?', a: "Film photography. It's the same habit as at work: imagine it first, then build it.", links: [LINKS.blog, LINKS.instagram] },
      { id: 'photo', q: 'Can I see your photography?', a: 'I shoot film. The photos live on my blog and on Instagram.', links: [LINKS.blog, LINKS.instagram] },
      { id: 'projects', q: 'Show me your other projects', a: "Things I make when I'm not leading teams:", links: [LINKS.blog, LINKS.instagram, LINKS.github] },
      { id: 'hire', q: 'How can I reach you?', a: 'E-mail or LinkedIn. A human replies, usually the same day.', links: [LINKS.email, LINKS.linkedin, LINKS.x] },
      { id: 'cv', q: 'Can I get your CV?', a: 'Ask me by e-mail or on LinkedIn and I will send the latest one.', links: [LINKS.email, LINKS.linkedin] }
    ],

    // The suggestions shown when the input is focused, in this order
    shown: ['now', 'ai', 'career', 'tenure', 'lead', 'projects', 'photo', 'hire'],

    // Keyword matching for typed questions: first group with a word that starts a match wins
    keys: [
      ['photo', ['photo', 'camera', 'picture', 'shoot', 'film', 'lens', 'instagram', 'blog']],
      ['art', ['art', 'imagin', 'creativ', 'paint', 'hobby', 'hobbies', 'outside work']],
      ['projects', ['project', 'side', 'portfolio', 'links', 'website', 'site', 'make', 'github']],
      ['ai', ['ai', 'agent', 'claude', 'llm', 'cmux', 'worktree', 'tool', 'prompt', 'gpt']],
      ['cv', ['cv', 'resume', 'pdf']],
      ['hire', ['hire', 'hiring', 'open to', 'available', 'contact', 'email', 'e-mail', 'mail', 'reach', 'talk', 'linkedin', 'recruit', 'new role']],
      ['tenure', ['13', 'thirteen', 'tenure', 'loyal', 'one company', 'same company', 'how long', 'stay']],
      ['lead', ['lead', 'manag', 'team', 'style', 'unblock', 'culture']],
      ['career', ['career', 'experience', 'background', 'history', 'worked', 'before', 'previous']],
      ['now', ['now', 'current', 'working on', 'building', 'job', 'today', 'company', 'skroutz', 'zulu', 'international', 'role']]
    ],

    // Easter eggs: whole-word answers that never show up as suggestions
    eggs: [
      { re: /\b(hi|hello|hey|yo)\b/i, a: 'hi. now ask me something harder.' },
      { re: /\bcoffee\b/i, a: 'always. no further questions.' },
      { re: /\bsudo\b/i, a: 'nice try.' },
      { re: /meaning of life/i, a: '42. next question.' },
      { re: /^\s*42\s*$/, a: 'correct. but what was the question?' },
      { re: /\bjoke\b/i, a: 'a standup that was meant to take 15 minutes. that was the joke. it took 45.' },
      { re: /\bare you (an? )?(ai|bot|robot|real)\b/i, a: 'the answers here are mine. when nothing matches, a small model that only knows my CV has a go.' },
      { re: /\b(easter egg|secret)s?\b/i, a: 'there are a few. try poking the pink dot.' }
    ],

    // What the box says when a question runs past 50 characters
    // The reply once a visit has used up its questions
    limit: "That's ten questions for one visit. The rest are better over e-mail or LinkedIn.",

    quips: [
      'easy there. 50 characters max. are you a bot?',
      'that’s an essay, not a question. keep it under 50.',
      'beep boop? humans usually stop at 50 characters.',
      'i unblock teams, not paragraphs. 50 characters, please.'
    ]
  };
})();
