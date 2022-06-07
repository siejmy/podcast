#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
set -e
set -x

source .env
SSH_PRIVKEY_PATH=.ssh.privkey
SRC_DIR="${DIR}/public/"
DST_DIR="${BASE_DIR}"

echo "Syncing root files"
  src_dir="${SRC_DIR}"
  dst_dir="${DST_DIR}"
  rsync -raP --cvs-exclude \
    -e "ssh -o StrictHostKeyChecking=no -i ${SSH_PRIVKEY_PATH} -p ${SSH_PORT}" \
    "${src_dir}" \
    "${SSH_USER}@${SSH_HOST}:${dst_dir}"
echo "-- done --"
echo ""
