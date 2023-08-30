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


 fetch('https://layers.extremum.org/front/user/whoami', {
      mode: 'cors',
      method: "get",
      credentials: 'include',
      headers: {
          'Accept': 'application/json',
      },
  }).then((response) => {
      if (response.ok) {
          response.json().then(function (user) {
              const dduser = {};
              if (user.id) dduser.id = user.id;
              if (user.usercode) dduser.code = user.code;
              if (user.fullname) dduser.name = user.fullname;
              if (user.roles) dduser.roles = user.roles.join(", ");

              dduser.id && window.DD_RUM && window.DD_RUM.setUser(dduser);
          });
      }
  });
