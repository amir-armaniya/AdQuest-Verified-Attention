export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      const body = `window.ENV = ${JSON.stringify({
        SUPABASE_URL: env.SUPABASE_URL || '',
        SUPABASE_ANON: env.SUPABASE_ANON || '',
        CF_RUNTIME: true,
      })};`;

      return new Response(body, {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
          'cache-control': 'no-store',
        },
      });
    }

    if (url.pathname === '/favicon.ico') {
      return new Response('', {
        status: 204,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
