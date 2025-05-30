---
title: 'Personal AI Project Roadmap'
description: 'A roadmap for building a personal AI project'
date: 2025-05-30
author: 'Crosby'
tags: ['AI', 'Roadmap', 'Personal']
updates:
  - 2025-05-30: Initial draft (Crosby)
  - 2025-05-30: Completed Node.js API wrapper (Crosby)
---

# Personal AI Project Roadmap

## Technical Principles

1. [ ] Always have offline fallbacks
2. [ ] Prefer open models you can modify
3. [ ] Start with inference, move to fine-tuning only when needed
4. [ ] Use existing hardware before buying new

## Phase 1: Foundation & Quick Wins

### Personal Infrastructure

1. [x] Set up Ollama with Llama 3.2 and Mistral on your custom PC for baseline LLM capabilities
2. [x] Create a simple Node.js API wrapper for consistent access across your devices
3. [ ] Install Home Assistant on your older Windows laptop as a dedicated automation server
4. [ ] Set up a basic PostgreSQL + pgvector instance for future RAG implementations

### First Automation

1. [ ] **Daily Standup Assistant**: Parse your git commits, calendar, and Slack/Teams to generate a morning summary
2. [ ] **Code Review Buddy**: Local pre-commit hook using CodeLlama for basic TypeScript/JavaScript checks
3. [ ] **Meeting Transcriber**: Use Whisper to transcribe and summarize calls locally (no sensitive MLB data in the cloud)

### Edge Experiment

- Deploy TinyLlama on your iPhone for offline "coding thoughts" capture that syncs to your main system

## Phase 2: Domain-Specific Intelligence

### Kitchen & Cooking

- Train a small vision model to recognize your common ingredients using your Blink cameras
- Build a voice-activated cooking assistant using Whisper + local LLM (ask it technique questions while your hands are messy)
- Create a meal planning system that learns from your patterns and generates shopping lists

### Fitness Tracking

- Develop a kettlebell form checker using your phone camera and pose estimation models
- Build a recovery tracking system that combines sleep data, HRV (if you have a wearable), and workout logs
- Create personalized workout programming based on your history and goals

### Fly Fishing Intelligence

- Aggregate weather, water conditions, and hatch charts into a daily fishing report
- Build a fly pattern matcher using computer vision (photograph bugs, get fly recommendations)
- Create an offline mobile app for logging catches with conditions

## Phase 3: Advanced Integration & Edge Computing

### Home Office Enhancement

- Implement smart interruption filtering based on your focus patterns and meeting schedule
- Create a personal knowledge base using RAG for all your work documentation
- Build an AI pair programmer that understands your codebase and style

### Edge Deployment

- Set up Raspberry Pi stations for:
  - Kitchen: Recipe display and ingredient monitoring
  - Home gym: Form checking and rep counting
  - Entryway: Enhanced person detection with your Blink doorbell
- Deploy ESP32 devices for ultra-low power monitoring (garden, garage, etc.)

### Unified Assistant

- Create a central AI orchestrator that routes queries to appropriate models
- Implement voice control throughout your home with privacy-preserving wake word detection
- Build mobile Progressive Web App for controlling everything from anywhere

## Phase 4: Optimization & Personalization

### Model Refinement

- Fine-tune models on your specific patterns and preferences
- Implement federated learning across your edge devices
- Create specialized models for your domains (cooking, fitness, fishing, coding)

### Advanced Automation

- Predictive maintenance for home systems
- Energy optimization based on your routines
- Proactive suggestions based on calendar, weather, and historical patterns
