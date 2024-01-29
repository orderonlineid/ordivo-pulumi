package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// Handler is the Lambda function handler
func Handler(ctx context.Context, event events.SQSEvent) (*events.APIGatewayProxyResponse, error) {
	response := &events.APIGatewayProxyResponse{
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       "",
		StatusCode: 400,
	}

	url := os.Getenv("URL")
	if url == "" {
		log.Println("[ERRO] URL is empty")
		response.Body = "URL is empty"
		return response, errors.New("URL is empty")
	}

	log.Println("[INFO] Url: ", url)

	token := os.Getenv("TOKEN")
	if url == "" {
		log.Println("[ERRO] TOKEN is empty")
		response.Body = "[ERRO] TOKEN is empty"
		return response, errors.New("TOKEN is empty")
	}

	payload := event.Records[0].Body
	log.Println("[INFO] Body: ", payload)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBufferString(payload))
	if err != nil {
		log.Println(fmt.Sprintf("[ERRO] Error creating request: %s", err.Error()))
		response.Body = fmt.Sprintf("[ERRO] Error creating request: %s", err.Error())
		return response, err
	}

	req.Header.Set("Authorization", "Basic "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println(fmt.Sprintf("[ERRO] Error forwarding request: %s", err.Error()))
		response.Body = fmt.Sprintf("[ERRO] Error forwarding request: %s", err.Error())
		return response, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println(fmt.Sprintf("[ERRO] Error reading response: %s", err.Error()))
		response.Body = fmt.Sprintf("[ERRO] Error reading response: %s", err.Error())
		return response, err
	}

	log.Println("[INFO] Response: ", string(respBody))

	response.Body = string(respBody)
	response.StatusCode = resp.StatusCode
	return response, nil
}

func main() {
	lambda.Start(Handler)
}
