import 'reflect-metadata';

import got from 'got';

const f = async () => {
  const response = await got('https://sindresorhus.com');
  console.log(response.body);
};

f();
