#!/bin/bash
cd ~/medicine/backend
npm install --omit=dev
cd ~/medicine
npm install -g pm2
pm2 delete all 2>/dev/null; true
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
