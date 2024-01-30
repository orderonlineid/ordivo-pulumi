BREWPATH=/opt/homebrew
GOCMD=go
GOMOD=$(GOCMD) mod
GOFUMPT=gofumpt
GOFUMPTPATH := $(GOPATH)/bin/gofumpt
GOFUMPTBREWPATH := $(BREWPATH)/bin/gofumpt

all: help

.PHONY: build.go
build.go:
	rm -f function/app.zip && \
		cd function/go && \
		$(GOMOD) init oo-lambda || true
	cd function/go && \
		$(GOMOD) vendor && \
		GOOS=linux GOARCH=amd64 $(GOCMD) build -o main . && \
		zip ../app.zip main && \
		rm -f main

.PHONY: build.js
build.js:
	rm -f function/app.zip && \
		cd function/js && \
		zip -r ../app.zip .

.PHONY: build.py
build.py:
	rm -f function/app.zip && \
		cd function/python && \
		pip3 install requests -t . && \
		zip -r ../app.zip .

.PHONY: deploy
deploy:
	pulumi up

.PHONY: deploy.go
deploy.go: build.go deploy

.PHONY: deploy.js
deploy.js: build.js deploy

.PHONY: deploy.py
deploy.py: build.py deploy

.PHONY: clean
clean:
	rm -rf function/app.zip node_modules

.PHONY: destroy
destroy:
	pulumi destroy

.PHONY: help
help:
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<arg>${RESET}'
	@echo ''
	@echo 'Arguments:'
	@echo "  ${YELLOW}help       ${RESET} ${GREEN}Show this help message${RESET}"
	@echo "  ${YELLOW}build.go   ${RESET} ${GREEN}Build and zip the go code in 'function/go'${RESET}"
	@echo "  ${YELLOW}build.js   ${RESET} ${GREEN}Zip the js code in 'function/js'${RESET}"
	@echo "  ${YELLOW}build.py   ${RESET} ${GREEN}Zip the python code in 'function/python'${RESET}"
	@echo "  ${YELLOW}deploy     ${RESET} ${GREEN}Deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}deploy.go  ${RESET} ${GREEN}Run 'build.go' and deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}deploy.js  ${RESET} ${GREEN}Run 'build.js' and deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}deploy.py  ${RESET} ${GREEN}Run 'build.py' and deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}clean      ${RESET} ${GREEN}Remove app.zip (and vendor if exist)${RESET}"
	@echo "  ${YELLOW}destroy    ${RESET} ${GREEN}Destroy deployed infrastructure${RESET}"
