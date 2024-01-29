## Development Guide

- Fork or clone the project

    ```sh
    git@github.com:renodesper/ordivo-pulumi.git
    ```

- Create a meaningful branch

    ```sh
    git checkout -b <your-meaningful-branch>
    ```

    e.g:

    ```sh
    git checkout -b new-payment-provider
    ```

- Create some changes and their tests (unit test, integration test, and other test if any).

- Add, commit, and push the changes to repository

    ```sh
    git add .sh
    git commit -s -m "your meaningful commit message"sh
    git push origin <your-meaningful-branch>
    ```

    For writing commit message, please use [conventionalcommits](https://www.conventionalcommits.org/en/v1.0.0/) as a reference.

- Create a Pull Request (PR). In your PR's description, please explain the goal of the PR and its changes.

- Ask the other contributors to review.

- Once your PR is approved and its pipeline status is green, ask the owner to merge your PR.

### Pulumi.dev.yaml

Below is an example of Pulumi.dev.yaml file that we use:

```yaml
config:
  aws:profile: aws-cli
  aws:region: ap-southeast-1
  language: go
  name: lambda-name
  is_fifo: false
  is_prod: false
  is_public: false
  # Below is lambda environment variables that will be used by lambda function
  url: https://example.com
  token: DUMMYTOKEN
```

To understand each configuration, please read the details below:

| Configuration | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| aws:profile   | AWS profile that will be used by Pulumi (based on our local configuration) |
| aws:region    | AWS region that will be used by Pulumi                                     |
| language      | Programming language that was used as lambda function                      |
| name          | Name of the lambda                                                         |
| is_fifo       | Whether the lambda is FIFO or not                                          |
| is_prod       | Whether the lambda is for production or not                                |
| is_public     | Whether the lambda is public or not                                        |
| url           | URL of the target                                                          |
| token         | Token that will be used for authentication                                 |
