

const http = require('http');
const { URL } = require('url');

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function buildStreams() {
  const nowMs = Date.now();
  const baseNs = BigInt(nowMs) * 1000000n;

  const messagesPerStream = 20;
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  const services = ['api', 'web', 'worker'];
  const environments = ['prod', 'staging'];

  const combos = [];
  services.forEach((service) => {
    environments.forEach((env) => {
      levels.forEach((level) => combos.push({ service, env, level }));
    });
  });

  return combos.map(({ service, env, level }, streamIndex) => {
    const values = [];
    for (let i = 0; i < messagesPerStream; i += 1) {
      const ts = (baseNs + BigInt(streamIndex * messagesPerStream + i)).toString();
      const traceId = Math.random().toString(16).substring(2, 10);
      const spanId = Math.random().toString(16).substring(2, 8);
      const hostname = `${service}-${randomFrom(['01','02','03'])}.local`;
      const namespace = `${service}-ns`;
      const pod = `${service}-${Math.random().toString(36).substring(2,7)}`;
      const deployment = `${service}-deployment`;
      const cluster = randomFrom(['cluster-a', 'cluster-b']);

      const payload = {
        id: `seed-${streamIndex}-${i}-${nowMs}`,
        timestamp: new Date(nowMs - i).toISOString(),
        level: level,
        service: service,
        message: `${service} ${env} - seed log ${i + 1} (${level})`,
        traceId,
        spanId,
        attributes: {
          app: 'iyzitrace',
          job: 'seed',
          level: level,
          service: service,
          service_name: service,
          environment: env
        },
        hostname,
        environment: env,
        namespace,
        pod,
        deployment,
        cluster
      };
      values.push([ts, JSON.stringify(payload)]);
    }

    return {
      stream: {
        job: 'seed',
        app: 'iyzitrace',
        service: service,
        service_name: service,
        level,
        environment: env
      },
      values,
    };
  });
}

function pushToLoki(lokiUrl, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL('/loki/api/v1/push', lokiUrl);
    const body = Buffer.from(JSON.stringify(payload));

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: text });
        } else {
          reject(new Error(`Loki push failed: ${res.statusCode} ${text}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
  const streams = buildStreams();
  const payload = { streams };

  try {
    const res = await pushToLoki(lokiUrl, payload);
    console.log(`Pushed ${streams.reduce((n, s) => n + s.values.length, 0)} log lines to ${lokiUrl}.`);
    console.log(`Response: ${res.statusCode}`);
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

main();

 

 function randomFrom(array) {
   return array[Math.floor(Math.random() * array.length)];
 }

 function buildStreams() {
  const nowMs = Date.now();
  const baseNs = BigInt(nowMs) * 1000000n;

  const messagesPerStream = 20;
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  const services = ['api', 'web', 'worker'];
  const environments = ['prod', 'staging'];

  const combos = [];
  services.forEach((service) => {
    environments.forEach((env) => {
      levels.forEach((level) => combos.push({ service, env, level }));
    });
  });

  return combos.map(({ service, env, level }, streamIndex) => {
    const values = [];
    for (let i = 0; i < messagesPerStream; i += 1) {
      const ts = (baseNs + BigInt(streamIndex * messagesPerStream + i)).toString();
      const traceId = Math.random().toString(16).substring(2, 10);
      const spanId = Math.random().toString(16).substring(2, 8);
      const hostname = `${service}-${randomFrom(['01','02','03'])}.local`;
      const namespace = `${service}-ns`;
      const pod = `${service}-${Math.random().toString(36).substring(2,7)}`;
      const deployment = `${service}-deployment`;
      const cluster = randomFrom(['cluster-a', 'cluster-b']);

      const payload = {
        id: `seed-${streamIndex}-${i}-${nowMs}`,
        timestamp: new Date(nowMs - i).toISOString(),
        level: level,
        service: service,
        message: `${service} ${env} - seed log ${i + 1} (${level})`,
        traceId,
        spanId,
        attributes: {
          app: 'iyzitrace',
          job: 'seed',
          level: level,
          service: service,
          service_name: service,
          environment: env
        },
        hostname,
        environment: env,
        namespace,
        pod,
        deployment,
        cluster
      };
      values.push([ts, JSON.stringify(payload)]);
    }

    return {
      stream: {
        job: 'seed',
        app: 'iyzitrace',
        service: service,
        service_name: service,
        level,
        environment: env
      },
      values,
    };
  });
}

function pushToLoki(lokiUrl, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL('/loki/api/v1/push', lokiUrl);
    const body = Buffer.from(JSON.stringify(payload));

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: text });
        } else {
          reject(new Error(`Loki push failed: ${res.statusCode} ${text}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
  const streams = buildStreams();
  const payload = { streams };

  try {
    const res = await pushToLoki(lokiUrl, payload);
    console.log(`Pushed ${streams.reduce((n, s) => n + s.values.length, 0)} log lines to ${lokiUrl}.`);
    console.log(`Response: ${res.statusCode}`);
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

main();


