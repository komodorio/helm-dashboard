#!/bin/sh -e

# Copied w/ love from the chartmuseum/helm-push :)

name="helm-dashboard"
repo="https://github.com/komodorio/${name}"

if [ -n "${HELM_PUSH_PLUGIN_NO_INSTALL_HOOK}" ]; then
    echo "Development mode: not downloading versioned release."
    exit 0
fi

version="$(cat plugin.yaml | grep "version" | cut -d '"' -f 2)"
echo "Downloading and installing ${name} v${version} ..."

url=""

# convert architecture of the target system to a compatible GOARCH value.
# Otherwise failes to download of the plugin from github, because the provided
# architecture by `uname -m` is not part of the github release.
arch=""
case $(uname -m) in
  x86_64)
    arch="x86_64"
    ;;
  armv6*)
    arch="armv6"
    ;;
  # match every arm processor version like armv7h, armv7l and so on.
  armv7*)
    arch="armv7"
    ;;
  aarch64 | arm64)
    arch="arm64"
    ;;
  *)
    echo "Failed to detect target architecture"
    exit 1
    ;;
esac


if [ "$(uname)" = "Darwin" ]; then
    url="${repo}/releases/download/v${version}/${name}_${version}_Darwin_${arch}.tar.gz"
elif [ "$(uname)" = "Linux" ] ; then
    url="${repo}/releases/download/v${version}/${name}_${version}_Linux_${arch}.tar.gz"
else
    url="${repo}/releases/download/v${version}/${name}_${version}_windows_${arch}.tar.gz"
fi

echo $url

mkdir -p "bin"
mkdir -p "releases/v${version}"

# Download with curl if possible.
if [ -x "$(which curl 2>/dev/null)" ]; then
    curl --fail -sSL "${url}" -o "releases/v${version}.tar.gz"
else
    wget -q "${url}" -O "releases/v${version}.tar.gz"
fi
tar xzf "releases/v${version}.tar.gz" -C "releases/v${version}"
mv "releases/v${version}/${name}" "bin/${name}" || \
    mv "releases/v${version}/${name}.exe" "bin/${name}"

echo
echo "Helm Dashboard is installed, to start it, run in your terminal:"
echo "    helm dashboard"
echo