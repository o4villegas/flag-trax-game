#!/bin/bash

echo "Installing missing shadcn/ui components..."

# Install Sheet for mobile navigation
npx shadcn@latest add sheet --yes

# Install Dropdown Menu for user menu
npx shadcn@latest add dropdown-menu --yes

# Install Separator for visual dividers
npx shadcn@latest add separator --yes

# Install Avatar for user profiles (future enhancement)
npx shadcn@latest add avatar --yes

# Install Alert for better error messages
npx shadcn@latest add alert --yes

echo "Components installed successfully!"
