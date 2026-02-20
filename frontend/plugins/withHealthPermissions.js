const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

const REQUIRED_HEALTH_PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_HEART_RATE',
];

function ensurePermission(manifest, permissionName) {
  const usesPermissions = manifest.manifest['uses-permission'] || [];
  const exists = usesPermissions.some(
    (p) => p?.$?.['android:name'] === permissionName
  );

  if (!exists) {
    usesPermissions.push({
      $: {
        'android:name': permissionName,
      },
    });
  }

  manifest.manifest['uses-permission'] = usesPermissions;
}

const withHealthPermissions = (config) =>
  withAndroidManifest(config, (configWithManifest) => {
    REQUIRED_HEALTH_PERMISSIONS.forEach((permissionName) => {
      ensurePermission(configWithManifest.modResults, permissionName);
    });
    return configWithManifest;
  });

module.exports = createRunOncePlugin(
  withHealthPermissions,
  'with-health-permissions',
  '1.0.0'
);
