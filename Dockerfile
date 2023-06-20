# Stage - builder
FROM --platform=${BUILDPLATFORM:-linux/amd64} golang as builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

ENV GOOS=${TARGETOS}
ENV GOARCH=${TARGETARCH}
ENV CGO_ENABLED=0

WORKDIR /build

COPY go.mod ./
COPY go.sum ./
COPY main.go ./
RUN go mod download

ARG VER=0.0.0
ENV VERSION=${VER}

ADD . src

WORKDIR /build/src

RUN env && make build

# Stage - runner
FROM --platform=${BUILDPLATFORM:-linux/amd64} alpine
EXPOSE 8080

# Python
RUN apk add --update --no-cache python3 curl && python3 -m ensurepip && pip3 install --upgrade pip setuptools

# Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.18.3
RUN trivy --version

# Checkov scanner
RUN (pip3 install checkov packaging==21.3 && checkov --version) || echo Failed to install optional Checkov

COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0", "--port=8080"]

## Have Docker download the latest buildx plugin
# docker buildx install
## Create a buildkit daemon with the name "multiarch"
# docker buildx create --use --name=multiarch --node=multiarch
## Install QEMU
# docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
## Run a build for the different platforms
# docker buildx build -t komodorio/helm-dashboard:0.0.0 --platform=linux/arm64,linux/amd64 --output type=local,dest=hdb.image --progress=plain . && kind load docker-image komodorio/helm-dashboard:0.0.0
