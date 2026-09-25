async function check() {
  const res = await fetch('https://raw.githubusercontent.com/simple-icons/simple-icons/develop/_data/simple-icons.json');
  const data = await res.json();
  const found = data.icons.filter(i => ['slack', 'microsoft 365', 'microsoft outlook'].includes(i.title.toLowerCase()));
  console.log(found.map(i => ({title: i.title, slug: i.slug})));
}

check();
