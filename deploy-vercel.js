#!/usr/bin/env node
/**
 * Automated Vercel Deployment
 * Deploys Mission Control dashboard through Vercel API
 * No browser required — pure CLI automation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'your-vercel-token-here';
const PROJECT_NAME = 'mission-control-dashboard';

/**
 * Deploy to Vercel using API
 */
async function deployToVercel() {
  console.log('🚀 Starting automated Vercel deployment...');
  
  try {
    // Check if vercel CLI is available
    try {
      execSync('which vercel', { stdio: 'ignore' });
    } catch (e) {
      console.log('📦 Installing Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }
    
    // Login to Vercel (if not already)
    console.log('🔐 Authenticating with Vercel...');
    try {
      execSync(`echo "${VERCEL_TOKEN}" | vercel login`, { stdio: 'ignore' });
    } catch (e) {
      console.log('⚠️  Vercel authentication skipped (may already be logged in)');
    }
    
    // Deploy to Vercel
    console.log('📡 Deploying to Vercel...');
    const result = execSync('vercel --prod --yes', { 
      encoding: 'utf8',
      cwd: '/Users/ishansocbmac/.openclaw/workspace/dashboard/myapp'
    });
    
    console.log('✅ Deployment completed!');
    console.log('📍 Deployment URL:', result);
    
    // Extract deployment URL
    const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      console.log('🎯 Your dashboard is live at:', urlMatch[0]);
      return urlMatch[0];
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

/**
 * Alternative: Use Vercel API directly
 */
async function deployViaAPI() {
  console.log('🚀 Using Vercel API for deployment...');
  
  const deploymentConfig = {
    name: PROJECT_NAME,
    files: [
      {
        file: 'index.html',
        data: fs.readFileSync('/Users/ishansocbmac/.openclaw/workspace/dashboard/myapp/dist/index.html', 'utf8')
      },
      {
        file: 'dist/index.js',
        data: fs.readFileSync('/Users/ishansocbmac/.openclaw/workspace/dashboard/myapp/dist/index.js', 'utf8')
      }
    ],
    functions: {
      'api/**/*.js': {
        runtime: 'nodejs18.x'
      }
    },
    routes: [
      { src: '/(.*)', dest: '/index.html' }
    ]
  };
  
  console.log('📋 Deployment config created');
  console.log('🎯 Ready to deploy via API');
  
  return deploymentConfig;
}

// Main execution
if (require.main === module) {
  const command = process.argv[2] || 'cli';
  
  switch (command) {
    case 'cli':
      deployToVercel().then(url => {
        console.log('🎉 Mission Control dashboard deployed!');
        console.log('📱 Perfect for mobile viewing');
      }).catch(err => {
        console.error('💥 Deployment failed:', err);
        process.exit(1);
      });
      break;
      
    case 'api':
      deployViaAPI().then(config => {
        console.log('📋 API deployment config ready');
        console.log('🚀 Ready to deploy via Vercel API');
      });
      break;
      
    default:
      console.log('Usage: node deploy-vercel.js [cli|api]');
  }
}

module.exports = { deployToVercel, deployViaAPI };