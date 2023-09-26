# Stage - frontend
FROM node:latest as frontend

WORKDIR /build

COPY frontend ./

RUN npm i && npm run build

# Stage - builder
FROM --platform=${BUILDPLATFORM:-linux/amd64} golang as builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

ENV GOOS=${TARGETOS:-linux}
ENV GOARCH=${TARGETARCH:-amd64}
ENV CGO_ENABLED=0

ARG VER=0.0.0
ENV VERSION=${VER}

WORKDIR /build

COPY go.mod ./
COPY go.sum ./
COPY main.go ./
RUN go mod download

ADD . src

COPY --from=frontend /pkg/frontend/dist ./src/pkg/frontend/dist/

WORKDIR /build/src

RUN make build_go

# Stage - runner
FROM --platform=${TARGETPLATFORM:-linux/amd64} alpine

ARG TARGETPLATFORM
ARG BUILDPLATFORM

EXPOSE 8080

COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0", "--port=8080"]

# docker build . -t komodorio/helm-dashboard:0.0.0 && kind load docker-image komodorio/helm-dashboard:0.0.0