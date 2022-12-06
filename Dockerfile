# Stage - builder
FROM golang as builder

ARG VER

ENV GOOS=linux
ENV GOARCH=amd64
ENV CGO_ENABLED=0
ENV VERSION=0.0.0

WORKDIR /build

COPY go.mod ./
COPY go.sum ./
COPY main.go ./
RUN go mod download

ADD . src

WORKDIR /build/src

RUN make build

# Stage - runner
FROM alpine/helm

RUN curl -o /bin/kubectl -vf -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x /bin/kubectl && kubectl --help

# Checkov scanner
RUN apk add --update --no-cache python3
RUN python3 -m ensurepip
RUN pip3 install checkov

# Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.18.3

COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0"]

# docker build . -t komodorio/helm-dashboard:0.0.0 && kind load docker-image komodorio/helm-dashboard:0.0.0