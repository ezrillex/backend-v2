import http from 'k6/http';

// export const options = { vus: 1, duration: '10s' };

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 500, // todo increase this for better testing. however do try using this one first as comparison.
      stages: [
        { target: 50, duration: '30s' }, // 50 RPS
        { target: 100, duration: '30s' }, // 100 RPS
        { target: 200, duration: '30s' }, // 200 RPS
        { target: 300, duration: '30s' }, // 300 RPS
        { target: 400, duration: '30s' }, // 400 RPS
      ],
    },
  },
};

export default () => {
  // http.get('[REDACTED]');
  http.get('[REDACTED]');
};
