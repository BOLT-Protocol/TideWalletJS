module.exports = function({
  user_id,
  third_party_id,
  install_id,
  timestamp,
  backup_status,
  keystore,
  last_sync_time,
}) {
  return {
    userId: user_id,
    keystore,
    thirdPartyId: third_party_id,
    installId: install_id,
    timestamp,
    backupStatus: backup_status,
    lastSyncTime: last_sync_time,
  };
}