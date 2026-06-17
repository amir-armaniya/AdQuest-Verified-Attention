export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      const body = `window.ENV = ${JSON.stringify({
        SUPABASE_URL: env.SUPABASE_URL || '',
        SUPABASE_ANON: env.SUPABASE_ANON || '',
      })};`;

      return new Response(body, {
        headers: { 'content-type': 'application/javascript' },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
