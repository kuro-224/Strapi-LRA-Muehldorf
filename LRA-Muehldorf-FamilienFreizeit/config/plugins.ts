export default ({ env }) => ({
  // keep the official cloud plugin enabled
  'cloud': {
    enabled: true,
  },

  // disable the cron runner unless explicitly turned on
  'cloud-cronjob-runner': {
    enabled: env.bool('ENABLE_CLOUD_CRONJOB_RUNNER', false),
    config: {
      apiToken: env('CRONRUNNER_API_TOKEN'),
      apiUrl: env('CRONRUNNER_API_URL'),
      firstRunWindow: env.int('CRONRUNNER_FIRST_RUN_WINDOW', 15),
    },
  },
});
