import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

const GO = 'go'
const JS = 'js'
const PYTHON = 'python'
const ALLOWED_LANGUAGES = [GO, JS, PYTHON]

const GO_RUNTIME = 'go1.x'
const JS_RUNTIME = 'nodejs18.x'
const PYTHON_RUNTIME = 'python3.11'

const GO_HANDLER = 'main'
const JS_HANDLER = 'index.handler'
const PYTHON_HANDLER = 'main.handler'

const AN_HOUR = 3600
const FOUR_DAYS = 345600
const SEVEN_DAYS = 604800

class Params {
  name: string = ''
  isFifo: boolean = false
  isProd: boolean = false
  isPublic: boolean = false
  language: string = ''
  variables: pulumi.Input<{ [key: string]: pulumi.Input<string> }> | undefined = {}
}

const getParams = (config: pulumi.Config): Params => {
  const params = new Params()

  params.language = config.require('language')
  params.name = config.require('name')

  const isFifo = config.require('is_fifo')
  params.isFifo = isFifo == 'true'

  const isProd = config.require('is_prod')
  params.isProd = isProd == 'true'

  const isPublic = config.require('is_public')
  params.isPublic = isPublic == 'true'

  const url = config.require('url')
  const token = config.require('token')

  params.variables = {
    URL: url,
    TOKEN: token,
  }

  return params
}

const getQueueName = (queueName: string, isDeadLetter: boolean, isFifo: boolean): string => {
  if (isDeadLetter) {
    queueName = `${queueName}_failed`
  }

  if (isFifo) {
    queueName = `${queueName}.fifo`
  }

  return queueName
}

const newSqsQueue = (
  params: Params,
  args: aws.sqs.QueueArgs,
  isDeadLetter: boolean
): aws.sqs.Queue => {
  const queueName = getQueueName(params.name, isDeadLetter, params.isFifo)
  args.name = queueName
  args.tags = {
    Name: `sqs-${params.name}`,
  }

  return new aws.sqs.Queue(queueName, args)
}

const newLambdaIamRole = (params: Params): aws.iam.Role => {
  const assumeRolePolicy: aws.iam.PolicyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }

  const roleName = `${params.name}-role`
  const args = {
    name: roleName,
    assumeRolePolicy: assumeRolePolicy,
    managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
  }

  return new aws.iam.Role(roleName, args)
}

const newLambdaIamRolePolicy = (
  role: aws.iam.Role,
  rolePolicyName: string,
  policyDocument: aws.iam.PolicyDocument
): aws.iam.RolePolicy => {
  const rolePolicy = new aws.iam.RolePolicy(rolePolicyName, {
    name: rolePolicyName,
    role: role.id,
    policy: JSON.stringify(policyDocument),
  })

  return rolePolicy
}

const newLambdaFunction = (
  name: string,
  language: string,
  variables: pulumi.Input<{ [key: string]: pulumi.Input<string> }> | undefined,
  role: aws.iam.Role
): aws.lambda.Function => {
  const args: aws.lambda.FunctionArgs = {
    name: name,
    role: role.arn,
    timeout: 900,
    code: new pulumi.asset.FileArchive('./function/app.zip'),
    environment: {
      variables: variables,
    },
    tags: {
      Name: `lambda-${name}`,
    },
  }

  switch (language) {
    case GO: {
      args.runtime = GO_RUNTIME
      args.handler = GO_HANDLER
      break
    }
    case JS: {
      args.runtime = JS_RUNTIME
      args.handler = JS_HANDLER
      break
    }
    case PYTHON: {
      args.runtime = PYTHON_RUNTIME
      args.handler = PYTHON_HANDLER
      break
    }
  }

  return new aws.lambda.Function(name, args)
}

const newEventSourceMapping = (
  queue: aws.sqs.Queue,
  fn: aws.lambda.Function,
  name: string,
  batchSize: number
): aws.lambda.EventSourceMapping => {
  const args = {
    eventSourceArn: queue.arn,
    functionName: fn.name,
    batchSize: batchSize,
  }

  return new aws.lambda.EventSourceMapping(name, args)
}

const newLambdaFunctionUrl = (fn: aws.lambda.Function) => {
  const fnUrlArgs: aws.lambda.FunctionUrlArgs = {
    functionName: fn.name,
    authorizationType: 'NONE',
    cors: {
      allowMethods: ['POST'],
      allowHeaders: ['content-type'],
      allowOrigins: ['*'],
    },
  }

  const fnUrlName = `${fn.name}-url`
  return new aws.lambda.FunctionUrl(fnUrlName, fnUrlArgs)
}

const main = () => {
  const config = new pulumi.Config()
  const params = getParams(config)

  if (!ALLOWED_LANGUAGES.includes(params.language || '')) {
    throw new Error('language is required')
  }

  let redrivePolicy: pulumi.Input<string> | undefined
  if (params.isProd) {
    const deadLetterQueueArgs: aws.sqs.QueueArgs = {
      fifoQueue: params.isFifo,
      messageRetentionSeconds: SEVEN_DAYS,
      visibilityTimeoutSeconds: AN_HOUR,
    }
    const deadLetterQueue = newSqsQueue(params, deadLetterQueueArgs, true)

    const maxReceiveCount = 5
    redrivePolicy = deadLetterQueue.arn.apply((arn) => {
      return JSON.stringify({
        deadLetterTargetArn: arn,
        maxReceiveCount: maxReceiveCount,
      })
    })
  }

  const queueArgs: aws.sqs.QueueArgs = {
    fifoQueue: params.isFifo,
    messageRetentionSeconds: FOUR_DAYS,
    visibilityTimeoutSeconds: AN_HOUR,
  }

  if (params.isProd && redrivePolicy) {
    queueArgs.redrivePolicy = redrivePolicy
  }

  const queue = newSqsQueue(params, queueArgs, false)

  const role = newLambdaIamRole(params)
  const rolePolicyName = `${params.name}-inline-policy`
  const policyDocument: aws.iam.PolicyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['sqs:GetQueueAttributes', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        Resource: '*',
      },
    ],
  }
  newLambdaIamRolePolicy(role, rolePolicyName, policyDocument)

  const fn = newLambdaFunction(params.name, params.language, params.variables, role)

  let fnUrl
  if (params.isPublic) {
    fnUrl = newLambdaFunctionUrl(fn)
  }

  const batchSize = 1
  newEventSourceMapping(queue, fn, params.name, batchSize)

  const result: {
    queue: aws.sqs.Queue
    functionName: aws.lambda.Function
    functionUrl?: aws.lambda.FunctionUrl
  } = {
    queue: queue,
    functionName: fn,
  }

  if (params.isPublic) {
    result.functionUrl = fnUrl
  }

  return result
}

const result = main()
export const queueName = result.queue.name
export const functionName = result.functionName.name
export const functionUrl = result.functionUrl?.functionUrl
