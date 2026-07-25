DATE    ?= $(shell date +%FT%T%z)
VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2> /dev/null || \
			cat $(CURDIR)/.version 2> /dev/null || echo "v0")

.PHONY: all help test pull build_go build_ui build clean debug

.DEFAULT_GOAL := help

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

test: ; $(info $(M) start unit testing...) @ ## Run unit test suite
	@go test $$(go list ./... | grep -v /mocks/) --race -v -short -coverpkg=./... -coverprofile=profile.cov
	@echo "\n*****************************"
	@echo "**  TOTAL COVERAGE: $$(go tool cover -func profile.cov | grep total | grep -Eo '[0-9]+\.[0-9]+')%  **"
	@echo "*****************************\n"

pull: ; $(info $(M) Pulling source...) @ ## Pull latest source code from git
	@git pull

build_go: $(BIN) ; $(info $(M) Building GO...) @ ## Build Go backend binary
	go build \
		-ldflags '-X main.version=$(VERSION) -X main.buildDate=$(DATE)' \
		-o bin/dashboard .

build_ui: $(BIN) ; $(info $(M) Building UI...) @ ## Build React frontend UI
	cd frontend && npm i && npm run build && cd ..

build: build_ui build_go ; $(info $(M) Building executable...) @ ## Build UI and Go backend binary

clean: ## Clean build binaries and coverage profiles
	@rm -rf bin/ profile.cov

debug: ; $(info $(M) Running dashboard in debug mode...) @ ## Run dashboard in debug mode
	@DEBUG=1 ./bin/dashboard