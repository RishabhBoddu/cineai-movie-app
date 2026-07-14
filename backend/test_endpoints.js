async function test() {
  const endpoints = [
    'http://127.0.0.1:8080/api/movies/trending/today',
    'http://127.0.0.1:8080/api/movies/trending',
    'http://127.0.0.1:8080/api/movies/popular',
    'http://127.0.0.1:8080/api/movies/top-rated',
    'http://127.0.0.1:8080/api/movies/upcoming',
    'http://127.0.0.1:8080/api/movies/now-playing',
    'http://127.0.0.1:8080/api/movies/languages',
    'http://127.0.0.1:8080/api/movies/genres'
  ];

  for (let url of endpoints) {
    try {
      const res = await fetch(url);
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Body (truncated): ${text.substring(0, 150)}\n`);
    } catch (e) {
      console.error(`URL: ${url} - Error: ${e.message}\n`);
    }
  }
}
test();
