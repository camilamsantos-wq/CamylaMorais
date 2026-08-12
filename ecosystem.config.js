module.exports = {
  apps: [
    {
      name: 'whatsapp-vagas-forwarder',
      script: 'index.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
    },
  ],
};
