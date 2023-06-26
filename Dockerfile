# Stage - frontend
FROM node:latest as frontend

WORKDIR /build

COPY dashboard ./

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

WORKDIR /build

COPY --from=frontend /pkg/frontend/dist /build/pkg/frontend/dist/

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
FROM --platform=${TARGETPLATFORM:-linux/amd64} alpine

ARG TARGETPLATFORM
ARG BUILDPLATFORM

EXPOSE 8080

COPY --from=builder /build/src/bin/dashboard /bin/helm-dashboard

ENTRYPOINT ["/bin/helm-dashboard", "--no-browser", "--bind=0.0.0.0", "--port=8080"]

# docker build . -t komodorio/helm-dashboard:0.0.0 && kind load docker-image komodorio/helm-dashboard:0.0.0