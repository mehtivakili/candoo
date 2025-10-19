# Price Update System Documentation

## Overview

The Price Update System is an automated solution for keeping restaurant menu prices up-to-date in your SnappFood database. It uses cron jobs to schedule periodic price updates and provides a comprehensive management interface.

## Features

- **Automated Scheduling**: Daily price updates using cron expressions
- **Manual Triggers**: On-demand price updates via API
- **Batch Processing**: Configurable limits and delays between vendors
- **Real-time Monitoring**: Live session tracking and progress monitoring
- **Error Handling**: Retry logic and comprehensive error reporting
- **Statistics Dashboard**: Price trends and update analytics
- **Persian Language Support**: Full RTL and Persian text support

## Architecture

### Core Components

1. **PriceUpdateScheduler** (`lib/price-update-scheduler.ts`)
   - Main scheduler class with cron job management
   - Handles vendor processing and price updates
   - Provides configuration and status management

2. **SchedulerManager** (`lib/scheduler-manager.ts`)
   - Singleton manager for scheduler lifecycle
   - Handles initialization and shutdown
   - Provides status monitoring

3. **API Endpoints** (`app/api/price-update/route.ts`)
   - RESTful API for scheduler management
   - Manual trigger endpoints
   - Configuration and status endpoints

4. **Management Interface** (`app/price-update-management/page.tsx`)
   - React-based dashboard
   - Real-time monitoring
   - Configuration management

## Installation

### 1. Install Dependencies

```bash
npm install node-cron @types/node-cron
```

### 2. Database Setup

Ensure your PostgreSQL database is set up with the `menus` table as defined in `database-setup.sql`.

### 3. Environment Variables

Make sure your database connection variables are set:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=candoo
DB_USER=postgres
DB_PASSWORD=your_password
```

## Usage

### Starting the Scheduler

#### Option 1: Automatic Startup (Recommended)
The scheduler will automatically start when your Next.js application starts. No additional configuration needed.

#### Option 2: Manual Startup
```bash
node scripts/start-scheduler.js
```

### API Endpoints

#### Trigger Manual Price Update
```bash
POST /api/price-update
```

#### Get Scheduler Status
```bash
GET /api/price-update
```

#### Get Price Statistics
```bash
GET /api/price-update?action=stats
```

#### Get Current Session
```bash
GET /api/price-update?action=session
```

#### Update Configuration
```bash
PUT /api/price-update
Content-Type: application/json

{
  "config": {
    "schedule": "0 6 * * *",
    "enabled": true,
    "maxVendorsPerRun": 50,
    "delayBetweenVendors": 5000,
    "retryAttempts": 3,
    "timeout": 60000
  }
}
```

#### Stop Scheduler
```bash
DELETE /api/price-update
```

### Management Interface

Access the management interface at `/price-update-management` to:

- View scheduler status and current session
- Trigger manual price updates
- Monitor real-time progress
- View price statistics
- Configure scheduler settings
- Stop/start the scheduler

## Configuration

### Scheduler Configuration

```typescript
interface PriceUpdateConfig {
  schedule: string;              // Cron expression (e.g., '0 6 * * *')
  enabled: boolean;              // Enable/disable scheduler
  maxVendorsPerRun: number;      // Max vendors per update session
  delayBetweenVendors: number;   // Delay between vendors (ms)
  retryAttempts: number;        // Retry attempts for failed vendors
  timeout: number;              // Timeout per vendor (ms)
}
```

### Default Configuration

- **Schedule**: `0 6 * * *` (6 AM daily)
- **Max Vendors**: 50 per run
- **Delay**: 5 seconds between vendors
- **Retries**: 3 attempts
- **Timeout**: 60 seconds per vendor

### Cron Expression Examples

- `0 6 * * *` - Every day at 6 AM
- `0 */6 * * *` - Every 6 hours
- `0 6 * * 1` - Every Monday at 6 AM
- `0 6 1 * *` - First day of every month at 6 AM

## Monitoring

### Session Tracking

Each price update session includes:

- **Session ID**: Unique identifier
- **Start/End Time**: Session duration
- **Vendor Count**: Total vendors processed
- **Success/Failure Count**: Processing results
- **Items Updated**: Total items updated
- **Individual Results**: Per-vendor results with errors

### Statistics

The system tracks:

- Total vendors in database
- Total menu items
- Items with discounts
- Average price
- Last update time

### Error Handling

- **Retry Logic**: Configurable retry attempts
- **Timeout Handling**: Per-vendor timeouts
- **Error Logging**: Comprehensive error tracking
- **Graceful Degradation**: Continues processing despite individual failures

## Performance Considerations

### Resource Management

- **Browser Reuse**: Reuses existing browser instances
- **Batch Processing**: Limits concurrent operations
- **Delays**: Configurable delays between operations
- **Memory Management**: Proper cleanup and resource management

### Optimization Tips

1. **Schedule During Off-Peak Hours**: Run updates when system load is low
2. **Limit Vendor Count**: Use `maxVendorsPerRun` to control resource usage
3. **Adjust Delays**: Increase `delayBetweenVendors` for slower systems
4. **Monitor Resources**: Watch CPU and memory usage during updates

## Troubleshooting

### Common Issues

#### Scheduler Not Starting
- Check database connection
- Verify environment variables
- Check for port conflicts

#### Price Updates Failing
- Verify SnappFood website accessibility
- Check browser automation setup
- Review timeout settings

#### High Resource Usage
- Reduce `maxVendorsPerRun`
- Increase `delayBetweenVendors`
- Check for memory leaks

### Logs

The system provides comprehensive logging:

- Scheduler lifecycle events
- Price update progress
- Error details and stack traces
- Performance metrics

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## Security Considerations

- **API Protection**: Implement authentication for API endpoints
- **Rate Limiting**: Consider rate limiting for manual triggers
- **Input Validation**: All inputs are validated
- **Error Handling**: Sensitive information is not exposed in errors

## Maintenance

### Regular Tasks

1. **Monitor Logs**: Check for errors and performance issues
2. **Update Dependencies**: Keep packages up-to-date
3. **Database Maintenance**: Regular database cleanup
4. **Performance Review**: Monitor resource usage

### Database Cleanup

Consider implementing periodic cleanup of old price data:

```sql
-- Example: Keep only last 30 days of price data
DELETE FROM menus 
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Support

For issues or questions:

1. Check the logs for error details
2. Review the configuration settings
3. Test with manual triggers
4. Monitor system resources

## Future Enhancements

Potential improvements:

- **Price Change Notifications**: Alert on significant price changes
- **Historical Analysis**: Price trend analysis and reporting
- **Multi-Source Support**: Support for other food delivery platforms
- **Advanced Scheduling**: More sophisticated scheduling options
- **API Rate Limiting**: Built-in rate limiting and throttling
