import http from 'k6/http';

// export const options = { vus: 1, duration: '10s' };

export const options = {
  scenarios: {
    stress_test: {
      executor: 'constant-arrival-rate',
      rate: 650,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      duration: '1m',
      maxVUs: 5000, // todo increase this for better testing. however do try using this one first as comparison.
      // stages: [
      //   // in rps
      //   { target: 10, duration: '30s' },
      //   { target: 20, duration: '30s' },
      //   { target: 30, duration: '30s' },
      //   { target: 40, duration: '30s' },
      //   { target: 50, duration: '30s' },
      //   { target: 60, duration: '30s' },
      //   { target: 70, duration: '30s' },
      //   { target: 80, duration: '30s' },
      //   { target: 90, duration: '30s' },
      //   { target: 100, duration: '30s' },
      //   { target: 110, duration: '30s' },
      // ],
    },
  },
};

export default () => {
  const targetBaseUrl = __ENV.TARGET_BASE_URL;
  if (!targetBaseUrl) {
    throw new Error('TARGET_BASE_URL must be configured');
  }
  http.get(`${targetBaseUrl.replace(/\/$/, '')}/search/procesador%20ryzen`);
};
