import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { Sentry } from '../common/config/sentry.config'

@ApiTags('Test Errors')
@Controller('test-errors')
export class TestErrorsController {
  private readonly logger = new Logger(TestErrorsController.name)

  @Get('500')
  @ApiOperation({ summary: 'Trigger 500 Internal Server Error' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  triggerInternalServerError() {
    this.logger.error('Manually triggered 500 error for testing')
    throw new InternalServerErrorException('This is a test 500 error')
  }

  @Get('400')
  @ApiOperation({ summary: 'Trigger 400 Bad Request Error' })
  @ApiResponse({ status: 400, description: 'Bad request error' })
  triggerBadRequestError() {
    this.logger.warn('Manually triggered 400 error for testing')
    throw new BadRequestException('This is a test 400 error')
  }

  @Get('404')
  @ApiOperation({ summary: 'Trigger 404 Not Found Error' })
  @ApiResponse({ status: 404, description: 'Not found error' })
  triggerNotFoundError() {
    this.logger.warn('Manually triggered 404 error for testing')
    throw new NotFoundException('This is a test 404 error')
  }

  @Get('401')
  @ApiOperation({ summary: 'Trigger 401 Unauthorized Error' })
  @ApiResponse({ status: 401, description: 'Unauthorized error' })
  triggerUnauthorizedError() {
    this.logger.warn('Manually triggered 401 error for testing')
    throw new UnauthorizedException('This is a test 401 error')
  }

  @Get('custom')
  @ApiOperation({ summary: 'Trigger custom HTTP error' })
  @ApiQuery({ name: 'status', required: false, description: 'HTTP status code' })
  @ApiQuery({ name: 'message', required: false, description: 'Error message' })
  @ApiResponse({ status: 418, description: 'Custom error' })
  triggerCustomError(
    @Query('status') status?: string,
    @Query('message') message?: string,
  ) {
    const statusCode = parseInt(status || '418', 10)
    const errorMessage = message || "I'm a teapot (custom test error)"
    
    this.logger.warn(`Manually triggered ${statusCode} error for testing: ${errorMessage}`)
    throw new HttpException(errorMessage, statusCode)
  }

  @Get('unhandled')
  @ApiOperation({ summary: 'Trigger unhandled error (JavaScript Error)' })
  @ApiResponse({ status: 500, description: 'Unhandled error' })
  triggerUnhandledError() {
    this.logger.error('Manually triggered unhandled error for testing')
    // This will be caught by AllExceptionsFilter
    throw new Error('This is an unhandled JavaScript error for testing')
  }

  @Get('async-error')
  @ApiOperation({ summary: 'Trigger async error' })
  @ApiResponse({ status: 500, description: 'Async error' })
  async triggerAsyncError() {
    this.logger.error('Manually triggered async error for testing')
    
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('This is an async error for testing'))
      }, 100)
    })
  }

  @Get('database-error')
  @ApiOperation({ summary: 'Simulate database error' })
  @ApiResponse({ status: 500, description: 'Database error' })
  triggerDatabaseError() {
    this.logger.error('Simulating database error for testing')
    
    // Simulate a database connection error
    const dbError = new Error('Connection to database failed')
    dbError.name = 'DatabaseConnectionError'
    ;(dbError as any).code = 'ECONNREFUSED'
    
    throw dbError
  }

  @Get('validation-error')
  @ApiOperation({ summary: 'Simulate validation error' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  triggerValidationError() {
    this.logger.warn('Simulating validation error for testing')
    
    throw new BadRequestException([
      'name should not be empty',
      'email must be a valid email',
      'age must be a positive number',
    ])
  }

  @Post('sentry-test')
  @ApiOperation({ summary: 'Send custom error to Sentry' })
  @ApiResponse({ status: 200, description: 'Error sent to Sentry' })
  sendCustomSentryError() {
    this.logger.log('Sending custom error to Sentry for testing')
    
    Sentry.withScope((scope) => {
      scope.setTag('test', 'backend-custom-error')
      scope.setTag('controller', 'TestErrorsController')
      scope.setLevel('warning')
      scope.setContext('testData', {
        action: 'Manual Sentry test',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      })
      scope.setUser({
        id: 'test-user',
        username: 'test',
      })
      
      Sentry.captureException(new Error('Custom test error sent to Sentry from backend'))
    })

    return {
      message: 'Custom error sent to Sentry successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('health-check')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    this.logger.log('Health check requested')
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    }
  }

  @Get('slow-endpoint')
  @ApiOperation({ summary: 'Slow endpoint for testing timeouts' })
  @ApiQuery({ name: 'delay', required: false, description: 'Delay in milliseconds' })
  @ApiResponse({ status: 200, description: 'Delayed response' })
  async slowEndpoint(@Query('delay') delay?: string) {
    const delayMs = parseInt(delay || '3000', 10)
    this.logger.log(`Slow endpoint called with ${delayMs}ms delay`)
    
    await new Promise(resolve => setTimeout(resolve, delayMs))
    
    return {
      message: `Response delayed by ${delayMs}ms`,
      timestamp: new Date().toISOString(),
    }
  }

  @Get('rate-limit')
  @ApiOperation({ summary: 'Test rate limiting' })
  @ApiResponse({ status: 200, description: 'Success if under rate limit' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  testRateLimit() {
    return { 
      message: 'Rate limit test endpoint', 
      timestamp: new Date().toISOString(),
      limit: '3 requests per minute'
    }
  }

  @Get('rate-limit-strict')
  @ApiOperation({ summary: 'Test strict rate limiting' })
  @ApiResponse({ status: 200, description: 'Success if under strict rate limit' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ strict: { limit: 2, ttl: 30000 } }) // 2 requests per 30 seconds
  testStrictRateLimit() {
    return { 
      message: 'Strict rate limit test endpoint', 
      timestamp: new Date().toISOString(),
      limit: '2 requests per 30 seconds'
    }
  }

  @Get('no-rate-limit')
  @ApiOperation({ summary: 'Test endpoint without rate limiting' })
  @ApiResponse({ status: 200, description: 'Success without rate limiting' })
  @SkipThrottle()
  testNoRateLimit() {
    return { 
      message: 'No rate limit endpoint', 
      timestamp: new Date().toISOString(),
      note: 'This endpoint is not rate limited'
    }
  }
}








