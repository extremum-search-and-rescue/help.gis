window.DD_RUM && window.DD_RUM.init({
  clientToken: 'pub08f815ea1ab43a7d2c2e4d5feefb2a9b',
  applicationId: 'f2dab792-38a7-4cde-9e34-369d5e33ba58',
  site: 'datadoghq.eu',
  service: 'help.gis',
  env: 'selectel',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'allow',
});

window.DD_RUM &&
window.DD_RUM.startSessionReplayRecording();
