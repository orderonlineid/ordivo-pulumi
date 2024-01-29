## Prerequisites

- Install Go

  We use version 1.21. Follow [Golang installation guideline](https://golang.org/doc/install).

- Install Pulumi

  We use version 3.102.0. Follow [Pulumi installation guideline](https://www.pulumi.com/docs/get-started/install/).

- Move `Pulumi.dev.yaml.example` to `Pulumi.dev.yaml`

  ```bash
  mv Pulumi.dev.yaml.example Pulumi.dev.yaml
  ```

  > Do not forget to change all values in `Pulumi.dev.yaml`.

- Setup AWS credentials

  In `Pulumi.dev.yaml`, we use `aws:region` and `aws:profile`. Before Pulumi can deploy to AWS, we need to setup AWS credentials.

  Follow [AWS credentials setup guideline](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).
