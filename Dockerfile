# Stage - builder
FROM golang as builder


ENV GOOS=linux
ENV GOARCH=amd64
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

RUN make build

# Stage - runner
FROM alpine
EXPOSE 8080

# Python
RUN apk add --update --no-cache python3 curl && python3 -m ensurepip && pip3 install --upgrade pip setuptools

# Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.18.3
RUN trivy --version

# Checkov scanner
RUN pip3 install checkov packaging==21.3 && checkov --version

COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0", "--port=8080"]

# docker build . -t komodorio/helm-dashboard:0.0.0 && kind load docker-image komodorio/helm-dashboard:0.0.0