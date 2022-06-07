#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
set -e
set -x

source .env

echo "Syncing root files"
  src_dir="${DIR}/public/"
  dst_dir="${BASE_DIR}"
  rsync -raP --cvs-exclude \
    -e "ssh -o StrictHostKeyChecking=no -i ${SSH_PRIVKEY_PATH} -p ${SSH_PORT}" \
    "${src_dir}" \
    "${SSH_USER}@${SSH_HOST}:${dst_dir}"
  echo "-- done --"
  echo ""
