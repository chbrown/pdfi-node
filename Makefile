BIN := node_modules/.bin
TYPESCRIPT := $(shell jq -r '.files[]' tsconfig.json | grep -Fv .d.ts)

all: $(TYPESCRIPT:%.ts=%.js) .gitignore .npmignore

.npmignore: tsconfig.json
	echo $(TYPESCRIPT) Makefile tsconfig.json | tr ' ' '\n' > $@

.gitignore: tsconfig.json
	echo $(TYPESCRIPT:%.ts=%.js) | tr ' ' '\n' > $@

$(BIN)/tsc:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

compile:
	$(BIN)/tsc
