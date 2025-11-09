// ./config/plugins.ts
export default ({ env }) => ({
  // Your custom plugin(s)
  geodata: { enabled: true },

  /**
   * Optional: ONLY if you truly use an external cron runner service.
   * Leave disabled (default) so it won't crash in Cloud or locally.
   */
  'cloud-cronjob-runner': {
    enabled: env.bool('ENABLE_CLOUD_CRONJOB_RUNNER', false),
    config: {
      apiToken: env('CRONRUNNER_API_TOKEN'),
      apiUrl: env('CRONRUNNER_API_URL'),
      firstRunWindow: env.int('CRONRUNNER_FIRST_RUN_WINDOW', 15),
    },
  },

  /**
   * Do NOT add a "cloud" entry here.
   * @strapi/plugin-cloud is auto-detected when it’s in dependencies.
   * Having a config block for "cloud" causes the
   * “plugin cloud … not installed” error if the package resolution fails.
   */
});
