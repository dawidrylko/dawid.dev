---
date: 2024-05-02
tags:
  - dev
  - ops
  - cloud
---

## 🌐 Overview

This #GitHub Actions workflow snippet is focused on deploying files to #AWS #S3. It consists of two main steps within the `deploy` job. First, it configures AWS credentials using a predefined GitHub action (`aws-actions/configure-aws-credentials@v1`). This action sets up the necessary AWS access key ID, secret access key, and region from GitHub secrets, ensuring secure access to AWS services.

The second step involves synchronizing files from a local path (specified by `vars.LOCAL_PATH`) to an S3 bucket, indicated by `secrets.S3_BUCKET`. The `aws s3 sync` command is used to perform this action, and the `--delete` option ensures that any files not present in the local directory are removed from the S3 bucket, keeping the bucket contents identical to the local source.

## 📝 Configuration

```yaml title=".github/workflows/deploy.yml"
(...)

jobs:
  deploy:
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: AWS S3 Sync
        run: aws s3 sync ${{ vars.LOCAL_PATH }} s3://${{ secrets.S3_BUCKET }} --delete
```
