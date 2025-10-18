import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1628f93d6b2f4560814ac0e3de2374f8',
  appName: 'plaza-nexus-app-22',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: ['location'],
      accuracy: 'high'
    }
  }
};

export default config;