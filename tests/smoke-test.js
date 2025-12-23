#!/usr/bin/env node

/**
 * Smoke Test for MBTA Live Tracker
 * 
 * This script performs basic smoke tests to ensure:
 * 1. Environment variables are set
 * 2. MBTA API is accessible
 * 3. Critical API endpoints return data
 * 4. Build artifacts exist (if running post-build)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

// Test 1: Check environment variables
function testEnvironmentVariables() {
    return new Promise((resolve) => {
        logInfo('Testing environment variables...');

        // Check if .env file exists
        const envPath = path.join(__dirname, '..', '.env');
        if (!fs.existsSync(envPath)) {
            log('⚠ .env file not found (checking skipped)', 'yellow');
            resolve(true); // Don't fail build for this
            return;
        }

        // Read .env file
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const hasApiKey = envContent.includes('VITE_MBTA_API_KEY=');

            if (hasApiKey) {
                logSuccess('Environment variables configured');
                resolve(true);
            } else {
                log('⚠ VITE_MBTA_API_KEY not found in .env (using public API limits)', 'yellow');
                resolve(true); // Don't fail the build, just warn
            }
        } catch (error) {
            logError(`Error reading .env file: ${error.message}`);
            resolve(false); // Fail if we can't read existing file
        }
    });
}

// Test 2: Check MBTA API connectivity
function testAPIConnectivity() {
    return new Promise((resolve) => {
        logInfo('Testing MBTA API connectivity...');

        const options = {
            hostname: 'api-v3.mbta.com',
            path: '/routes?filter[type]=0,1',
            method: 'GET',
            headers: {
                'User-Agent': 'MBTA-Tracker-Smoke-Test',
                'Accept': 'application/vnd.api+json'
            },
            timeout: 10000 // Increased timeout
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.data && Array.isArray(json.data)) {
                            logSuccess(`MBTA API accessible (${json.data.length} routes found)`);
                            resolve(true);
                        } else {
                            logError('MBTA API returned unexpected data structure');
                            resolve(false);
                        }
                    } catch (e) {
                        logError('MBTA API returned invalid JSON');
                        resolve(false);
                    }
                } else {
                    logError(`MBTA API returned status ${res.statusCode}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            logError(`MBTA API connection failed: ${error.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            logError('MBTA API request timed out');
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// Test 3: Check critical endpoints
function testCriticalEndpoints() {
    return new Promise((resolve) => {
        logInfo('Testing critical API endpoints...');

        const endpoints = [
            '/vehicles',
            '/stops',
            '/alerts'
        ];

        let completed = 0;
        let allPassed = true;

        endpoints.forEach((endpoint) => {
            const options = {
                hostname: 'api-v3.mbta.com',
                path: endpoint,
                method: 'GET',
                headers: {
                    'User-Agent': 'MBTA-Tracker-Smoke-Test',
                    'Accept': 'application/vnd.api+json'
                },
                timeout: 10000 // Increased timeout
            };

            const req = https.request(options, (res) => {
                res.on('data', () => { }); // Consume data to ensure 'end' fires

                res.on('end', () => {
                    completed++;

                    // Accept 200 OK
                    if (res.statusCode === 200) {
                        logSuccess(`Endpoint ${endpoint} accessible`);
                    } else {
                        logError(`Endpoint ${endpoint} returned status ${res.statusCode}`);
                        allPassed = false;
                    }

                    if (completed === endpoints.length) {
                        resolve(allPassed);
                    }
                });
            });

            req.on('error', () => {
                completed++;
                logError(`Endpoint ${endpoint} failed`);
                allPassed = false;

                if (completed === endpoints.length) {
                    resolve(allPassed);
                }
            });

            req.on('timeout', () => {
                completed++;
                logError(`Endpoint ${endpoint} timed out`);
                req.destroy();
                allPassed = false;

                if (completed === endpoints.length) {
                    resolve(allPassed);
                }
            });

            req.end();
        });
    });
}

// Test 4: Check build artifacts (optional)
function testBuildArtifacts() {
    return new Promise((resolve) => {
        logInfo('Checking build artifacts...');

        const distPath = path.join(__dirname, '..', 'dist');

        if (!fs.existsSync(distPath)) {
            log('⚠ Build artifacts not found (run npm run build first)', 'yellow');
            resolve(true); // Not a failure, just a warning
            return;
        }

        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            logSuccess('Build artifacts found');
            resolve(true);
        } else {
            logError('Build artifacts incomplete');
            resolve(false);
        }
    });
}

// Main test runner
async function runSmokeTests() {
    log('\n🔥 Running Smoke Tests for MBTA Live Tracker\n', 'blue');

    const results = [];

    // Run all tests
    results.push(await testEnvironmentVariables());
    results.push(await testAPIConnectivity());
    results.push(await testCriticalEndpoints());
    results.push(await testBuildArtifacts());

    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;

    log('\n' + '='.repeat(50), 'blue');

    if (passed === total) {
        logSuccess(`All ${total} smoke tests passed! ✨`);
        process.exit(0);
    } else {
        logError(`${total - passed} of ${total} tests failed`);
        process.exit(1);
    }
}

// Run tests
runSmokeTests().catch((error) => {
    logError(`Smoke tests failed with error: ${error.message}`);
    process.exit(1);
});
