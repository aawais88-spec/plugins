# Plugins Project - Development Guidelines

## Overview
This project contains plugin implementations and utilities.

## Development Model
- **Default Model**: claude-haiku-4-5-20251001 (Haiku 4.5) for token efficiency
- **Token Optimization**: Enabled - using fastest model for iteration speed

## Code Style
- Clear, readable code with focused comments
- Follow existing patterns in the codebase
- Test before committing

## Workflow
1. Create feature branch: `git checkout -b feature/name`
2. Implement changes
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create PR if applicable

## Key Directories
- `plugins/` - Main plugin code
- `docs/` - Documentation
- `tests/` - Unit and integration tests

## Notes
- Keep Haiku model as default for faster iteration
- Use token-efficient prompts when possible
- Document complex logic inline
