#!/bin/sh
set -e

[ ! -z "$HELM_DEBUG" ] && set -x


# Function to print error message and exit
error_exit() {
    echo "$1" >&2
    exit 1
}

# Function to validate command availability
validate_command() {
    command -v "$1" >/dev/null 2>&1 || error_exit "Required command '$1' not found. Please install it."
}

# Function to detect the latest version from GitHub API
get_latest_version() {
    local latest_version
    latest_version="$(curl -s "${api_repo}" | grep -oE '"name": "v[^"]+' | cut -d 'v' -f 2)"
    echo "$latest_version"
}

# Function to download and install the plugin
install_plugin() {
    local plugin_version="$1"
    local plugin_url="$2"
    local plugin_filename="$3"
    local plugin_directory="$4"

    # Download the plugin archive
    if validate_command "curl"; then
        curl --fail -sSL "${plugin_url}" -o "${plugin_filename}"
    elif validate_command "wget"; then
        wget -q "${plugin_url}" -O "${plugin_filename}"
    else
        error_exit "Both 'curl' and 'wget' commands not found. Please install either one."
    fi

    # Extract and install the plugin
    tar xzf "${plugin_filename}" -C "${plugin_directory}"
    mv "${plugin_directory}/${name}" "bin/${name}" || mv "${plugin_directory}/${name}.exe" "bin/${name}"
}

# Main script
name="helm-dashboard"
repo="https://github.com/komodorio/${name}"
api_repo="https://api.github.com/repos/komodorio/${name}/releases/latest"
HELM_PUSH_PLUGIN_NO_INSTALL_HOOK="${HELM_PUSH_PLUGIN_NO_INSTALL_HOOK:-}"

# Check if in development mode
if [ -n "$HELM_PUSH_PLUGIN_NO_INSTALL_HOOK" ]; then
    echo "Development mode: not downloading versioned release."
    exit 0
fi

# Autodetect the latest version
version=$(get_latest_version)
echo "Tried to autodetect latest version: $version"
[ -z "$version" ] && {
    version="$(awk -F '"' '/version/ {print $2}' plugin.yaml)"
    echo "Defaulted to version: $version"
}

echo "Downloading and installing ${name} v${version} ..."

# Convert architecture of the target system to a compatible GOARCH value
case $(uname -m) in
    x86_64)
        arch="x86_64"
        ;;
    armv6*)
        arch="armv6"
        ;;
    armv7*)
        arch="armv7"
        ;;
    aarch64 | arm64)
        arch="arm64"
        ;;
    *)
        error_exit "Failed to detect target architecture"
        ;;
esac

# Construct the plugin download URL
if [ "$(uname)" = "Darwin" ]; then
    url="${repo}/releases/download/v${version}/${name}_${version}_Darwin_${arch}.tar.gz"
elif [ "$(uname)" = "Linux" ] ; then
    url="${repo}/releases/download/v${version}/${name}_${version}_Linux_${arch}.tar.gz"
else
    url="${repo}/releases/download/v${version}/${name}_${version}_windows_${arch}.tar.gz"
fi

echo "$url"

mkdir -p "bin"
mkdir -p "releases/v${version}"

install_plugin "$version" "$url" "releases/v${version}.tar.gz" "releases/v${version}"

echo
echo "Helm Dashboard is installed. To start it, run the following command:"
echo "helm dashboard"

