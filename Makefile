DATE    ?= $(shell date +%FT%T%z)
VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2> /dev/null || \
			cat $(CURDIR)/.version 2> /dev/null || echo "v0")

.PHONY: test
test: ; $(info $(M) start unit testing...) @
	@go test $$(go list ./... | grep -v /mocks/) --race -v -short -coverpkg=./... -coverprofile=profile.cov
	@echo "\n*****************************"
	@echo "**  TOTAL COVERAGE: $$(go tool cover -func profile.cov | grep total | grep -Eo '[0-9]+\.[0-9]+')%  **"
	@echo "*****************************\n"

.PHONY: pull
pull: ; $(info $(M) Pulling source...) @
	@git pull

.PHONY: build_go
build_go: $(BIN) ; $(info $(M) Building GO...) @ ## Build program binary
	go build \
		-ldflags '-X main.version=$(VERSION) -X main.buildDate=$(DATE)' \
		-o bin/dashboard .

.PHONY: build_ui
build_ui: $(BIN) ; $(info $(M) Building UI...) @ ## Build program binary
	cd frontend && npm i && npm run build && cd ..

.PHONY: build
build: build_ui build_go ; $(info $(M) Building executable...) @ ## Build program binary

.PHONY: debug
debug: ; $(info $(M) Running dashboard in debug mode...) @
	@DEBUG=1 ./bin/dashboard