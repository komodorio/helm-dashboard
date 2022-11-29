FROM golang as builder
ENV GOOS=linux
ENV GOARCH=amd64
ENV CGO_ENABLED=0
ENV VERSION=0.0.0

ARG VER=${VERSION}

WORKDIR /build

COPY go.mod ./
COPY go.sum ./
COPY main.go ./
RUN go mod download

ADD . src

WORKDIR /build/src

RUN make build

FROM alpine/helm

RUN curl -o /bin/kubectl -vf -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x /bin/kubectl && kubectl --help

# TODO: trivy
# TODO: checkov


COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0"]

# docker build . -t komodorio/helm-dashboard:0.0.0 && kind load docker-image komodorio/helm-dashboard:0.0.0