# Reuse one SSH password for every ssh/scp in a deploy script.
# Usage: pass -p PASSWORD, set DEPLOY_PASSWORD, or get prompted once.
_deploy_secret_file=""
_deploy_askpass_file=""
_deploy_use_sshpass=0

deploy_parse_password_arg() {
  DEPLOY_PASSWORD="${DEPLOY_PASSWORD:-}"
  while getopts ":p:h" opt; do
    case "${opt}" in
      p) DEPLOY_PASSWORD="${OPTARG}" ;;
      h)
        echo "Usage: ${0##*/} [-p password]"
        echo "  -p password   SSH password (or set DEPLOY_PASSWORD)"
        exit 0
        ;;
      \?) echo "Unknown option: -${OPTARG}" >&2; exit 1 ;;
    esac
  done
  shift $((OPTIND - 1))
}

deploy_read_password() {
  local host="${1:?}"
  if [ -z "${DEPLOY_PASSWORD}" ]; then
    read -rsp "SSH password for ${host}: " DEPLOY_PASSWORD
    echo
  fi
}

deploy_ssh_auth_setup() {
  local password="${1:?}"
  if command -v sshpass >/dev/null 2>&1; then
    export SSHPASS="${password}"
    _deploy_use_sshpass=1
    return 0
  fi

  _deploy_secret_file="$(mktemp)"
  printf '%s' "${password}" > "${_deploy_secret_file}"
  chmod 600 "${_deploy_secret_file}"

  _deploy_askpass_file="$(mktemp)"
  cat > "${_deploy_askpass_file}" <<EOF
#!/bin/sh
cat '${_deploy_secret_file}'
EOF
  chmod 700 "${_deploy_askpass_file}"

  export SSH_ASKPASS="${_deploy_askpass_file}"
  export SSH_ASKPASS_REQUIRE=force
  export DISPLAY="${DISPLAY:-:0}"
}

deploy_ssh_auth_teardown() {
  rm -f "${_deploy_secret_file}" "${_deploy_askpass_file}"
  unset SSHPASS SSH_ASKPASS SSH_ASKPASS_REQUIRE
}

deploy_ssh() {
  if [ "${_deploy_use_sshpass}" = 1 ]; then
    sshpass -e ssh "$@"
  else
    ssh "$@"
  fi
}

deploy_scp() {
  if [ "${_deploy_use_sshpass}" = 1 ]; then
    sshpass -e scp "$@"
  else
    scp "$@"
  fi
}
