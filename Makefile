build:
	 git pull && go build -o bin/dashboard .

debug:
	 DEBUG=1 ./bin/dashboard